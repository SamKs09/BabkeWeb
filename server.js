const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
require('dotenv').config();

// ----------------------------------------------------
// REQUIRED ENVIRONMENT — hard fail, never fall back to baked-in credentials.
// A forgotten --env-file must crash the container, not silently ship
// well-known passwords and a well-known JWT signing key.
// ----------------------------------------------------
const REQUIRED_ENV = [
  'SESSION_SECRET',
  'MONGODB_URI',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'COMPTABLE_USERNAME',
  'COMPTABLE_PASSWORD',
  'MEDIA_USERNAME',
  'MEDIA_PASSWORD',
  'CASHIER_USERNAME',
  'CASHIER_PASSWORD',
  'WORKER_USERNAME',
  'WORKER_PASSWORD'
];

const missingEnv = REQUIRED_ENV.filter(
  name => !process.env[name] || String(process.env[name]).trim() === ''
);

if (missingEnv.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', 'FATAL: refusing to start — required environment variables are missing or empty:');
  missingEnv.forEach(name => console.error(`  - ${name}`));
  console.error('Provide them via the container environment (compose env_file / --env-file) and restart.');
  process.exit(1);
}

const SESSION_SECRET = process.env.SESSION_SECRET;

const app = express();

// Behind the host nginx reverse proxy: trust exactly one hop so req.ip is the
// real client IP. Without this every request looks like 127.0.0.1, which turns
// submissionLimiter into a GLOBAL 15-per-10-minutes cap and makes
// express-rate-limit 8.x throw ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);
app.disable('x-powered-by');
// Express matches routes and static mounts case-INSENSITIVELY by default, while
// nginx prefix locations are case-SENSITIVE on Linux. That mismatch let
// /Admin/ slip past the landing vhost's `location ^~ /admin/ { return 404; }`
// and still be served by the app. The vhosts now use a case-insensitive regex,
// and this makes the app agree with them rather than relying on nginx alone.
app.set('case sensitive routing', true);

const PORT = process.env.PORT || 65342;

// Middleware
app.use(cookieParser());

// Explicit CORS allowlist from ALLOWED_ORIGINS (comma-separated).
// Requests with no Origin header (curl, server-to-server, same-origin
// navigations) are still allowed.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// Log each rejected origin once, so a misconfigured ALLOWED_ORIGINS is obvious
// in the container logs without spamming them.
const warnedOrigins = new Set();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (!warnedOrigins.has(origin)) {
      warnedOrigins.add(origin);
      console.warn(`CORS: origin not in ALLOWED_ORIGINS, no Access-Control-Allow-Origin sent: ${origin}`);
    }
    // Deny by withholding the header (the browser then blocks the response)
    // rather than by throwing, which would surface as a confusing HTTP 500.
    return callback(null, false);
  },
  credentials: true
}));
// Body size ceiling. This middleware runs BEFORE every route, every auth check
// and both rate limiters, so whatever is allowed here can be sent by anyone,
// unauthenticated, to any path. The old '50mb' against the container's 512m
// mem_limit was an availability risk: a parsed JSON body peaks at roughly 3x
// its wire size in heap, so a few concurrent 50mb POSTs would OOM-kill the
// container and 502 the site for every other visitor.
// 10mb is well above anything the app can actually produce: admin/admin.js
// resizes every upload to 800x800 JPEG q0.8 (~100 KB of base64) before sending,
// and images are stored inside Mongo documents, which BSON caps at 16 MB.
app.use(express.json({ limit: '10mb' })); // base64 images, client-compressed to ~100KB
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Body-parser failures (malformed JSON, oversized body) on /api return the JSON
// error envelope instead of Express's HTML page, which leaks a stack trace in dev.
app.use((err, req, res, next) => {
  if (err && req.path.startsWith('/api/')) {
    if (err.type === 'entity.parse.failed') return sendError(res, 400, 'bad_request', 'Requête invalide.');
    if (err.type === 'entity.too.large') return sendError(res, 413, 'payload_too_large', 'Requête trop volumineuse.');
  }
  next(err);
});

// ----------------------------------------------------
// MongoDB Connection — bounded retry, then exit non-zero.
// Mongoose only auto-reconnects AFTER a first successful connect, so a failed
// first connect used to leave the process up serving 10s bufferTimeoutMS 500s
// forever. Exiting lets the container restart policy take over.
// ----------------------------------------------------
const mongoURI = process.env.MONGODB_URI;

// Never log the URI itself — it carries the mongo password.
function describeMongoTarget(uri) {
  try {
    const parsed = new URL(uri);
    const dbName = (parsed.pathname || '').replace(/^\//, '') || '(default db)';
    return `${parsed.host}/${dbName}`;
  } catch (e) {
    return '(unparseable MONGODB_URI)';
  }
}

const MONGO_CONNECT_ATTEMPTS = 10;
const MONGO_RETRY_DELAY_MS = 3000;

async function connectToMongoWithRetry() {
  for (let attempt = 1; attempt <= MONGO_CONNECT_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
      console.log(`Successfully connected to MongoDB at ${describeMongoTarget(mongoURI)}`);
      await seedDatabase();
      return;
    } catch (err) {
      console.error(
        `MongoDB connection attempt ${attempt}/${MONGO_CONNECT_ATTEMPTS} to ${describeMongoTarget(mongoURI)} failed: ${err.message}`
      );
      if (attempt < MONGO_CONNECT_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, MONGO_RETRY_DELAY_MS));
      }
    }
  }

  console.error(
    `FATAL: MongoDB at ${describeMongoTarget(mongoURI)} unreachable after ${MONGO_CONNECT_ATTEMPTS} attempts. Exiting so the restart policy can take over.`
  );
  process.exit(1);
}

connectToMongoWithRetry();

// ----------------------------------------------------
// SECURITY & AUTH MIDDLEWARE
// ----------------------------------------------------

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Limit each IP to 15 order/reservation requests per windowMs
  message: { error: 'Too many requests. Please try again later.' }
});

// Loyalty card / prize wheel / menu book limiters. Each is its own instance
// (its own per-IP budget); submissionLimiter is never reused for them.
const rl = (windowMin, max) => rateLimit({ windowMs: windowMin * 60 * 1000, max,
  message: { error: 'rate_limited', message: 'Trop de requêtes. Réessayez dans quelques minutes.' } });
const publicReadLimiter    = rl(10, 120);
const loyaltyEnrollLimiter = rl(60, 5);
const loyaltyCardLimiter   = rl(10, 60);
const wheelPlayLimiter     = rl(10, 5);
const staffCodeLimiter     = rl(10, 60);

// ----------------------------------------------------
// FEATURE HELPERS (loyalty card, prize wheel, menu book)
// Every secret here is derived from SESSION_SECRET, which REQUIRED_ENV already
// hard-fails on. There is deliberately no new env var and no fallback literal.
// ----------------------------------------------------
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const FEATURE_KEY = crypto.createHmac('sha256', SESSION_SECRET).update('babke-features-v1').digest();
const featureHmac = (label, value) => crypto.createHmac('sha256', FEATURE_KEY).update(label + ':' + String(value)).digest('hex');
const sha256Hex = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const genToken = () => crypto.randomBytes(32).toString('base64url');
const genChars = (n) => { let s = ''; for (let i = 0; i < n; i++) s += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]; return s; };
const makeId = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const TUNIS_DAY_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Tunis', year: 'numeric', month: '2-digit', day: '2-digit' });
const tunisDay = (d = new Date()) => TUNIS_DAY_FMT.format(d);           // 'YYYY-MM-DD'
const TUNIS_LABEL_FMT = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Tunis', day: 'numeric', month: 'short' });
const last14Days = () => Array.from({ length: 14 }, (_, i) => tunisDay(new Date(Date.now() - (13 - i) * 86400000)));

// PHONE — personal data. Canonical form = 8 Tunisian digits, first digit 2-9.
function normalizePhone(raw) {
  let s = String(raw == null ? '' : raw).replace(/[\s\-.()\/\u00A0]/g, '');
  if (s.startsWith('+216')) s = s.slice(4);
  else if (s.startsWith('00216')) s = s.slice(5);
  else if (s.length === 11 && s.startsWith('216')) s = s.slice(3);
  return /^[2-9]\d{7}$/.test(s) ? s : null;
}
const formatPhone = (p) => `+216 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;   // +216 20 985 204
const maskPhone   = (p) => `+216 ${p.slice(0, 2)} ••• ${p.slice(5)}`;                   // +216 20 ••• 204
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} '’.\-]{1,39}$/u;
const sanitizeName = (raw) => { const s = String(raw == null ? '' : raw).replace(/[\u0000-\u001F\u007F]/g, '').trim().replace(/\s+/g, ' '); return NAME_RE.test(s) ? s : null; };
const formatCode = (c) => `${c.slice(0, 2)}-${c.slice(2, 6)}-${c.slice(6, 10)}`;
function normalizeCode(raw) {
  let s = String(raw == null ? '' : raw).trim();
  if (/^babke:w:/i.test(s)) s = s.slice(8);
  s = s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^BK[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/.test(s) ? s : null;
}
const sendError = (res, status, error, message, extra = {}) => res.status(status).json({ error, message, ...extra });
// trilingual text: returns {fr,en,tn} of trimmed strings capped at max, or null when fr is empty
function pickLoc(obj, max) {
  if (!obj || typeof obj !== 'object') return null;
  const out = {};
  for (const l of ['fr', 'en', 'tn']) out[l] = String(obj[l] == null ? '' : obj[l]).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
  return out.fr ? out : null;
}
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

const authMiddleware = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) {
    // `error` keeps its historic string (old admin code reads it); `message`
    // is added so the new endpoints honour the spec 0.13 {error, message} envelope.
    return res.status(401).json({ error: 'Unauthorized access. Token missing.', message: 'Session expirée. Reconnectez-vous.' });
  }
  try {
    const verified = jwt.verify(token, SESSION_SECRET);
    req.admin = verified;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized access. Invalid or expired token.', message: 'Session expirée. Reconnectez-vous.' });
  }
};

const ownerOnlyMiddleware = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Owner permissions required.' });
  }
  next();
};

// Role allow-list for the loyalty / wheel / menu-book admin routes.
const requireRoles = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) return sendError(res, 403, 'forbidden', 'Accès refusé pour ce rôle.');
  next();
};


// ----------------------------------------------------
// MONGOOSE MODELS
// ----------------------------------------------------

const Menu = mongoose.model('Menu', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  category: String,
  price: Number,
  image: String,
  fallbackImage: String,
  title: mongoose.Schema.Types.Mixed,
  description: mongoose.Schema.Types.Mixed,
  tags: mongoose.Schema.Types.Mixed,
  available: { type: Boolean, default: true }
}, { strict: false }));

const Content = mongoose.model('Content', new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  hero: mongoose.Schema.Types.Mixed,
  story: mongoose.Schema.Types.Mixed,
  contact: mongoose.Schema.Types.Mixed,
  socials: mongoose.Schema.Types.Mixed,
  delivery: mongoose.Schema.Types.Mixed,
  footer: mongoose.Schema.Types.Mixed
}));

const Review = mongoose.model('Review', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  stars: Number,
  date: String,
  text: String,
  author: String,
  role: String,
  avatar: String,
  featured: Boolean,
  hidden: Boolean
}));

const Gallery = mongoose.model('Gallery', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  image: String,
  alt: String,
  likes: String,
  link: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: mongoose.Schema.Types.Mixed,
  items: mongoose.Schema.Types.Mixed,
  subtotal: Number,
  status: String,
  createdAt: { type: Date, default: Date.now }
}));

const Reservation = mongoose.model('Reservation', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  date: String,
  time: String,
  guests: Number,
  notes: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
}));

const Event = mongoose.model('Event', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  image: String,
  fallbackImage: String,
  title: mongoose.Schema.Types.Mixed,
  date: String,
  duration: mongoose.Schema.Types.Mixed,
  location: mongoose.Schema.Types.Mixed,
  description: mongoose.Schema.Types.Mixed,
  status: String
}));

const Leftover = mongoose.model('Leftover', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  item: { type: String, required: true }, // "kebab", "chich_taouk", "chicken_legs", "crispy", "falafel"
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' }, // 'kg' or 'sticks'
  createdAt: { type: Date, default: Date.now }
}));

const Expense = mongoose.model('Expense', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  category: { type: String, required: true }, // "worker_extra", "fournisseur", "ingredients", "maintenance", "other"
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'cash' }, // 'cash', 'card', 'bank_transfer'
  recordedBy: { type: String, default: 'cashier' }, // 'admin', 'cashier'
  createdAt: { type: Date, default: Date.now }
}));

const RuinedProduct = mongoose.model('RuinedProduct', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  reason: { type: String, required: true }, // "Cramé", "Périmé", "Erreur Préparation", "Stockage Défectueux", "Autre"
  recordedBy: { type: String, default: 'worker' },
  createdAt: { type: Date, default: Date.now }
}));

const ProductType = mongoose.model('ProductType', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, default: 'general' },
  defaultUnit: { type: String, default: 'kg' },
  minStockAlert: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now }
}));

const StockMovement = mongoose.model('StockMovement', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  productName: { type: String, required: true },
  type: { type: String, required: true }, // 'IN' (purchase) or 'OUT' (withdrawal)
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  unitPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
  reason: { type: String, default: '' },
  recordedBy: { type: String, default: 'comptable' },
  createdAt: { type: Date, default: Date.now }
}));

const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true }, // ISO or formatted date-time string
  userRole: { type: String, required: true },
  username: { type: String, required: true },
  actionType: { type: String, required: true },
  details: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}));

const AccountingSheet = mongoose.model('AccountingSheet', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sheetType: { type: String, required: true }, // 'sahloul_jfs', 'frits', 'nettoyage', 'poulet_viandes'
  date: String,
  article: String,
  quantity: Number,
  unitValue: Number,
  total: Number,
  cuisseQty: Number, cuisseVal: Number, cuisseTot: Number,
  blancQty: Number, blancVal: Number, blancTot: Number,
  escalopeQty: Number, escalopeVal: Number, escalopeTot: Number,
  cuisseCompQty: Number, cuisseCompVal: Number, cuisseCompTot: Number,
  oeufQty: Number, oeufVal: Number, oeufTot: Number,
  recordedBy: { type: String, default: 'comptable' },
  createdAt: { type: Date, default: Date.now }
}, { strict: false }));

// ----------------------------------------------------
// LOYALTY CARD MODELS ("Carte Babke")
// findOneAndUpdate does not run validators: every write is validated in its route.
// ----------------------------------------------------
const LoyaltyProgram = mongoose.model('LoyaltyProgram', new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  active: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  cardTitle: mongoose.Schema.Types.Mixed,          // {fr,en,tn} ≤ 40
  stampRule: mongoose.Schema.Types.Mixed,          // {fr,en,tn} ≤ 120
  stampGoal: { type: Number, default: 10 },        // 4..20
  welcomeBonus: { type: Number, default: 1 },      // 0..5
  maxStampsPerDay: { type: Number, default: 3 },   // 1..10
  tiers: { type: [{ _id: false, id: String, stamps: Number, reward: mongoose.Schema.Types.Mixed, active: Boolean }], default: [] },
  updatedAt: { type: Date, default: Date.now }
}));

const loyaltyMemberSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },            // 'lm_<ts>_<6hex>'
  phone: { type: String, required: true, unique: true },         // canonical 8 digits
  firstName: { type: String, default: '' },
  stamps: { type: Number, default: 0 },
  lifetimeStamps: { type: Number, default: 0 },
  stampDay: { type: String, default: '' },                       // tunisDay of last positive stamp
  stampsToday: { type: Number, default: 0 },
  lastStampRequestId: { type: String, default: '' },
  lastRedeemRequestId: { type: String, default: '' },
  redemptions: { type: [{ _id: false, tierId: String, stamps: Number, reward: mongoose.Schema.Types.Mixed, at: Date, by: String }], default: [] }, // newest first, max 50
  source: { type: String, enum: ['web', 'counter'], default: 'counter' },
  consentAt: { type: Date, default: null },
  lastVisitAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});
loyaltyMemberSchema.index({ lastVisitAt: -1 });
const LoyaltyMember = mongoose.model('LoyaltyMember', loyaltyMemberSchema);

const loyaltyCardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },            // 'LC-XXXXXXXXXX'
  tokenHash: { type: String, required: true, unique: true },     // sha256Hex(cardToken)
  status: { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending' },
  memberId: { type: String, default: null, index: true },
  phone: { type: String, required: true, index: true },
  firstName: { type: String, default: '' },
  lang: { type: String, default: 'fr' },
  consentAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  activatedAt: { type: Date, default: null },
  activatedBy: { type: String, default: null },
  revokedAt: { type: Date, default: null },
  lastSeenAt: { type: Date, default: null },
  expireAt: { type: Date, default: null }                        // TTL: pending/revoked = now+30d; active = unset
});
loyaltyCardSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
const LoyaltyCard = mongoose.model('LoyaltyCard', loyaltyCardSchema);

const loyaltyEventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },            // 'le_<ts>_<6hex>'
  type: { type: String, required: true, enum: ['signup', 'card_activate', 'card_revoke', 'stamp', 'unstamp', 'redeem', 'wheel_stamps', 'member_update', 'member_delete'] },
  memberId: { type: String, default: null },
  count: { type: Number, default: 0 },
  tierId: { type: String, default: null },
  reward: mongoose.Schema.Types.Mixed,
  byRole: { type: String, default: 'system' },
  byUser: { type: String, default: 'system' },
  day: { type: String, required: true },
  at: { type: Date, default: Date.now }
});
loyaltyEventSchema.index({ at: -1 });
loyaltyEventSchema.index({ memberId: 1, at: -1 });
loyaltyEventSchema.index({ day: 1, type: 1 });
const LoyaltyEvent = mongoose.model('LoyaltyEvent', loyaltyEventSchema);

// ----------------------------------------------------
// PRIZE WHEEL MODELS ("La Roue Babke")
// Weights, stock and the prize pool live ONLY here and in WHEEL_SEED below.
// None of it is ever sent to a public response, /api/all-data or defaultData.js.
// ----------------------------------------------------
const WheelConfig = mongoose.model('WheelConfig', new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  enabled: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  cooldownHours: { type: Number, default: 168 },     // per phone, 1..2160
  ipMaxPlaysPerDay: { type: Number, default: 6 },    // per IP, rolling 24h, 1..50
  dailyWinCap: { type: Number, default: 40 },        // non-lose results per Tunis day, 1..1000
  codeValidityDays: { type: Number, default: 14 },   // 1..90
  rules: mongoose.Schema.Types.Mixed,                // {fr,en,tn} ≤ 800
  // NB: the segment field is literally called "type", so it MUST be declared as
  // `type: { type: String }`. A bare `type: String` makes Mongoose read the whole
  // element as a String and cast `segments` to [String].
  segments: { type: [{ _id: false, id: String, label: mongoose.Schema.Types.Mixed, type: { type: String }, stamps: Number, weight: Number, tone: String, active: Boolean }], default: [] },
  updatedAt: { type: Date, default: Date.now }
}));
// segment: type ∈ 'prize'|'stamps'|'lose'; stamps 1..10 iff type==='stamps' else null;
// weight integer 0..10000; tone ∈ 'ember'|'brass'|'charcoal'|'tile'|'herb'; label {fr,en,tn} ≤ 24 each.

const WheelStock = mongoose.model('WheelStock', new mongoose.Schema({
  segmentId: { type: String, required: true, unique: true },   // doc exists ⇔ segment stock is limited
  left: { type: Number, required: true },
  total: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}));

const wheelThrottleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },   // 'p:<phone>' or 'i:<ipHash>'
  kind: { type: String, enum: ['phone', 'ip'] },
  lastPlayAt: { type: Date },
  windowStart: { type: Date },
  plays: { type: Number, default: 0 },
  expireAt: { type: Date }                                // now + 100 days on every write
});
wheelThrottleSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
const WheelThrottle = mongoose.model('WheelThrottle', wheelThrottleSchema);

const WheelDaily = mongoose.model('WheelDaily', new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  plays: { type: Number, default: 0 },
  wins: { type: Number, default: 0 }
}));

const wheelPlaySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },             // 'wp_<ts>_<6hex>'
  requestId: { type: String, required: true, unique: true },      // client UUID, idempotency key
  phone: { type: String, required: true },
  firstName: { type: String, default: '' },
  consentAt: { type: Date, required: true },
  lang: { type: String, default: 'fr' },
  ipHash: { type: String, default: '' },
  configVersion: { type: Number, required: true },
  segmentId: { type: String, required: true },
  segmentIndex: { type: Number, required: true },                 // index in the PUBLIC segments array at draw time
  segmentLabel: mongoose.Schema.Types.Mixed,                      // snapshot {fr,en,tn}
  type: { type: String, enum: ['prize', 'stamps', 'lose'], required: true },
  stamps: { type: Number, default: null },
  result: { type: String, enum: ['win', 'lose'], required: true },
  code: { type: String, unique: true, sparse: true },             // stored form 'BKXXXXXXXX', wins only
  status: { type: String, enum: ['lost', 'won', 'redeemed', 'void'], required: true },
  expiresAt: { type: Date, default: null },
  redeemedAt: { type: Date, default: null },
  redeemedBy: { type: String, default: null },
  redeemedMemberId: { type: String, default: null },
  voidReason: { type: String, default: null },
  day: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  purgeAt: { type: Date }                                         // lost: +90d, win: +400d
});
wheelPlaySchema.index({ phone: 1, createdAt: -1 });
wheelPlaySchema.index({ status: 1, expiresAt: 1 });
wheelPlaySchema.index({ createdAt: -1 });
wheelPlaySchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
const WheelPlay = mongoose.model('WheelPlay', wheelPlaySchema);

// ----------------------------------------------------
// MENU BOOK MODEL ("Le Carnet")
// ----------------------------------------------------
const MenuBookSettings = mongoose.model('MenuBookSettings', new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  enabled: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  itemsPerPage: { type: Number, default: 3 },         // 2..4
  showSoldOut: { type: Boolean, default: true },
  cover: mongoose.Schema.Types.Mixed,                 // { kicker:{fr,en,tn}≤40, title:{…}≤30, subtitle:{…}≤80 }
  categories: { type: [{ _id: false, id: String, title: mongoose.Schema.Types.Mixed, kicker: mongoose.Schema.Types.Mixed, visible: Boolean }], default: [] },
  housePage: mongoose.Schema.Types.Mixed,             // { title:{…}≤30, body:{…}≤400 }
  backPage: mongoose.Schema.Types.Mixed,              // { note:{…}≤120 }
  updatedAt: { type: Date, default: Date.now }
}));

// Helper to record timestamped audit log
async function createAuditLog(userRole, username, actionType, details) {
  try {
    const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date();
    const timestampStr = now.toLocaleDateString('fr-FR') + ' à ' + now.toLocaleTimeString('fr-FR');
    const log = new AuditLog({
      id: logId,
      timestamp: timestampStr,
      userRole: userRole || 'system',
      username: username || 'user',
      actionType: actionType,
      details: details
    });
    await log.save();
    sendSseNotification('newAuditLog', log);
    return log;
  } catch (err) {
    console.error('Error creating audit log:', err);
  }
}



// ----------------------------------------------------
// DATABASE SEEDING
// ----------------------------------------------------

// Prize wheel defaults. Server-only: never exported, never served. The wheel is
// seeded DISABLED so the owner reviews the odds before turning it on.
// Weights total 100: 46% lose, 32% seals, 22% food (34 / 7.5 / 8.5 / 12.5 DT).
const WHEEL_SEED = {
  config: {
    enabled: false, cooldownHours: 168, ipMaxPlaysPerDay: 6, dailyWinCap: 40, codeValidityDays: 14,
    rules: {
      fr: "Jeu gratuit, sans obligation d'achat. Une participation par numéro de téléphone tous les 7 jours. Lots valables 14 jours, à retirer au comptoir de Babke, Avenue des Orangers, Hammam Sousse, sur présentation du code. Lots dans la limite des stocks disponibles, non échangeables contre des espèces. Les sceaux gagnés sont crédités sur la Carte Babke au comptoir.",
      en: "Free game, no purchase necessary. One entry per phone number every 7 days. Prizes are valid for 14 days and collected at the Babke counter, Avenue des Orangers, Hammam Sousse, on showing the code. While stocks last; no cash alternative. Seals won are added to your Babke Card at the counter.",
      tn: "لعبة بلاش و ما تلزمكش تشري. مشاركة وحدة لكل نومرو كل 7 أيام. الهدية صالحة 14 يوم، تخوذها من الكونتوار متاع بابكي، شارع البرتقال، حمام سوسة، كي تورّي الكود. في حدود الكمية الموجودة و ما تتبدّلش بالفلوس. الطوابع اللي تربحها تتزاد في كارت بابكي في الكونتوار."
    },
    segments: [
      { id: "seg-royal",    type: "prize",  stamps: null, weight: 1,  tone: "ember",    active: true, label: { fr: "Plat Royal offert",     en: "Free Royal Platter",   tn: "طبق ملكي بلاش" } },
      { id: "seg-miss-1",   type: "lose",   stamps: null, weight: 24, tone: "charcoal", active: true, label: { fr: "Pas cette fois",        en: "Not this time",        tn: "المرة الجاية" } },
      { id: "seg-seal-1",   type: "stamps", stamps: 1,    weight: 20, tone: "brass",    active: true, label: { fr: "+1 sceau",              en: "+1 seal",              tn: "+1 طابع" } },
      { id: "seg-taboule",  type: "prize",  stamps: null, weight: 12, tone: "herb",     active: true, label: { fr: "Taboulé offert",        en: "Free Tabbouleh",       tn: "تبولة بلاش" } },
      { id: "seg-miss-2",   type: "lose",   stamps: null, weight: 22, tone: "charcoal", active: true, label: { fr: "Presque !",             en: "So close!",            tn: "قريب!" } },
      { id: "seg-seal-2",   type: "stamps", stamps: 2,    weight: 12, tone: "brass",    active: true, label: { fr: "+2 sceaux",             en: "+2 seals",             tn: "+2 طوابع" } },
      { id: "seg-baba",     type: "prize",  stamps: null, weight: 7,  tone: "tile",     active: true, label: { fr: "Baba Ghanoush offert",  en: "Free Baba Ghanoush",   tn: "بابا غنوج بلاش" } },
      { id: "seg-chawarma", type: "prize",  stamps: null, weight: 2,  tone: "ember",    active: true, label: { fr: "Chawarma offert",       en: "Free Shawarma",        tn: "شاورما بلاش" } }
    ]
  },
  stock: [
    { segmentId: "seg-royal", left: 3 }, { segmentId: "seg-taboule", left: 25 },
    { segmentId: "seg-baba", left: 15 }, { segmentId: "seg-chawarma", left: 8 }
  ]
};

const FEATURE_MODELS = [LoyaltyProgram, LoyaltyMember, LoyaltyCard, LoyaltyEvent, WheelConfig, WheelStock, WheelThrottle, WheelDaily, WheelPlay, MenuBookSettings];

// Idempotent: create-if-missing, never overwrite. Called from seedDatabase() on
// every boot, and lazily if a singleton ever goes missing at request time.
async function seedFeatureDefaults() {
  // The wheel gates, stock and codes rely on unique indexes; make sure they are
  // built before the first request can race on an empty collection.
  await Promise.all(FEATURE_MODELS.map(M => M.init().catch(err => {
    console.error('[feature-indexes]', M.modelName, err && err.code === 11000 ? 'E11000 duplicate key' : (err && err.message));
  })));
  const dd = require('./data/defaultData.js');
  await LoyaltyProgram.updateOne({ key: 'main' }, { $setOnInsert: { key: 'main', ...dd.loyaltyProgram, version: 1, updatedAt: new Date() } }, { upsert: true });
  await MenuBookSettings.updateOne({ key: 'main' }, { $setOnInsert: { key: 'main', ...dd.menuBook, version: 1, updatedAt: new Date() } }, { upsert: true });
  const wr = await WheelConfig.updateOne({ key: 'main' }, { $setOnInsert: { key: 'main', ...WHEEL_SEED.config, version: 1, updatedAt: new Date() } }, { upsert: true });
  if (wr.upsertedCount) {
    for (const s of WHEEL_SEED.stock) await WheelStock.updateOne({ segmentId: s.segmentId }, { $setOnInsert: { ...s, total: s.left, updatedAt: new Date() } }, { upsert: true });
    console.log('Seeded loyalty program, menu book and (disabled) prize wheel defaults.');
  }
}

async function seedDatabase() {
  try {
    const defaultData = require('./data/defaultData.js');

    // Seed Menu
    const menuCount = await Menu.countDocuments();
    if (menuCount === 0) {
      await Menu.insertMany(defaultData.menu);
      console.log('Seeded Menu collection successfully.');
    }

    // Seed Content
    const contentCount = await Content.countDocuments();
    if (contentCount === 0) {
      await Content.create({ key: 'main', ...defaultData.content });
      console.log('Seeded Content collection successfully.');
    }

    // Seed Reviews
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      await Review.insertMany(defaultData.reviews);
      console.log('Seeded Reviews collection successfully.');
    }

    // Seed Gallery
    const galleryCount = await Gallery.countDocuments();
    if (galleryCount === 0) {
      await Gallery.insertMany(defaultData.gallery);
      console.log('Seeded Gallery collection successfully.');
    } else {
      // Check if we need to migrate/add default links
      const sample = await Gallery.findOne();
      if (sample && sample.link === undefined) {
        console.log('Migrating Gallery collection to add links...');
        const currentGallery = await Gallery.find();
        for (const item of currentGallery) {
          const defaultItem = defaultData.gallery.find(g => g.id === item.id);
          item.link = defaultItem ? defaultItem.link : 'https://www.instagram.com/babke_kebab/';
          await item.save();
        }
        console.log('Gallery collection migrated successfully.');
      }
    }

    // Seed Events
    const eventsCount = await Event.countDocuments();
    if (eventsCount === 0) {
      await Event.insertMany(defaultData.events || []);
      console.log('Seeded Events collection successfully.');
    }
    // NOTE: there is deliberately no else-branch here. The previous code
    // force-reset evt-0 / evt-1 back to status:"published" with hardcoded
    // dates on every boot, which republished events staff had cancelled
    // after every single deploy. Existing events are now left alone.

    // Seed Orders
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      const seedOrders = [
        {
          id: "ORD-1719000000",
          customer: { name: "Ahmed Mansour", phone: "+216 98 765 432", address: "Hammam Sousse, near Monoprix" },
          items: [{ name: "Chicken Shawarma Wrap", qty: 2, price: 12.5, spice: "Spicy", addons: ["Extra Cheddar"], exclusions: [] }],
          subtotal: 28.0,
          status: "delivered",
          createdAt: new Date("2026-06-21T18:32:00.000Z")
        },
        {
          id: "ORD-1719010000",
          customer: { name: "Sophie Dubois", phone: "+216 22 334 455", address: "Port El Kantaoui, Appt 4B" },
          items: [
            { name: "Plat Royal Babke", qty: 1, price: 34.0, spice: "Medium", addons: [], exclusions: ["No Onions"] },
            { name: "Smoky Baba Ghanoush", qty: 1, price: 8.5, spice: "Mild", addons: [], exclusions: [] }
          ],
          subtotal: 42.5,
          status: "preparing",
          createdAt: new Date("2026-06-22T10:15:00.000Z")
        }
      ];
      await Order.insertMany(seedOrders);
      console.log('Seeded Orders collection successfully.');
    }

    // Seed Reservations
    const reservationCount = await Reservation.countDocuments();
    if (reservationCount === 0) {
      const seedReservations = [
        {
          id: "RES-1719000000",
          name: "Yassine Dridi",
          phone: "+216 55 443 322",
          date: "2026-06-23",
          time: "20:00",
          guests: 4,
          notes: "Outdoor seating preferred, table in the shade",
          status: "confirmed",
          createdAt: new Date("2026-06-21T14:10:00.000Z")
        },
        {
          id: "RES-1719010000",
          name: "Amira Ben Ali",
          phone: "+216 99 887 766",
          date: "2026-06-22",
          time: "13:30",
          guests: 2,
          notes: "Anniversary dinner, surprise dessert if possible",
          status: "pending",
          createdAt: new Date("2026-06-22T09:45:00.000Z")
        }
      ];
      await Reservation.insertMany(seedReservations);
      console.log('Seeded Reservations collection successfully.');
    }

    // Seed Leftovers
    const leftoverCount = await Leftover.countDocuments();
    if (leftoverCount === 0) {
      const today = new Date();
      const formatStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const day1 = new Date(today.getTime() - 24 * 3600 * 1000);
      const day2 = new Date(today.getTime() - 2 * 24 * 3600 * 1000);
      
      const seedLeftovers = [
        { id: "left-1", date: formatStr(day2), item: "Kebab", quantity: 3.5, unit: "kg" },
        { id: "left-2", date: formatStr(day2), item: "Chich Taouk", quantity: 15, unit: "sticks" },
        { id: "left-3", date: formatStr(day1), item: "Chicken Shawarma", quantity: 4.2, unit: "kg" },
        { id: "left-4", date: formatStr(day1), item: "Crispy", quantity: 8, unit: "sticks" }
      ];
      await Leftover.insertMany(seedLeftovers);
      console.log('Seeded Leftovers collection successfully.');
    }

    // Seed Expenses
    const expenseCount = await Expense.countDocuments();
    if (expenseCount === 0) {
      const seedExpenses = defaultData.expenses || [];
      if (seedExpenses.length > 0) {
        await Expense.insertMany(seedExpenses);
        console.log('Seeded Expenses collection successfully.');
      }
    }

    // Seed Product Types (Physical Sheet Articles Sync)
    // This used to deleteMany({}) + insertMany on every boot, silently
    // reverting every staff-created product type on each container restart.
    // It is now an idempotent top-up; the destructive path is opt-in only.
    const defaultProductTypes = defaultData.productTypes || [];
    const ptCount = await ProductType.countDocuments();

    if (ptCount === 0) {
      if (defaultProductTypes.length > 0) {
        await ProductType.insertMany(defaultProductTypes);
        console.log(`Seeded ProductType collection with ${defaultProductTypes.length} physical sheet articles successfully.`);
      }
    } else if (process.env.FORCE_RESEED_PRODUCT_TYPES === 'true') {
      console.warn('\x1b[33m%s\x1b[0m', 'FORCE_RESEED_PRODUCT_TYPES=true — wiping ProductType collection and re-inserting defaults. Staff-created product types will be LOST.');
      await ProductType.deleteMany({});
      await ProductType.insertMany(defaultProductTypes);
      console.log('ProductType collection force-reseeded from defaults.');
    } else {
      // Insert only the defaults that are missing. $setOnInsert means an
      // existing document (default or staff-created) is never modified.
      let insertedCount = 0;
      for (const pt of defaultProductTypes) {
        const result = await ProductType.updateOne(
          { id: pt.id },
          { $setOnInsert: pt },
          { upsert: true }
        );
        if (result.upsertedCount) insertedCount++;
      }
      if (insertedCount > 0) {
        console.log(`ProductType collection topped up with ${insertedCount} missing default article(s); existing entries left untouched.`);
      }
    }

    // Seed Stock Movements
    const smCount = await StockMovement.countDocuments();
    if (smCount === 0 && defaultData.stockMovements) {
      await StockMovement.insertMany(defaultData.stockMovements);
      console.log('Seeded StockMovement collection successfully.');
    }

    // Seed Ruined Products
    const rpCount = await RuinedProduct.countDocuments();
    if (rpCount === 0 && defaultData.ruinedProducts) {
      await RuinedProduct.insertMany(defaultData.ruinedProducts);
      console.log('Seeded RuinedProduct collection successfully.');
    }

    // Seed Audit Logs
    const alCount = await AuditLog.countDocuments();
    if (alCount === 0 && defaultData.auditLogs) {
      await AuditLog.insertMany(defaultData.auditLogs);
      console.log('Seeded AuditLog collection successfully.');
    }

    // Seed Accounting Sheets
    const asCount = await AccountingSheet.countDocuments();
    if (asCount === 0 && defaultData.accountingSheets) {
      const docsToInsert = [];
      const sheets = defaultData.accountingSheets;
      for (const sheetType in sheets) {
        sheets[sheetType].forEach(item => {
          docsToInsert.push({ ...item, sheetType: sheetType, recordedBy: 'comptable' });
        });
      }
      if (docsToInsert.length > 0) {
        await AccountingSheet.insertMany(docsToInsert);
        console.log(`Seeded ${docsToInsert.length} AccountingSheet entries successfully.`);
      }
    }

    // Loyalty program, menu book settings and prize wheel (create-if-missing).
    await seedFeatureDefaults();

  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// Consolidated All Data
app.get('/api/all-data', async (req, res) => {
  try {
    const menu = await Menu.find().lean();
    const contentDoc = await Content.findOne({ key: 'main' }).lean() || {};
    const reviews = await Review.find().lean();
    const gallery = await Gallery.find().lean();
    const events = await Event.find().lean();
    const productTypes = await ProductType.find().sort({ createdAt: 1 }).lean();
    // Menu book settings are public. Nothing about loyalty or the wheel is ever added here.
    const menuBookDoc = await MenuBookSettings.findOne({ key: 'main' }).lean();

    // Check if authenticated to include protected state
    let orders = [];
    let reservations = [];
    let leftovers = [];
    let expenses = [];
    let ruinedProducts = [];
    let stockMovements = [];
    let auditLogs = [];
    let accountingSheets = { sahloul_jfs: [], frits: [], nettoyage: [], poulet_viandes: [] };

    const token = req.cookies.admin_token;
    if (token) {
      try {
        const verified = jwt.verify(token, SESSION_SECRET);
        leftovers = await Leftover.find().sort({ date: -1, createdAt: -1 }).lean();
        ruinedProducts = await RuinedProduct.find().sort({ date: -1, createdAt: -1 }).lean();
        stockMovements = await StockMovement.find().sort({ date: -1, createdAt: -1 }).lean();

        const allSheets = await AccountingSheet.find().sort({ date: 1, createdAt: 1 }).lean();
        allSheets.forEach(s => {
          if (!accountingSheets[s.sheetType]) accountingSheets[s.sheetType] = [];
          accountingSheets[s.sheetType].push(s);
        });

        if (verified.role === 'admin' || verified.role === 'comptable' || verified.role === 'cashier') {
          orders = await Order.find().sort({ createdAt: -1 }).lean();
          reservations = await Reservation.find().sort({ createdAt: -1 }).lean();
          expenses = await Expense.find().sort({ date: -1, createdAt: -1 }).lean();
        }

        if (verified.role === 'admin' || verified.role === 'comptable') {
          auditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
        }
      } catch (e) {
        // Invalid token
      }
    }

    res.json({
      menu,
      content: contentDoc,
      reviews,
      gallery,
      orders,
      reservations,
      events,
      leftovers,
      expenses,
      ruinedProducts,
      productTypes,
      stockMovements,
      auditLogs,
      accountingSheets,
      menuBook: menuBookDoc ? menuBookPublicView(menuBookDoc) : null
    });
  } catch (err) {
    console.error('Error fetching all data:', err);
    res.status(500).json({ error: 'Server error fetching all database state.' });
  }
});

// Admin login verification route
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  // No fallbacks: every one of these is validated at boot by REQUIRED_ENV.
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  const comptableUser = process.env.COMPTABLE_USERNAME;
  const comptablePass = process.env.COMPTABLE_PASSWORD;

  const mediaUser = process.env.MEDIA_USERNAME;
  const mediaPass = process.env.MEDIA_PASSWORD;

  const cashierUser = process.env.CASHIER_USERNAME;
  const cashierPass = process.env.CASHIER_PASSWORD;

  const workerUser = process.env.WORKER_USERNAME;
  const workerPass = process.env.WORKER_PASSWORD;

  let role = null;
  if (username === adminUser && password === adminPass) {
    role = 'admin';
  } else if (username === comptableUser && password === comptablePass) {
    role = 'comptable';
  } else if (username === mediaUser && password === mediaPass) {
    role = 'sm_manager';
  } else if (username === cashierUser && password === cashierPass) {
    role = 'cashier';
  } else if (username === workerUser && password === workerPass) {
    role = 'worker';
  }

  if (role) {
    const token = jwt.sign(
      { username: username, role: role },
      SESSION_SECRET,
      { expiresIn: '24h' }
    );
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    await createAuditLog(role, username, 'LOGIN', `Connexion réussie de l'utilisateur (${role.toUpperCase()})`);

    res.json({ success: true, role: role });
  } else {
    res.status(401).json({ success: false, error: 'Identifiant ou mot de passe incorrect' });
  }
});

// Admin verification route
app.get('/api/admin/verify', authMiddleware, (req, res) => {
  res.json({ success: true, role: req.admin.role, username: req.admin.username });
});

// Admin logout route
app.post('/api/admin/logout', authMiddleware, async (req, res) => {
  if (req.admin) {
    await createAuditLog(req.admin.role, req.admin.username, 'LOGOUT', `Déconnexion de l'utilisateur (${req.admin.role.toUpperCase()})`);
  }
  // Must mirror the FULL option set used in res.cookie() above, or the
  // browser will not match (and therefore will not clear) the cookie.
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.json({ success: true });
});

// Admin Reset & Seed Database Route — owner only: this wipes 14 collections.
app.post('/api/admin/reset-database', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const defaultData = require('./data/defaultData.js');
    console.log('🧹 Purging all MongoDB collections via admin trigger...');

    await Promise.all([
      Menu.deleteMany({}),
      Content.deleteMany({}),
      Review.deleteMany({}),
      Gallery.deleteMany({}),
      Event.deleteMany({}),
      Order.deleteMany({}),
      Reservation.deleteMany({}),
      Leftover.deleteMany({}),
      Expense.deleteMany({}),
      ProductType.deleteMany({}),
      StockMovement.deleteMany({}),
      RuinedProduct.deleteMany({}),
      AuditLog.deleteMany({}),
      AccountingSheet.deleteMany({})
    ]);

    // Seed Menu
    await Menu.insertMany(defaultData.menu);

    // Seed Content
    await Content.create({ key: 'main', ...defaultData.content });

    // Seed Reviews
    await Review.insertMany(defaultData.reviews);

    // Seed Gallery
    await Gallery.insertMany(defaultData.gallery);

    // Seed Events
    await Event.insertMany(defaultData.events || []);

    // Seed Orders
    const seedOrders = [
      {
        id: "ORD-1719000000",
        customer: { name: "Ahmed Mansour", phone: "+216 98 765 432", address: "Hammam Sousse, near Monoprix" },
        items: [{ name: "Chicken Shawarma Wrap", qty: 2, price: 12.5, spice: "Spicy", addons: ["Extra Cheddar"], exclusions: [] }],
        subtotal: 28.0,
        status: "delivered",
        createdAt: new Date("2026-06-21T18:32:00.000Z")
      },
      {
        id: "ORD-1719010000",
        customer: { name: "Sophie Dubois", phone: "+216 22 334 455", address: "Port El Kantaoui, Appt 4B" },
        items: [
          { name: "Plat Royal Babke", qty: 1, price: 34.0, spice: "Medium", addons: [], exclusions: ["No Onions"] },
          { name: "Smoky Baba Ghanoush", qty: 1, price: 8.5, spice: "Mild", addons: [], exclusions: [] }
        ],
        subtotal: 42.5,
        status: "preparing",
        createdAt: new Date("2026-06-22T10:15:00.000Z")
      }
    ];
    await Order.insertMany(seedOrders);

    // Seed Reservations
    const seedReservations = [
      {
        id: "RES-1719000000",
        name: "Yassine Dridi",
        phone: "+216 55 443 322",
        date: "2026-08-15",
        time: "20:00",
        guests: 4,
        notes: "Outdoor seating preferred, table in the shade",
        status: "confirmed",
        createdAt: new Date("2026-08-10T14:10:00.000Z")
      },
      {
        id: "RES-1719010000",
        name: "Amira Ben Ali",
        phone: "+216 99 887 766",
        date: "2026-08-16",
        time: "13:30",
        guests: 2,
        notes: "Anniversary dinner, surprise dessert if possible",
        status: "pending",
        createdAt: new Date("2026-08-12T09:45:00.000Z")
      }
    ];
    await Reservation.insertMany(seedReservations);

    // Seed Leftovers
    const today = new Date();
    const formatStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const day1 = new Date(today.getTime() - 24 * 3600 * 1000);
    const day2 = new Date(today.getTime() - 2 * 24 * 3600 * 1000);
    const seedLeftovers = [
      { id: "left-1", date: formatStr(day2), item: "Kebab", quantity: 3.5, unit: "kg" },
      { id: "left-2", date: formatStr(day2), item: "Chich Taouk", quantity: 15, unit: "sticks" },
      { id: "left-3", date: formatStr(day1), item: "Chicken Shawarma", quantity: 4.2, unit: "kg" },
      { id: "left-4", date: formatStr(day1), item: "Crispy", quantity: 8, unit: "sticks" }
    ];
    await Leftover.insertMany(seedLeftovers);

    // Seed Expenses
    await Expense.insertMany(defaultData.expenses);

    // Seed ProductTypes
    await ProductType.insertMany(defaultData.productTypes);

    // Seed StockMovements
    await StockMovement.insertMany(defaultData.stockMovements);

    // Seed RuinedProducts
    await RuinedProduct.insertMany(defaultData.ruinedProducts);

    // Seed AuditLogs
    await AuditLog.insertMany(defaultData.auditLogs);

    // Seed AccountingSheets
    const docsToInsert = [];
    const sheets = defaultData.accountingSheets;
    for (const sheetType in sheets) {
      sheets[sheetType].forEach(item => {
        docsToInsert.push({ ...item, sheetType: sheetType, recordedBy: 'comptable' });
      });
    }
    await AccountingSheet.insertMany(docsToInsert);

    await createAuditLog(req.admin.role, req.admin.username, 'DATABASE_RESET', 'Réinitialisation complète et ré-ensemencement de toutes les données du dashboard');

    res.json({ success: true, message: 'Base de données réinitialisée et ré-ensemencée avec succès !' });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ error: 'Échec de la réinitialisation de la base de données' });
  }
});

// Leftovers Endpoints
app.get('/api/leftovers', authMiddleware, async (req, res) => {
  try {
    const leftovers = await Leftover.find().sort({ date: -1, createdAt: -1 });
    res.json(leftovers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leftovers', authMiddleware, async (req, res) => {
  try {
    const leftover = new Leftover(req.body);
    await leftover.save();
    await createAuditLog(req.admin.role, req.admin.username, 'LEFTOVER_ADD', `Saisie de Restes: ${leftover.item} (${leftover.quantity} ${leftover.unit})`);
    sendSseNotification('newLeftover', leftover);
    res.status(201).json(leftover);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leftovers/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Leftover.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Leftover log not found' });
    await createAuditLog(req.admin.role, req.admin.username, 'LEFTOVER_DELETE', `Suppression de Restes: ${deleted.item}`);
    sendSseNotification('deleteLeftover', { id: req.params.id });
    res.json({ success: true, message: 'Leftover log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruined Products Endpoints
app.get('/api/ruined-products', authMiddleware, async (req, res) => {
  try {
    const items = await RuinedProduct.find().sort({ date: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ruined-products', authMiddleware, async (req, res) => {
  try {
    const item = new RuinedProduct({ ...req.body, recordedBy: req.admin.role });
    await item.save();
    await createAuditLog(req.admin.role, req.admin.username, 'RUINED_ADD', `Produit Gâté / Perte: ${item.item} (${item.quantity} ${item.unit}) - Cause: ${item.reason}`);
    sendSseNotification('newRuinedProduct', item);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/ruined-products/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await RuinedProduct.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Ruined product log not found' });
    await createAuditLog(req.admin.role, req.admin.username, 'RUINED_DELETE', `Suppression Perte: ${deleted.item}`);
    sendSseNotification('deleteRuinedProduct', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Product Types Endpoints (Managed by Comptable & Admin)
app.get('/api/product-types', authMiddleware, async (req, res) => {
  try {
    const types = await ProductType.find().sort({ name: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/product-types', authMiddleware, async (req, res) => {
  try {
    const type = new ProductType(req.body);
    await type.save();
    await createAuditLog(req.admin.role, req.admin.username, 'PRODUCT_TYPE_ADD', `Nouveau Type de Produit: ${type.name} (Unité: ${type.defaultUnit})`);
    sendSseNotification('newProductType', type);
    res.status(201).json(type);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/product-types/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await ProductType.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Product type not found' });
    await createAuditLog(req.admin.role, req.admin.username, 'PRODUCT_TYPE_DELETE', `Suppression Type Produit: ${deleted.name}`);
    sendSseNotification('deleteProductType', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock Movements Endpoints (Managed by Comptable & Admin)
app.get('/api/stock/movements', authMiddleware, async (req, res) => {
  try {
    const movements = await StockMovement.find().sort({ date: -1, createdAt: -1 });
    res.json(movements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock/movements', authMiddleware, async (req, res) => {
  try {
    const movement = new StockMovement({ ...req.body, recordedBy: req.admin.role });
    await movement.save();
    const actionName = movement.type === 'IN' ? 'Achat Stock' : 'Retrait Stock';
    await createAuditLog(req.admin.role, req.admin.username, 'STOCK_MOVEMENT', `${actionName}: ${movement.productName} (${movement.quantity} ${movement.unit}) - Coût/Fournisseur: ${movement.totalPrice} TND / ${movement.supplier || 'N/A'}`);
    sendSseNotification('newStockMovement', movement);
    res.status(201).json(movement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stock/movements/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await StockMovement.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Stock movement not found' });
    await createAuditLog(req.admin.role, req.admin.username, 'STOCK_DELETE', `Suppression Mouvement Stock: ${deleted.productName}`);
    sendSseNotification('deleteStockMovement', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accounting Sheets Endpoints (For Comptable & Propriétaire)
app.get('/api/accounting-sheets', authMiddleware, async (req, res) => {
  try {
    const sheetType = req.query.sheetType;
    const query = sheetType ? { sheetType } : {};
    const items = await AccountingSheet.find(query).sort({ date: 1, createdAt: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/accounting-sheets', authMiddleware, async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      id: req.body.id || ('as_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
      recordedBy: req.admin ? req.admin.role : 'comptable'
    };
    const item = new AccountingSheet(itemData);
    await item.save();
    await createAuditLog(req.admin.role, req.admin.username, 'ACCOUNTING_SHEET_ADD', `Saisie comptable (${item.sheetType}): ${item.article || item.date || 'Ligne de saisie'}`);
    sendSseNotification('newAccountingSheet', item);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/accounting-sheets/:id', authMiddleware, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    const updated = await AccountingSheet.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateData },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Accounting sheet entry not found' });
    await createAuditLog(req.admin.role, req.admin.username, 'ACCOUNTING_SHEET_UPDATE', `Mise à jour saisie comptable (${updated.sheetType}): ${updated.id}`);
    sendSseNotification('updateAccountingSheet', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/accounting-sheets/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await AccountingSheet.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Accounting sheet entry not found' });
    await createAuditLog(req.admin.role, req.admin.username, 'ACCOUNTING_SHEET_DELETE', `Suppression saisie comptable (${deleted.sheetType}): ${deleted.id}`);
    sendSseNotification('deleteAccountingSheet', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Logs Endpoint (For Propriétaire & Comptable)
app.get('/api/audit-logs', authMiddleware, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(150);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/leftovers', authMiddleware, async (req, res) => {
  try {
    const leftover = new Leftover(req.body);
    await leftover.save();
    sendSseNotification('newLeftover', leftover);
    res.status(201).json(leftover);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leftovers/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Leftover.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Leftover log not found' });
    sendSseNotification('deleteLeftover', { id: req.params.id });
    res.json({ success: true, message: 'Leftover log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expenses Endpoints
app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      recordedBy: req.admin ? req.admin.role : 'cashier'
    };
    const expense = new Expense(expenseData);
    await expense.save();
    sendSseNotification('newExpense', expense);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Expense log not found' });
    sendSseNotification('deleteExpense', { id: req.params.id });
    res.json({ success: true, message: 'Expense log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Keep track of active SSE connections (admin dashboard & public storefront)
let sseClients = [];
let publicSseClients = [];

app.get('/api/admin/events-stream', (req, res) => {
  // Check if admin is authenticated before starting stream
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).end();

  try {
    jwt.verify(token, SESSION_SECRET);
  } catch (err) {
    return res.status(401).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Stop nginx from buffering the stream, push the headers out immediately and
  // write a first byte so EventSource.onopen fires instead of nginx 504-ing at
  // proxy_read_timeout. The heartbeat keeps idle proxies from dropping us.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');
  res.write('retry: 5000\n\n');
  const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 25000);
  if (typeof hb.unref === 'function') hb.unref(); // never hold the event loop open on shutdown

  sseClients.push(res);

  req.on('close', () => {
    clearInterval(hb);
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Public SSE stream for real-time storefront synchronization.
// This endpoint is unauthenticated, so sendSseNotification() only forwards the
// events listed in PUBLIC_SSE_EVENTS to it (see below).
app.get('/api/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');
  res.write('retry: 5000\n\n');
  const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 25000);
  if (typeof hb.unref === 'function') hb.unref();

  publicSseClients.push(res);

  req.on('close', () => {
    clearInterval(hb);
    publicSseClients = publicSseClients.filter(client => client !== res);
  });
});

// Events anonymous storefront visitors are allowed to receive. Everything else
// (newOrder, newReservation, newExpense, newStockMovement, newLeftover,
// newRuinedProduct, newAccountingSheet, newAuditLog, newProductType, the
// delete*/update* events, reservationsChanged, ...) is admin-only, because
// those payloads carry customer names, phone numbers, addresses and internal
// financials.
const PUBLIC_SSE_EVENTS = new Set([
  'menuChanged',
  'eventsChanged',
  'contentChanged',
  'reviewsChanged',
  'galleryChanged',
  'ordersChanged'
]);

// ordersChanged is public so the storefront order tracker can refresh, but the
// public copy is reduced to the order id — never the customer object.
function toPublicSsePayload(event, data) {
  if (event !== 'ordersChanged') return data;
  if (Array.isArray(data)) return data.map(item => ({ id: item && item.id }));
  return { id: data && data.id };
}

function sendSseNotification(event, data) {
  // Admin stream: unchanged, full payload.
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (err) {
      sseClients = sseClients.filter(c => c !== client);
    }
  });

  if (!PUBLIC_SSE_EVENTS.has(event)) return;

  const publicPayload = `event: ${event}\ndata: ${JSON.stringify(toPublicSsePayload(event, data))}\n\n`;

  publicSseClients.forEach(client => {
    try {
      client.write(publicPayload);
    } catch (err) {
      publicSseClients = publicSseClients.filter(c => c !== client);
    }
  });
}

// Menu Endpoints
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await Menu.find();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const newItem = new Menu(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    const updated = await Menu.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateData },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Menu item not found' });
    sendSseNotification('menuChanged', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle/update menu item availability (accessible by cashiers, workers, and admins)
app.patch('/api/menu/:id/availability', authMiddleware, async (req, res) => {
  try {
    const { available } = req.body;
    const targetId = req.params.id;

    // Case-insensitive search for menu item ID
    let updated = await Menu.findOneAndUpdate(
      { $or: [{ id: targetId }, { id: targetId.toLowerCase() }] },
      { $set: { available: Boolean(available) } },
      { new: true }
    );

    // If item doesn't exist in MongoDB yet, upsert it from defaultData.
    // (defaultData used to be referenced here without being in scope, so this
    // branch threw a ReferenceError and 500'd for every id not yet in Mongo.)
    const defaultData = require('./data/defaultData.js');
    if (!updated && defaultData && defaultData.menu) {
      const defaultItem = defaultData.menu.find(m => m.id === targetId || m.id.toLowerCase() === targetId.toLowerCase());
      if (defaultItem) {
        const newItemData = { ...defaultItem, available: Boolean(available) };
        delete newItemData._id;
        updated = await Menu.create(newItemData);
      }
    }

    if (!updated) return res.status(404).json({ error: 'Menu item not found' });
    sendSseNotification('menuChanged', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menu/:id', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const deleted = await Menu.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    await Menu.deleteMany({});
    const updatedMenu = await Menu.insertMany(req.body);
    res.json(updatedMenu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Web Content Endpoints
app.get('/api/content', async (req, res) => {
  try {
    const content = await Content.findOne({ key: 'main' });
    res.json(content || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/content', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    // Exclude database metadata fields
    const { _id, key, ...rest } = req.body;
    const content = await Content.findOneAndUpdate(
      { key: 'main' },
      { $set: rest },
      { new: true, upsert: true }
    );
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reviews Endpoints
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const newReview = new Review(req.body);
    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reviews/:id', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const updated = await Review.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Review not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reviews/:id', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const deleted = await Review.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reviews', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    await Review.deleteMany({});
    const updatedReviews = await Review.insertMany(req.body);
    res.json(updatedReviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery Endpoints
app.get('/api/gallery', async (req, res) => {
  try {
    const gallery = await Gallery.find();
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gallery', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const newPhoto = new Gallery(req.body);
    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/gallery/:id', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const deleted = await Gallery.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Gallery photo not found' });
    res.json({ success: true, message: 'Gallery photo deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/gallery', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    await Gallery.deleteMany({});
    const updatedGallery = await Gallery.insertMany(req.body);
    res.json(updatedGallery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const https = require('https');

function scrapeInstagramLikes(url) {
  return new Promise((resolve) => {
    // Support mock posts for local testing
    if (url.includes('C-kebab1')) return resolve('1.2k');
    if (url.includes('C-shawarma2')) return resolve('954');
    if (url.includes('C-mezze3')) return resolve('821');
    if (url.includes('C-street4')) return resolve('1.5k');
    if (url.includes('C-grill5')) return resolve('1.1k');
    if (url.includes('C-chicken6')) return resolve('998');

    if (!url.includes('instagram.com/p/') && !url.includes('instagram.com/reel/')) {
      return resolve(null);
    }

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    };

    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location;
        if (redirectUrl.includes('login')) {
          return resolve(null);
        }
      }

      let html = '';
      res.on('data', (chunk) => {
        html += chunk;
        if (html.length > 2000000) {
          res.destroy();
        }
      });

      res.on('end', () => {
        try {
          const metaRegexes = [
            /content="([0-9.,kK+mM]+)\s+Likes/i,
            /([0-9.,kK+mM]+)\s+Likes,\s+[0-9.,kK+mM]+\s+Comments/i,
            /content="([0-9.,kK+mM]+)\s+likes/i
          ];

          for (const regex of metaRegexes) {
            const match = html.match(regex);
            if (match && match[1]) {
              return resolve(match[1].trim());
            }
          }

          const jsonRegexes = [
            /"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)/,
            /"edge_liked_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/
          ];

          for (const regex of jsonRegexes) {
            const match = html.match(regex);
            if (match && match[1]) {
              let count = parseInt(match[1], 10);
              if (count >= 1000) {
                return resolve((count / 1000).toFixed(1).replace('.0', '') + 'k');
              }
              return resolve(count.toString());
            }
          }

          resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

app.post('/api/gallery/scrape-likes', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Instagram URL is required' });

  try {
    const likes = await scrapeInstagramLikes(url);
    if (likes) {
      res.json({ success: true, likes });
    } else {
      res.status(404).json({ success: false, error: 'Could not fetch likes count. Please enter likes manually.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Events Endpoints
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', authMiddleware, async (req, res) => {
  try {
    const eventData = { ...req.body };
    delete eventData._id;
    const newEvent = new Event(eventData);
    await newEvent.save();
    sendSseNotification('eventsChanged', newEvent);
    res.status(201).json(newEvent);
  } catch (err) {
    console.error("Error creating event in MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', authMiddleware, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    const updated = await Event.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateData },
      { new: true, upsert: true }
    );
    sendSseNotification('eventsChanged', updated);
    res.json(updated);
  } catch (err) {
    console.error("Error updating event in MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Event not found' });
    sendSseNotification('eventsChanged', { id: req.params.id, deleted: true });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    console.error("Error deleting event from MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events', authMiddleware, async (req, res) => {
  try {
    const cleanEvents = (req.body || []).map(evt => {
      const item = { ...evt };
      delete item._id;
      return item;
    });
    await Event.deleteMany({});
    const updatedEvents = await Event.insertMany(cleanEvents);
    sendSseNotification('eventsChanged', updatedEvents);
    res.json(updatedEvents);
  } catch (err) {
    console.error("Error bulk updating events in MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

// Orders Endpoints
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', submissionLimiter, async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    sendSseNotification('newOrder', order);
    sendSseNotification('ordersChanged', order);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    sendSseNotification('ordersChanged', order);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reservations Endpoints
app.get('/api/reservations', authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reservations', submissionLimiter, async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();
    sendSseNotification('newReservation', reservation);
    sendSseNotification('reservationsChanged', reservation);
    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reservations/:id', authMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    sendSseNotification('reservationsChanged', reservation);
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// LOYALTY CARD ("Carte Babke"), PRIZE WHEEL ("La Roue Babke") AND
// MENU BOOK ("Le Carnet")
//
// COMPLIANCE (prize wheel): Nothing in this flow may mention Google, mention
// reviews or ask for a review in exchange for the prize, and the prize is never
// conditioned on anything the customer has to do first. The game is free with
// no purchase required.
//
// Logging: never log a phone number, first name, card token, play token or
// prize code. Audit details use maskPhone() and the displayed code only. IPs
// are stored only as featureHmac('ip', req.ip).slice(0, 32).
// No transactions (Mongo may be standalone): multi-step writes use conditional
// atomic updates plus explicit compensating rollbacks.
// ====================================================================

const LANGS = ['fr', 'en', 'tn'];
const REQUEST_ID_RE = /^[A-Za-z0-9-]{16,64}$/;
const CARD_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const CARD_ID_RE = /^LC-[A-Z0-9]{10}$/;
const DAY_MS = 86400000;
const HOUR_MS = 3600000;
const SEGMENT_TYPES = ['prize', 'stamps', 'lose'];
const SEGMENT_TONES = ['ember', 'brass', 'charcoal', 'tile', 'herb'];
const MEMBERS_PAGE_SIZE = 25;
const PLAYS_PAGE_SIZE = 25;
const addDays = (d, n) => new Date(+d + n * DAY_MS);
const emptyLoc = () => ({ fr: '', en: '', tn: '' });
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isDup = (err, field) => Boolean(err && err.code === 11000 &&
  (!field || (err.keyPattern && Object.prototype.hasOwnProperty.call(err.keyPattern, field)) ||
   (err.keyValue && Object.prototype.hasOwnProperty.call(err.keyValue, field))));
const iso = (d) => (d ? new Date(d).toISOString() : null);

// Error text only. E11000 messages embed the duplicate key (a phone, a code),
// so they are never printed; long digit runs and codes are scrubbed from the rest.
function safeErrMsg(err) {
  if (!err) return 'unknown error';
  if (err.code === 11000) return 'E11000 duplicate key';
  return String(err.message || err).replace(/\d{6,}/g, '[n]').replace(/BK[0-9A-Z]{8}/g, '[code]').slice(0, 300);
}
// Express 4 does not catch async rejections: every feature handler goes through this.
const featureRoute = (name, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error('[' + name + ']', safeErrMsg(err));
    if (!res.headersSent) sendError(res, 500, 'server_error', 'Erreur serveur.');
  }
};
const noStore = (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };

// Ledger write. Never throws: a failed event must not turn a committed stamp
// into a 500 that the counter would retry.
async function logLoyaltyEvent(fields) {
  try {
    await LoyaltyEvent.create({ id: makeId('le'), day: tunisDay(), at: new Date(), ...fields });
  } catch (err) {
    console.error('[loyalty-event]', safeErrMsg(err));
  }
}

async function loadProgram() {
  let p = await LoyaltyProgram.findOne({ key: 'main' }).lean();
  if (!p) { await seedFeatureDefaults(); p = await LoyaltyProgram.findOne({ key: 'main' }).lean(); }
  return p;
}
async function loadWheelConfig() {
  let c = await WheelConfig.findOne({ key: 'main' }).lean();
  if (!c) { await seedFeatureDefaults(); c = await WheelConfig.findOne({ key: 'main' }).lean(); }
  return c;
}
async function loadMenuBook() {
  let s = await MenuBookSettings.findOne({ key: 'main' }).lean();
  if (!s) { await seedFeatureDefaults(); s = await MenuBookSettings.findOne({ key: 'main' }).lean(); }
  return s;
}
const stripMeta = (doc) => { if (!doc) return doc; const { _id, __v, ...rest } = doc; return rest; };

// ---------- view builders (these ARE the response shapes) ----------
const activeTiersSorted = (p) => ((p && p.tiers) || []).filter(t => t && t.active !== false).sort((a, b) => a.stamps - b.stamps);

function programPublicView(p) {
  return {
    active: Boolean(p.active), version: p.version, cardTitle: p.cardTitle, stampRule: p.stampRule,
    stampGoal: p.stampGoal, welcomeBonus: p.welcomeBonus,
    tiers: activeTiersSorted(p).map(t => ({ id: t.id, stamps: t.stamps, reward: t.reward }))
  };
}
const programAdminView = (p) => stripMeta(p);
function programSummary(p) {
  return {
    active: Boolean(p.active), stampGoal: p.stampGoal, maxStampsPerDay: p.maxStampsPerDay,
    tiers: activeTiersSorted(p).map(t => ({ id: t.id, stamps: t.stamps, reward: t.reward }))
  };
}

function cardView(card, member, program) {
  const qr = 'babke:c:' + card.id;
  if (card.status !== 'active' || !member) {
    return { cardId: card.id, status: 'pending', firstName: card.firstName, qr };
  }
  const tiers = activeTiersSorted(program);
  const next = tiers.find(t => t.stamps > member.stamps);
  return {
    cardId: card.id, status: 'active', firstName: member.firstName, qr,
    stamps: member.stamps, lifetimeStamps: member.lifetimeStamps, stampGoal: program.stampGoal,
    nextReward: next ? { tierId: next.id, stamps: next.stamps, remaining: next.stamps - member.stamps, reward: next.reward } : null,
    unlocked: tiers.filter(t => t.stamps <= member.stamps).map(t => ({ tierId: t.id, stamps: t.stamps, reward: t.reward })),
    memberSince: tunisDay(new Date(member.createdAt))
  };
}

function memberView(m, activeCards) {
  return {
    id: m.id, phone: m.phone, phoneDisplay: formatPhone(m.phone), firstName: m.firstName,
    stamps: m.stamps, lifetimeStamps: m.lifetimeStamps,
    stampsToday: (m.stampDay === tunisDay() ? m.stampsToday : 0),
    redemptions: (m.redemptions || []).slice(0, 10), source: m.source,
    createdAt: m.createdAt, lastVisitAt: m.lastVisitAt, activeCards: activeCards || 0
  };
}
async function memberViewOne(m) {
  const activeCards = await LoyaltyCard.countDocuments({ memberId: m.id, status: 'active' });
  return memberView(m, activeCards);
}
async function memberViewsMany(members) {
  if (!members.length) return [];
  const counts = await LoyaltyCard.aggregate([
    { $match: { memberId: { $in: members.map(m => m.id) }, status: 'active' } },
    { $group: { _id: '$memberId', n: { $sum: 1 } } }
  ]);
  const byId = new Map(counts.map(c => [c._id, c.n]));
  return members.map(m => memberView(m, byId.get(m.id) || 0));
}

const publicSegments = (cfg) => ((cfg && cfg.segments) || []).filter(s => s && s.active);
function wheelPublicView(cfg) {
  if (!cfg) return { enabled: false, version: 0, cooldownDays: 7, codeValidityDays: 14, rules: emptyLoc(), segments: [] };
  return {
    enabled: Boolean(cfg.enabled), version: cfg.version,
    cooldownDays: Math.ceil(cfg.cooldownHours / 24), codeValidityDays: cfg.codeValidityDays,
    rules: cfg.rules,
    // NO weight, type, stamps, stock or left — ever.
    segments: cfg.enabled ? publicSegments(cfg).map(s => ({ id: s.id, label: s.label, tone: s.tone })) : []
  };
}
// "expired" is derived, never stored.
function playStatus(play, now = new Date()) {
  if (play.status === 'won' && play.expiresAt && new Date(play.expiresAt) <= now) return 'expired';
  return play.status;
}
const playTokenFor = (playId) => featureHmac('play', playId).slice(0, 43);
function wheelPlayView(play, cfg) {
  const win = play.result === 'win';
  const cooldownHours = cfg && Number.isFinite(cfg.cooldownHours) ? cfg.cooldownHours : 168;
  return {
    playId: play.id, playToken: playTokenFor(play.id), version: play.configVersion,
    segmentIndex: (cfg && play.configVersion === cfg.version ? play.segmentIndex : null),
    segmentId: play.segmentId, result: play.result,
    prize: win ? {
      label: play.segmentLabel, type: play.type, stamps: play.stamps,
      code: formatCode(play.code), qr: 'babke:w:' + play.code,
      expiresAt: iso(play.expiresAt), status: playStatus(play)
    } : null,
    nextPlayAt: new Date(+new Date(play.createdAt) + cooldownHours * HOUR_MS).toISOString()
  };
}
function wheelCodeView(play) {
  return {
    playId: play.id, code: formatCode(play.code), status: playStatus(play),
    prize: { label: play.segmentLabel, type: play.type, stamps: play.stamps },
    firstName: play.firstName, phoneMasked: maskPhone(play.phone),
    createdAt: play.createdAt, expiresAt: play.expiresAt, redeemedAt: play.redeemedAt,
    redeemedBy: play.redeemedBy, redeemedMemberId: play.redeemedMemberId
  };
}
async function wheelAdminView(cfg) {
  const stocks = await WheelStock.find({}).lean();
  const bySeg = new Map(stocks.map(s => [s.segmentId, { left: s.left, total: s.total }]));
  const rest = stripMeta(cfg);
  return { ...rest, segments: (cfg.segments || []).map(s => ({ ...s, stock: bySeg.get(s.id) || null })) };
}
function menuBookPublicView(s) {
  return {
    enabled: s.enabled !== false, version: s.version, itemsPerPage: s.itemsPerPage, showSoldOut: s.showSoldOut !== false,
    cover: s.cover, categories: s.categories || [], housePage: s.housePage, backPage: s.backPage
  };
}
// 14 Tunis days, oldest first, each with its "19 sept." label.
function last14DaysWithLabels() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * DAY_MS);
    return { day: tunisDay(d), label: TUNIS_LABEL_FMT.format(d) };
  });
}

// ---------- card / play header parsing ----------
function readCardToken(req) {
  const t = req.get('X-Babke-Card');
  return (typeof t === 'string' && CARD_TOKEN_RE.test(t)) ? t : null;
}
async function findPlayFromHeader(req) {
  const h = req.get('X-Babke-Play');
  if (typeof h !== 'string' || h.length > 200) return null;
  const dot = h.indexOf('.');
  if (dot <= 0) return null;
  const playId = h.slice(0, dot);
  const given = Buffer.from(h.slice(dot + 1));
  const expected = Buffer.from(playTokenFor(playId));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  return WheelPlay.findOne({ id: playId }).lean();
}

// =========================== PUBLIC: LOYALTY ===========================

// P1
app.get('/api/loyalty/program', noStore, publicReadLimiter, featureRoute('loyalty-program', async (req, res) => {
  const p = await loadProgram();
  res.json(programPublicView(p));
}));

// P2 — never reads or creates a LoyaltyMember: the answer is the same shape
// whether or not the phone already belongs to a member (no membership oracle).
app.post('/api/loyalty/enroll', noStore, loyaltyEnrollLimiter, featureRoute('loyalty-enroll', async (req, res) => {
  const b = req.body || {};
  const phone = normalizePhone(b.phone);
  if (!phone) return sendError(res, 400, 'invalid_phone', 'Numéro tunisien à 8 chiffres attendu.');
  const firstName = sanitizeName(b.firstName);
  if (!firstName) return sendError(res, 400, 'invalid_name', 'Prénom invalide.');
  if (b.consent !== true) return sendError(res, 400, 'consent_required', 'Le consentement est requis.');
  const program = await loadProgram();
  if (!program || !program.active) return sendError(res, 403, 'loyalty_paused', 'Le programme de fidélité est en pause.');
  const lang = LANGS.includes(b.lang) ? b.lang : 'fr';

  const cardToken = genToken();
  const now = new Date();
  let card = null;
  for (let attempt = 0; attempt < 6 && !card; attempt++) {
    try {
      card = await LoyaltyCard.create({
        id: 'LC-' + genChars(10), tokenHash: sha256Hex(cardToken), status: 'pending',
        phone, firstName, lang, consentAt: now, createdAt: now, expireAt: addDays(now, 30)
      });
    } catch (err) {
      if (isDup(err, 'id') && attempt < 5) continue;
      throw err;
    }
  }
  // Keep only the 5 newest pending cards for this phone (silent).
  const extra = await LoyaltyCard.find({ phone, status: 'pending' }).sort({ createdAt: -1, _id: -1 }).skip(5).select('id').lean();
  if (extra.length) await LoyaltyCard.deleteMany({ id: { $in: extra.map(c => c.id) }, status: 'pending' });

  res.status(201).json({
    cardToken,
    card: { cardId: card.id, status: 'pending', firstName: card.firstName, qr: 'babke:c:' + card.id }
  });
}));

// P3
app.get('/api/loyalty/card', noStore, loyaltyCardLimiter, featureRoute('loyalty-card', async (req, res) => {
  const token = readCardToken(req);
  if (!token) return sendError(res, 401, 'card_token_missing', 'Carte absente.');
  const card = await LoyaltyCard.findOne({ tokenHash: sha256Hex(token) }).lean();
  if (!card || card.status === 'revoked') return sendError(res, 404, 'card_not_found', 'Carte introuvable.');
  const program = await loadProgram();
  let member = null;
  if (card.status === 'active') {
    member = card.memberId ? await LoyaltyMember.findOne({ id: card.memberId }).lean() : null;
    if (!member) return sendError(res, 404, 'card_not_found', 'Carte introuvable.');
  }
  if (!card.lastSeenAt || Date.now() - new Date(card.lastSeenAt).getTime() > HOUR_MS) {
    LoyaltyCard.updateOne({ id: card.id }, { $set: { lastSeenAt: new Date() } })
      .catch(err => console.error('[loyalty-card] lastSeenAt', safeErrMsg(err)));
  }
  res.json(cardView(card, member, program));
}));

// P4
app.delete('/api/loyalty/card', noStore, loyaltyCardLimiter, featureRoute('loyalty-card-delete', async (req, res) => {
  const token = readCardToken(req);
  if (!token) return sendError(res, 401, 'card_token_missing', 'Carte absente.');
  const now = new Date();
  const card = await LoyaltyCard.findOneAndUpdate(
    { tokenHash: sha256Hex(token), status: { $ne: 'revoked' } },
    { $set: { status: 'revoked', revokedAt: now, expireAt: addDays(now, 30) } },
    { new: false }
  ).lean();
  if (!card) return sendError(res, 404, 'card_not_found', 'Carte introuvable.');
  if (card.memberId) {
    await logLoyaltyEvent({ type: 'card_revoke', memberId: card.memberId, byRole: 'client', byUser: 'client' });
    sendSseNotification('loyaltyMemberChanged', { memberId: card.memberId });
  }
  res.json({ ok: true });
}));

// =========================== PUBLIC: WHEEL ===========================

// P5
app.get('/api/wheel', noStore, publicReadLimiter, featureRoute('wheel', async (req, res) => {
  const cfg = await loadWheelConfig();
  res.json(wheelPublicView(cfg));
}));

// Idempotent replay (P6 step 2). Returns true when it answered.
async function answerWheelReplay(res, requestId, phone) {
  const prior = await WheelPlay.findOne({ requestId }).lean();
  if (!prior) return false;
  if (prior.phone !== phone) { sendError(res, 409, 'request_conflict', 'Requête déjà utilisée.'); return true; }
  const cfg = await WheelConfig.findOne({ key: 'main' }).lean();
  res.status(200).json(wheelPlayView(prior, cfg));
  return true;
}

// P6 step 4 — rolling-24h per-IP gate, atomic. true = allowed.
async function takeWheelIpSlot(ipHash, maxPlays, now) {
  const c24 = new Date(+now - DAY_MS);
  const fresh = { $or: [ { $eq: [{ $type: '$windowStart' }, 'missing'] }, { $lte: ['$windowStart', c24] } ] };
  const filter = { key: 'i:' + ipHash, $or: [ { windowStart: { $exists: false } }, { windowStart: { $lte: c24 } }, { plays: { $lt: maxPlays } } ] };
  const update = [ { $set: { kind: 'ip', lastPlayAt: now, expireAt: new Date(+now + 100 * DAY_MS),
    windowStart: { $cond: [ fresh, now, '$windowStart' ] },
    plays: { $cond: [ fresh, 1, { $add: ['$plays', 1] } ] } } } ];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const doc = await WheelThrottle.findOneAndUpdate(filter, update, { upsert: true, new: true }).lean();
      return Boolean(doc);
    } catch (err) {
      if (!isDup(err)) throw err;   // E11000: limit reached (or a first-creation race: retry once)
    }
  }
  return false;
}

// P6 step 6 — reserve one of today's wins. true = reserved.
async function reserveDailyWin(day, cap) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const doc = await WheelDaily.findOneAndUpdate({ day, wins: { $lt: cap } }, { $inc: { wins: 1 } }, { upsert: true, new: true }).lean();
      return Boolean(doc);
    } catch (err) {
      if (!isDup(err)) throw err;
    }
  }
  return false;
}

// P6 — the draw is entirely server-side (crypto.randomInt over integer weights).
// segmentIndex / result / prize / code in the body are never read.
app.post('/api/wheel/play', noStore, wheelPlayLimiter, featureRoute('wheel-play', async (req, res) => {
  const b = req.body || {};
  // 1. validate
  const requestId = typeof b.requestId === 'string' ? b.requestId : '';
  if (!REQUEST_ID_RE.test(requestId)) return sendError(res, 400, 'bad_request', 'Requête invalide.');
  if (!Number.isInteger(b.version)) return sendError(res, 400, 'bad_request', 'Requête invalide.');
  const phone = normalizePhone(b.phone);
  if (!phone) return sendError(res, 400, 'invalid_phone', 'Numéro tunisien à 8 chiffres attendu.');
  const firstName = sanitizeName(b.firstName);
  if (!firstName) return sendError(res, 400, 'invalid_name', 'Prénom invalide.');
  if (b.consent !== true) return sendError(res, 400, 'consent_required', 'Le consentement est requis.');
  const lang = LANGS.includes(b.lang) ? b.lang : 'fr';

  // 2. idempotent replay: same requestId + same phone => the stored result, no gate, no draw
  if (await answerWheelReplay(res, requestId, phone)) return;

  // 3. config
  const cfg = await WheelConfig.findOne({ key: 'main' }).lean();
  if (!cfg || !cfg.enabled) return sendError(res, 403, 'wheel_disabled', 'La roue est en pause.');
  if (b.version !== cfg.version) return sendError(res, 409, 'config_changed', 'La roue a été mise à jour.', { version: cfg.version });

  const now = new Date();
  const ipHash = featureHmac('ip', req.ip).slice(0, 32);

  // 4. IP gate
  if (!(await takeWheelIpSlot(ipHash, cfg.ipMaxPlaysPerDay, now))) {
    return sendError(res, 429, 'ip_limit', "Trop de participations depuis ce réseau aujourd'hui.");
  }

  // 5. phone gate (atomic; returns the previous doc so it can be rolled back)
  const phoneKey = 'p:' + phone;
  const cutoff = new Date(Date.now() - cfg.cooldownHours * HOUR_MS);
  let prevGate;
  try {
    prevGate = await WheelThrottle.findOneAndUpdate(
      { key: phoneKey, lastPlayAt: { $lte: cutoff } },
      { $set: { kind: 'phone', lastPlayAt: now, expireAt: new Date(+now + 100 * DAY_MS) }, $inc: { plays: 1 } },
      { upsert: true, new: false }
    ).lean();
  } catch (err) {
    if (!isDup(err)) throw err;
    // A retry of a request that is still being processed answers with its result.
    if (await answerWheelReplay(res, requestId, phone)) return;
    // Never include the previous play, its code or its exact timestamp.
    return sendError(res, 429, 'cooldown', 'Ce numéro a déjà joué récemment.', { retryAfterHours: cfg.cooldownHours });
  }

  let dailyReserved = false;
  let stockReserved = null;
  const day = tunisDay(now);
  const rollbackPhone = async () => {
    if (prevGate === null) await WheelThrottle.deleteOne({ key: phoneKey });
    else await WheelThrottle.updateOne({ key: phoneKey }, { $set: { lastPlayAt: prevGate.lastPlayAt }, $inc: { plays: -1 } });
  };
  let undone = false;
  const undoAll = async () => {
    if (undone) return;   // never roll the gates back twice
    undone = true;
    const steps = [];
    if (stockReserved) steps.push(WheelStock.updateOne({ segmentId: stockReserved }, { $inc: { left: 1 } }));
    if (dailyReserved) steps.push(WheelDaily.updateOne({ day }, { $inc: { wins: -1 } }));
    steps.push(rollbackPhone());
    const results = await Promise.allSettled(steps);
    results.forEach(r => { if (r.status === 'rejected') console.error('[wheel-play] rollback', safeErrMsg(r.reason)); });
    stockReserved = null; dailyReserved = false;
  };

  let play = null;
  try {
    // 6. draw loop
    const publicSegs = publicSegments(cfg);
    const excluded = new Set();
    let winsBlocked = false;
    let pick = null;
    for (let iter = 0; iter < 16; iter++) {
      const eligible = publicSegs.filter(s => Number.isInteger(s.weight) && s.weight > 0 && !excluded.has(s.id) && !(winsBlocked && s.type !== 'lose'));
      if (!eligible.length) break;
      const total = eligible.reduce((sum, s) => sum + s.weight, 0);
      let r = crypto.randomInt(total);
      let cand = null;
      for (const s of eligible) { r -= s.weight; if (r < 0) { cand = s; break; } }
      if (cand.type === 'lose') { pick = cand; break; }
      // daily win cap
      if (!(await reserveDailyWin(day, cfg.dailyWinCap))) { winsBlocked = true; continue; }
      dailyReserved = true;
      // stock: atomic conditional decrement, cannot go below zero
      const stockDoc = await WheelStock.findOne({ segmentId: cand.id }).lean();
      if (stockDoc) {
        const dec = await WheelStock.findOneAndUpdate({ segmentId: cand.id, left: { $gt: 0 } }, { $inc: { left: -1 } }, { new: true }).lean();
        if (!dec) {
          await WheelDaily.updateOne({ day }, { $inc: { wins: -1 } });
          dailyReserved = false;
          excluded.add(cand.id);
          continue;
        }
        stockReserved = cand.id;
      }
      pick = cand;
      break;
    }
    if (!pick) {
      await undoAll();
      return sendError(res, 503, 'wheel_unavailable', 'Roue indisponible.');
    }

    // 7. create the play
    const win = pick.type !== 'lose';
    const base = {
      id: makeId('wp'), requestId, phone, firstName, consentAt: now, lang, ipHash,
      configVersion: cfg.version, segmentId: pick.id, segmentIndex: publicSegs.findIndex(s => s.id === pick.id),
      segmentLabel: pick.label, type: pick.type, stamps: pick.type === 'stamps' ? pick.stamps : null,
      result: win ? 'win' : 'lose', status: win ? 'won' : 'lost',
      expiresAt: win ? addDays(now, cfg.codeValidityDays) : null, day, createdAt: now,
      purgeAt: addDays(now, win ? 400 : 90)
    };
    for (let attempt = 0; attempt < 6 && !play; attempt++) {
      const doc = win ? { ...base, code: 'BK' + genChars(8) } : base;
      try {
        play = (await WheelPlay.create(doc)).toObject();
      } catch (err) {
        if (win && isDup(err, 'code') && attempt < 5) continue;
        if (isDup(err, 'requestId')) {
          await undoAll();
          if (await answerWheelReplay(res, requestId, phone)) return;
        }
        throw err;
      }
    }
    if (!play) throw new Error('wheel play insert failed');
  } catch (err) {
    await undoAll();
    throw err;
  }

  // 8. daily play counter (fire-and-forget)
  const bumpPlays = () => WheelDaily.updateOne({ day }, { $inc: { plays: 1 } }, { upsert: true });
  bumpPlays().catch(err => {
    if (isDup(err)) return bumpPlays().catch(e => console.error('[wheel-play] daily', safeErrMsg(e)));
    console.error('[wheel-play] daily', safeErrMsg(err));
  });

  // 9. admin-only SSE (no audit log: a customer action would flood it)
  sendSseNotification('wheelPlayed', { playId: play.id, result: play.result, segmentId: play.segmentId });

  // 10.
  res.status(200).json(wheelPlayView(play, cfg));
}));

// P7
app.get('/api/wheel/my-play', noStore, loyaltyCardLimiter, featureRoute('wheel-my-play', async (req, res) => {
  const play = await findPlayFromHeader(req);
  if (!play) return sendError(res, 404, 'play_not_found', 'Partie introuvable.');
  const cfg = await WheelConfig.findOne({ key: 'main' }).lean();
  res.json(wheelPlayView(play, cfg));
}));

// =========================== PUBLIC: MENU BOOK ===========================

// P8
app.get('/api/menu-book', noStore, publicReadLimiter, featureRoute('menu-book', async (req, res) => {
  const s = await loadMenuBook();
  res.json(menuBookPublicView(s));
}));

// =========================== ADMIN: LOYALTY ===========================

// A1
app.get('/api/admin/loyalty/program', authMiddleware, requireRoles('admin', 'cashier', 'comptable'), noStore, featureRoute('admin-loyalty-program', async (req, res) => {
  res.json(programAdminView(await loadProgram()));
}));

// A2
app.put('/api/admin/loyalty/program', authMiddleware, requireRoles('admin'), noStore, featureRoute('admin-loyalty-program-put', async (req, res) => {
  const b = req.body || {};
  const bad = (message) => sendError(res, 400, 'invalid_program', message);
  if (!Number.isInteger(b.version)) return bad('Version du programme manquante. Rechargez la page.');
  if (typeof b.active !== 'boolean') return bad('« Programme actif » doit être oui ou non.');
  const cardTitle = pickLoc(b.cardTitle, 40);
  if (!cardTitle) return bad('Le titre de la carte (FR) est obligatoire.');
  const stampRule = pickLoc(b.stampRule, 120);
  if (!stampRule) return bad("La règle d'attribution (FR) est obligatoire.");
  if (!isInt(b.stampGoal, 4, 20)) return bad("L'objectif doit être un entier entre 4 et 20.");
  if (!isInt(b.welcomeBonus, 0, 5)) return bad('Le bonus de bienvenue doit être un entier entre 0 et 5.');
  if (!isInt(b.maxStampsPerDay, 1, 10)) return bad('Le maximum de sceaux par jour doit être un entier entre 1 et 10.');
  if (!Array.isArray(b.tiers) || b.tiers.length < 1 || b.tiers.length > 6) return bad('Il faut entre 1 et 6 paliers.');

  const current = await loadProgram();
  const existingIds = new Set(((current && current.tiers) || []).map(t => t.id));
  const usedIds = new Set();
  const seenStamps = new Set();
  const tiers = [];
  for (let i = 0; i < b.tiers.length; i++) {
    const t = b.tiers[i] || {};
    if (!isInt(t.stamps, 1, 50)) return bad(`Palier ${i + 1} : le nombre de sceaux doit être un entier entre 1 et 50.`);
    if (seenStamps.has(t.stamps)) return bad(`Palier ${i + 1} : deux paliers ne peuvent pas avoir le même nombre de sceaux (${t.stamps}).`);
    seenStamps.add(t.stamps);
    const reward = pickLoc(t.reward, 60);
    if (!reward) return bad(`Palier ${i + 1} : la récompense (FR) est obligatoire.`);
    let id = (typeof t.id === 'string' && existingIds.has(t.id) && !usedIds.has(t.id)) ? t.id : null;
    if (!id) { do { id = 'tier_' + crypto.randomBytes(3).toString('hex'); } while (usedIds.has(id) || existingIds.has(id)); }
    usedIds.add(id);
    tiers.push({ id, stamps: t.stamps, reward, active: t.active !== false });
  }

  const updated = await LoyaltyProgram.findOneAndUpdate(
    { key: 'main', version: b.version },
    { $set: { active: b.active, cardTitle, stampRule, stampGoal: b.stampGoal, welcomeBonus: b.welcomeBonus,
              maxStampsPerDay: b.maxStampsPerDay, tiers, updatedAt: new Date() }, $inc: { version: 1 } },
    { new: true }
  ).lean();
  if (!updated) {
    const cur = await LoyaltyProgram.findOne({ key: 'main' }).lean();
    return sendError(res, 409, 'version_conflict', 'Le programme a été modifié entre-temps. Rechargez.', { version: cur ? cur.version : null });
  }
  await createAuditLog(req.admin.role, req.admin.username, 'LOYALTY_PROGRAM_UPDATE',
    `Programme fidélité mis à jour (objectif ${updated.stampGoal}, bonus ${updated.welcomeBonus}, ${tiers.length} paliers, ${updated.active ? 'actif' : 'en pause'})`);
  sendSseNotification('loyaltyProgramChanged', { version: updated.version });
  res.json(programAdminView(updated));
}));

// A3
app.get('/api/admin/loyalty/members', authMiddleware, requireRoles('admin', 'cashier'), noStore, featureRoute('admin-loyalty-members', async (req, res) => {
  const role = req.admin.role;
  const q = String(req.query.q == null ? '' : req.query.q).trim().slice(0, 40);
  const all = String(req.query.all || '') === '1';
  if (all && role !== 'admin') return sendError(res, 403, 'forbidden', 'Accès refusé pour ce rôle.');
  const filter = {};
  let digitCount = 0;
  let letterCount = 0;
  if (q) {
    if (/^[\d\s+]+$/.test(q)) {
      let digits = q.replace(/\D/g, '');
      // "+216 20 985 204" typed in full: drop the country code so it can match.
      if (digits.length > 8 && digits.startsWith('00216')) digits = digits.slice(5);
      else if (digits.length > 8 && digits.startsWith('216')) digits = digits.slice(3);
      digitCount = digits.length;
      if (digits) filter.phone = { $regex: digits.length >= 3 ? escapeRegex(digits) : '^' + escapeRegex(digits) };
    } else {
      letterCount = (q.match(/\p{L}/gu) || []).length;
      filter.firstName = { $regex: escapeRegex(q), $options: 'i' };
    }
  }
  if (role !== 'admin' && !(digitCount >= 4 || letterCount >= 2)) {
    return sendError(res, 400, 'query_too_short', 'Tapez au moins 4 chiffres ou 2 lettres.');
  }
  const sort = { lastVisitAt: -1, createdAt: -1 };
  const total = await LoyaltyMember.countDocuments(filter);
  if (all) {
    const members = await LoyaltyMember.find(filter).sort(sort).limit(5000).lean();
    return res.json({ items: await memberViewsMany(members), total });
  }
  const page = Math.max(1, Math.min(100000, parseInt(req.query.page, 10) || 1));
  const members = await LoyaltyMember.find(filter).sort(sort).skip((page - 1) * MEMBERS_PAGE_SIZE).limit(MEMBERS_PAGE_SIZE).lean();
  res.json({ items: await memberViewsMany(members), page, pageSize: MEMBERS_PAGE_SIZE, total });
}));

// A4 — find-or-create at the counter
app.post('/api/admin/loyalty/members', authMiddleware, requireRoles('admin', 'cashier'), noStore, featureRoute('admin-loyalty-member-create', async (req, res) => {
  const b = req.body || {};
  const phone = normalizePhone(b.phone);
  if (!phone) return sendError(res, 400, 'invalid_phone', 'Numéro tunisien à 8 chiffres attendu.');
  const firstName = sanitizeName(b.firstName);
  if (!firstName) return sendError(res, 400, 'invalid_name', 'Prénom invalide.');
  if (b.consent !== true) return sendError(res, 400, 'consent_required', 'Le client doit accepter la conservation de ses données.');
  const program = await loadProgram();
  if (!program.active) return sendError(res, 403, 'loyalty_paused', 'Le programme de fidélité est en pause.');

  const existing = await LoyaltyMember.findOne({ phone }).lean();
  if (existing) return res.status(200).json({ member: await memberViewOne(existing), program: programSummary(program), created: false });

  const now = new Date();
  const bonus = program.welcomeBonus || 0;
  let member;
  try {
    member = (await LoyaltyMember.create({
      id: makeId('lm'), phone, firstName, stamps: bonus, lifetimeStamps: bonus,
      source: 'counter', consentAt: now, lastVisitAt: now, createdAt: now
    })).toObject();
  } catch (err) {
    if (!isDup(err)) throw err;
    const winner = await LoyaltyMember.findOne({ phone }).lean();
    if (!winner) throw err;
    return res.status(200).json({ member: await memberViewOne(winner), program: programSummary(program), created: false });
  }
  await logLoyaltyEvent({ type: 'signup', memberId: member.id, count: bonus, byRole: req.admin.role, byUser: req.admin.username });
  await createAuditLog(req.admin.role, req.admin.username, 'LOYALTY_MEMBER_CREATE', `Membre créé : ${member.firstName} ${maskPhone(member.phone)}`);
  sendSseNotification('loyaltyMemberChanged', { memberId: member.id });
  res.status(201).json({ member: await memberViewOne(member), program: programSummary(program), created: true });
}));

// A5
app.get('/api/admin/loyalty/members/:id', authMiddleware, requireRoles('admin', 'cashier'), noStore, featureRoute('admin-loyalty-member', async (req, res) => {
  const m = await LoyaltyMember.findOne({ id: String(req.params.id) }).lean();
  if (!m) return sendError(res, 404, 'member_not_found', 'Membre introuvable.');
  const [program, cards, events] = await Promise.all([
    loadProgram(),
    LoyaltyCard.find({ memberId: m.id }).sort({ createdAt: -1 }).limit(50).lean(),
    LoyaltyEvent.find({ memberId: m.id }).sort({ at: -1 }).limit(20).lean()
  ]);
  res.json({
    member: await memberViewOne(m), program: programSummary(program),
    cards: cards.map(c => ({ cardId: c.id, status: c.status, createdAt: c.createdAt, activatedAt: c.activatedAt, lastSeenAt: c.lastSeenAt })),
    events: events.map(e => ({ type: e.type, count: e.count, reward: e.reward ?? null, byUser: e.byUser, at: e.at }))
  });
}));

// A6
app.put('/api/admin/loyalty/members/:id', authMiddleware, requireRoles('admin'), noStore, featureRoute('admin-loyalty-member-put', async (req, res) => {
  const firstName = sanitizeName((req.body || {}).firstName);
  if (!firstName) return sendError(res, 400, 'invalid_name', 'Prénom invalide.');
  const m = await LoyaltyMember.findOneAndUpdate({ id: String(req.params.id) }, { $set: { firstName } }, { new: true }).lean();
  if (!m) return sendError(res, 404, 'member_not_found', 'Membre introuvable.');
  await logLoyaltyEvent({ type: 'member_update', memberId: m.id, byRole: req.admin.role, byUser: req.admin.username });
  await createAuditLog(req.admin.role, req.admin.username, 'LOYALTY_MEMBER_UPDATE', `Prénom du membre modifié : ${m.firstName} ${maskPhone(m.phone)}`);
  sendSseNotification('loyaltyMemberChanged', { memberId: m.id });
  res.json({ member: await memberViewOne(m), program: programSummary(await loadProgram()) });
}));

// A7 — erasure (RGPD)
app.delete('/api/admin/loyalty/members/:id', authMiddleware, requireRoles('admin'), noStore, featureRoute('admin-loyalty-member-delete', async (req, res) => {
  const m = await LoyaltyMember.findOne({ id: String(req.params.id) }).lean();
  if (!m) return sendError(res, 404, 'member_not_found', 'Membre introuvable.');
  // The member's cards, plus any card (pending or not) still holding that phone.
  await LoyaltyCard.deleteMany({ $or: [{ memberId: m.id }, { phone: m.phone }] });
  await LoyaltyEvent.updateMany({ memberId: m.id }, { $set: { memberId: null } });
  await LoyaltyMember.deleteOne({ id: m.id });
  await logLoyaltyEvent({ type: 'member_delete', memberId: null, byRole: req.admin.role, byUser: req.admin.username });
  await createAuditLog(req.admin.role, req.admin.username, 'LOYALTY_MEMBER_DELETE', `Membre supprimé (RGPD) : ${maskPhone(m.phone)}`);
  sendSseNotification('loyaltyMemberChanged', { memberId: m.id });
  res.json({ success: true });
}));

// A8 — stamps (positive: daily cap unless admin override; negative: correction)
app.post('/api/admin/loyalty/members/:id/stamps', authMiddleware, requireRoles('admin', 'cashier'), noStore, featureRoute('admin-loyalty-stamps', async (req, res) => {
  const b = req.body || {};
  const n = b.count;
  if (!Number.isInteger(n) || n < -5 || n > 5 || n === 0) return sendError(res, 400, 'invalid_count', 'Nombre de sceaux invalide (entre −5 et 5, sauf 0).');
  const requestId = typeof b.requestId === 'string' ? b.requestId : '';
  if (!REQUEST_ID_RE.test(requestId)) return sendError(res, 400, 'bad_request', 'Requête invalide.');
  const program = await loadProgram();
  if (n > 0 && !program.active) return sendError(res, 403, 'loyalty_paused', 'Le programme de fidélité est en pause.');
  const override = n > 0 && b.override === true && req.admin.role === 'admin';
  const cap = program.maxStampsPerDay;
  const today = tunisDay();
  const id = String(req.params.id);

  let m = null;
  if (n > 0) {
    // A single call larger than the whole daily cap can never pass without override.
    if (override || n <= cap) {
      const filter = { id, lastStampRequestId: { $ne: requestId } };
      if (!override) filter.$or = [ { stampDay: { $ne: today } }, { stampsToday: { $lte: cap - n } } ];
      m = await LoyaltyMember.findOneAndUpdate(filter, [ { $set: {
        stampsToday: { $cond: [ { $eq: ['$stampDay', today] }, { $add: ['$stampsToday', n] }, n ] },
        stampDay: today, stamps: { $add: ['$stamps', n] }, lifetimeStamps: { $add: ['$lifetimeStamps', n] },
        lastVisitAt: '$$NOW', lastStampRequestId: requestId } } ], { new: true }).lean();
    }
  } else {
    m = await LoyaltyMember.findOneAndUpdate({ id, lastStampRequestId: { $ne: requestId } }, [ { $set: {
      stamps: { $max: [0, { $add: ['$stamps', n] }] },
      stampsToday: { $cond: [ { $eq: ['$stampDay', today] }, { $max: [0, { $add: ['$stampsToday', n] }] }, '$stampsToday' ] },
      lastStampRequestId: requestId } } ], { new: true }).lean();
  }

  if (!m) {
    const cur = await LoyaltyMember.findOne({ id }).lean();
    if (!cur) return sendError(res, 404, 'member_not_found', 'Membre introuvable.');
    if (cur.lastStampRequestId === requestId) {
      return res.json({ member: await memberViewOne(cur), program: programSummary(program), replay: true });
    }
    const usedToday = cur.stampDay === today ? cur.stampsToday : 0;
    return sendError(res, 409, 'daily_cap', `Limite de ${cap} sceaux par jour atteinte pour ce client.`, { remainingToday: Math.max(0, cap - usedToday) });
  }

  await logLoyaltyEvent({ type: n > 0 ? 'stamp' : 'unstamp', memberId: m.id, count: n, byRole: req.admin.role, byUser: req.admin.username });
  if (n < 0) {
    await createAuditLog(req.admin.role, req.admin.username, 'LOYALTY_UNSTAMP', `Correction −${Math.abs(n)} sceau(x) : ${m.firstName} ${maskPhone(m.phone)}`);
  } else if (override) {
    await createAuditLog(req.admin.role, req.admin.username, 'LOYALTY_STAMP_OVERRIDE', `+${n} sceau(x) hors plafond journalier (propriétaire) : ${m.firstName} ${maskPhone(m.phone)}`);
  }
  sendSseNotification('loyaltyMemberChanged', { memberId: m.id });
  res.json({ member: await memberViewOne(m), program: programSummary(program) });
}));

// A9 — redeem a tier (allowed while the program is paused)
app.post('/api/admin/loyalty/members/:id/redeem', authMiddleware, requireRoles('admin', 'cashier'), noStore, featureRoute('admin-loyalty-redeem', async (req, res) => {
  const b = req.body || {};
  const requestId = typeof b.requestId === 'string' ? b.requestId : '';
  if (!REQUEST_ID_RE.test(requestId)) return sendError(res, 400, 'bad_request', 'Requête invalide.');
  const program = await loadProgram();
  const tier = activeTiersSorted(program).find(t => t.id === b.tierId);
  if (!tier) return sendError(res, 409, 'tier_not_found', 'Récompense inexistante ou désactivée.');
  const id = String(req.params.id);
  const now = new Date();
  const m = await LoyaltyMember.findOneAndUpdate(
    { id, stamps: { $gte: tier.stamps }, lastRedeemRequestId: { $ne: requestId } },
    { $inc: { stamps: -tier.stamps }, $set: { lastVisitAt: now, lastRedeemRequestId: requestId },
      $push: { redemptions: { $each: [{ tierId: tier.id, stamps: tier.stamps, reward: tier.reward, at: now, by: req.admin.username }], $position: 0, $slice: 50 } } },
    { new: true }
  ).lean();
  if (!m) {
    const cur = await LoyaltyMember.findOne({ id }).lean();
    if (!cur) return sendError(res, 404, 'member_not_found', 'Membre introuvable.');
    if (cur.lastRedeemRequestId === requestId) {
      return res.json({ member: await memberViewOne(cur), program: programSummary(program), reward: tier.reward, replay: true });
    }
    return sendError(res, 409, 'not_enough_stamps', 'Pas assez de sceaux pour cette récompense.');
  }
  await logLoyaltyEvent({ type: 'redeem', memberId: m.id, count: tier.stamps, tierId: tier.id, reward: tier.reward, byRole: req.admin.role, byUser: req.admin.username });
  const rewardFr = (tier.reward && tier.reward.fr) || tier.id;
  await createAuditLog(req.admin.role, req.admin.username, 'LOYALTY_REDEEM', `Récompense « ${rewardFr} » offerte à ${m.firstName} ${maskPhone(m.phone)} (−${tier.stamps} sceaux)`);
  sendSseNotification('loyaltyMemberChanged', { memberId: m.id });
  res.json({ member: await memberViewOne(m), program: programSummary(program), reward: tier.reward });
}));

// A10 — counter scan / manual entry. A scan never creates anything.
app.post('/api/admin/loyalty/scan', authMiddleware, requireRoles('admin', 'cashier'), noStore, featureRoute('admin-loyalty-scan', async (req, res) => {
  const b = req.body || {};
  const payload = typeof b.payload === 'string' ? b.payload.slice(0, 200).trim() : '';
  if (!payload) return sendError(res, 400, 'unrecognized_payload', 'QR ou saisie non reconnu.');

  // Card QR "babke:c:LC-…" (a bare "LC-…" typed by hand is accepted too).
  let cardId = null;
  if (/^babke:c:/i.test(payload)) {
    const rest = payload.slice(8).trim().toUpperCase();
    if (CARD_ID_RE.test(rest)) cardId = rest;
  } else if (CARD_ID_RE.test(payload.toUpperCase())) {
    cardId = payload.toUpperCase();
  }
  if (cardId) {
    const card = await LoyaltyCard.findOne({ id: cardId }).lean();
    if (!card || card.status === 'revoked') return sendError(res, 404, 'card_not_found', 'Carte inconnue ou révoquée.');
    const program = await loadProgram();
    if (card.status === 'pending') {
      const ex = await LoyaltyMember.findOne({ phone: card.phone }).lean();
      return res.json({
        kind: 'pending_card',
        card: { cardId: card.id, firstName: card.firstName, phoneMasked: maskPhone(card.phone), createdAt: card.createdAt },
        existingMember: ex ? { id: ex.id, firstName: ex.firstName, phoneMasked: maskPhone(ex.phone), stamps: ex.stamps } : null
      });
    }
    const member = card.memberId ? await LoyaltyMember.findOne({ id: card.memberId }).lean() : null;
    if (!member) return sendError(res, 404, 'card_not_found', 'Carte inconnue ou révoquée.');
    return res.json({ kind: 'member', member: await memberViewOne(member), program: programSummary(program), card: { cardId: card.id, status: 'active' } });
  }

  // Prize-wheel code: wrong screen.
  const wheelCode = normalizeCode(payload);
  if (wheelCode) return sendError(res, 400, 'wheel_code', 'Ceci est un code de la roue.', { code: formatCode(wheelCode) });

  const phone = normalizePhone(payload);
  if (phone) {
    const member = await LoyaltyMember.findOne({ phone }).lean();
    if (!member) return sendError(res, 404, 'member_not_found', 'Membre introuvable.', { canCreate: true, phoneDisplay: formatPhone(phone) });
    return res.json({ kind: 'member', member: await memberViewOne(member), program: programSummary(await loadProgram()) });
  }
  return sendError(res, 400, 'unrecognized_payload', 'QR ou saisie non reconnu.');
}));

// A11 — in-person activation of a web card (identity checked by staff)
app.post('/api/admin/loyalty/cards/:cardId/activate', authMiddleware, requireRoles('admin', 'cashier'), noStore, featureRoute('admin-loyalty-card-activate', async (req, res) => {
  if ((req.body || {}).confirmIdentity !== true) return sendError(res, 400, 'confirm_required', "Confirmez l'identité du client.");
  const program = await loadProgram();
  if (!program.active) return sendError(res, 403, 'loyalty_paused', 'Le programme de fidélité est en pause.');
  const cardId = String(req.params.cardId).toUpperCase();
  const card = CARD_ID_RE.test(cardId) ? await LoyaltyCard.findOne({ id: cardId }).lean() : null;
  if (!card) return sendError(res, 404, 'card_not_found', 'Carte inconnue ou révoquée.');
  if (card.status !== 'pending') return sendError(res, 409, 'card_not_pending', "Cette carte n'est plus en attente.");

  const now = new Date();
  const bonus = program.welcomeBonus || 0;
  let created = false;
  let member = await LoyaltyMember.findOne({ phone: card.phone }).lean();
  if (!member) {
    try {
      member = (await LoyaltyMember.create({
        id: makeId('lm'), phone: card.phone, firstName: card.firstName,
        stamps: bonus, lifetimeStamps: bonus, source: 'web',
        consentAt: card.consentAt, lastVisitAt: now, createdAt: now
      })).toObject();
      created = true;
      await logLoyaltyEvent({ type: 'signup', memberId: member.id, count: bonus, byRole: req.admin.role, byUser: req.admin.username });
    } catch (err) {
      if (!isDup(err)) throw err;
      member = await LoyaltyMember.findOne({ phone: card.phone }).lean();
      if (!member) throw err;
    }
  }

  const activated = await LoyaltyCard.findOneAndUpdate(
    { id: cardId, status: 'pending' },
    { $set: { status: 'active', memberId: member.id, activatedAt: now, activatedBy: req.admin.username }, $unset: { expireAt: 1 } },
    { new: true }
  ).lean();
  if (!activated) return sendError(res, 409, 'card_not_pending', "Cette carte n'est plus en attente.");

  // At most 5 active cards per member: revoke the least recently seen extras.
  const actives = await LoyaltyCard.find({ memberId: member.id, status: 'active' }).lean();
  if (actives.length > 5) {
    const recency = (c) => new Date(c.lastSeenAt || c.activatedAt || c.createdAt || 0).getTime();
    const extras = actives.filter(c => c.id !== cardId).sort((a, b) => recency(a) - recency(b)).slice(0, actives.length - 5);
    if (extras.length) {
      await LoyaltyCard.updateMany({ id: { $in: extras.map(c => c.id) }, status: 'active' },
        { $set: { status: 'revoked', revokedAt: now, expireAt: addDays(now, 30) } });
    }
  }

  await logLoyaltyEvent({ type: 'card_activate', memberId: member.id, byRole: req.admin.role, byUser: req.admin.username });
  await createAuditLog(req.admin.role, req.admin.username, 'LOYALTY_CARD_ACTIVATE',
    `Carte ${cardId} activée pour ${member.firstName} ${maskPhone(member.phone)}${created ? ' (nouveau membre)' : ''}`);
  sendSseNotification('loyaltyMemberChanged', { memberId: member.id });
  res.json({ member: await memberViewOne(member), program: programSummary(program), card: { cardId, status: 'active' }, created });
}));

// A12
app.post('/api/admin/loyalty/cards/:cardId/revoke', authMiddleware, requireRoles('admin', 'cashier'), noStore, featureRoute('admin-loyalty-card-revoke', async (req, res) => {
  const cardId = String(req.params.cardId).toUpperCase();
  const now = new Date();
  const card = CARD_ID_RE.test(cardId) ? await LoyaltyCard.findOneAndUpdate(
    { id: cardId, status: { $in: ['pending', 'active'] } },
    { $set: { status: 'revoked', revokedAt: now, expireAt: addDays(now, 30) } },
    { new: true }
  ).lean() : null;
  if (!card) return sendError(res, 404, 'card_not_found', 'Carte inconnue ou révoquée.');
  await logLoyaltyEvent({ type: 'card_revoke', memberId: card.memberId || null, byRole: req.admin.role, byUser: req.admin.username });
  await createAuditLog(req.admin.role, req.admin.username, 'LOYALTY_CARD_REVOKE', `Carte ${card.id} révoquée (${card.firstName} ${maskPhone(card.phone)})`);
  if (card.memberId) sendSseNotification('loyaltyMemberChanged', { memberId: card.memberId });
  res.json({ success: true });
}));

// A13
app.get('/api/admin/loyalty/stats', authMiddleware, requireRoles('admin', 'comptable'), noStore, featureRoute('admin-loyalty-stats', async (req, res) => {
  const since7 = new Date(Date.now() - 7 * DAY_MS);
  const days = last14DaysWithLabels();
  const [program, totalMembers, activeCards, pendingCards, newMembers7d, stampAgg7, redemptions7d, dayAgg, recentEvents] = await Promise.all([
    loadProgram(),
    LoyaltyMember.countDocuments({}),
    LoyaltyCard.countDocuments({ status: 'active' }),
    LoyaltyCard.countDocuments({ status: 'pending' }),
    LoyaltyMember.countDocuments({ createdAt: { $gt: since7 } }),
    LoyaltyEvent.aggregate([{ $match: { at: { $gt: since7 }, type: { $in: ['stamp', 'wheel_stamps'] } } }, { $group: { _id: null, n: { $sum: '$count' } } }]),
    LoyaltyEvent.countDocuments({ at: { $gt: since7 }, type: 'redeem' }),
    LoyaltyEvent.aggregate([
      { $match: { day: { $in: days.map(d => d.day) }, type: { $in: ['stamp', 'wheel_stamps', 'redeem'] } } },
      { $group: { _id: { day: '$day', type: '$type' }, events: { $sum: 1 }, count: { $sum: '$count' } } }
    ]),
    LoyaltyEvent.find({}).sort({ at: -1 }).limit(20).lean()
  ]);
  const perDay = new Map(days.map(d => [d.day, { stamps: 0, redeems: 0 }]));
  for (const g of dayAgg) {
    const slot = perDay.get(g._id.day);
    if (!slot) continue;
    if (g._id.type === 'redeem') slot.redeems += g.events;
    else slot.stamps += g.count;
  }
  const memberIds = [...new Set(recentEvents.map(e => e.memberId).filter(Boolean))];
  const members = memberIds.length ? await LoyaltyMember.find({ id: { $in: memberIds } }).select('id firstName phone').lean() : [];
  const byId = new Map(members.map(m => [m.id, m]));
  res.json({
    totalMembers, activeCards, pendingCards, newMembers7d,
    stamps7d: stampAgg7.length ? stampAgg7[0].n : 0,
    redemptions7d, programActive: Boolean(program.active), stampGoal: program.stampGoal,
    days: days.map(d => ({ day: d.day, label: d.label, stamps: perDay.get(d.day).stamps, redeems: perDay.get(d.day).redeems })),
    recent: recentEvents.map(e => {
      const m = e.memberId ? byId.get(e.memberId) : null;
      return { type: e.type, count: e.count, reward: e.reward ?? null, firstName: m ? m.firstName : '—', phoneMasked: m ? maskPhone(m.phone) : '—', byUser: e.byUser, at: e.at };
    })
  });
}));

// =========================== ADMIN: WHEEL ===========================

// W1
app.get('/api/admin/wheel/config', authMiddleware, requireRoles('admin'), noStore, featureRoute('admin-wheel-config', async (req, res) => {
  res.json(await wheelAdminView(await loadWheelConfig()));
}));

// W2
app.put('/api/admin/wheel/config', authMiddleware, requireRoles('admin'), noStore, featureRoute('admin-wheel-config-put', async (req, res) => {
  const b = req.body || {};
  const bad = (message) => sendError(res, 400, 'invalid_config', message);
  if (!Number.isInteger(b.version)) return bad('Version de la configuration manquante. Rechargez la page.');
  if (typeof b.enabled !== 'boolean') return bad('« Roue active » doit être oui ou non.');
  if (!isInt(b.cooldownHours, 1, 2160)) return bad('Le délai entre deux parties doit être un entier entre 1 et 2160 heures.');
  if (!isInt(b.ipMaxPlaysPerDay, 1, 50)) return bad('Les parties max par réseau doivent être un entier entre 1 et 50.');
  if (!isInt(b.dailyWinCap, 1, 1000)) return bad('Le plafond de gains par jour doit être un entier entre 1 et 1000.');
  if (!isInt(b.codeValidityDays, 1, 90)) return bad('La validité des codes doit être un entier entre 1 et 90 jours.');
  const rules = pickLoc(b.rules, 800);
  if (!rules) return bad('Le règlement (FR) est obligatoire.');
  if (!Array.isArray(b.segments) || b.segments.length < 6 || b.segments.length > 12) return bad('La roue doit compter entre 6 et 12 segments.');

  const current = await loadWheelConfig();
  const existingIds = new Set(((current && current.segments) || []).map(s => s.id));
  const usedIds = new Set();
  const segments = [];
  for (let i = 0; i < b.segments.length; i++) {
    const s = b.segments[i] || {};
    const n = i + 1;
    const label = pickLoc(s.label, 24);
    if (!label) return bad(`Segment ${n} : le libellé (FR) est obligatoire.`);
    if (!SEGMENT_TYPES.includes(s.type)) return bad(`Segment ${n} : type invalide (Lot, Sceaux ou Perdu).`);
    let stamps = null;
    if (s.type === 'stamps') {
      if (!isInt(s.stamps, 1, 10)) return bad(`Segment ${n} : le nombre de sceaux doit être un entier entre 1 et 10.`);
      stamps = s.stamps;
    }
    if (!isInt(s.weight, 0, 10000)) return bad(`Segment ${n} : le poids doit être un entier entre 0 et 10000.`);
    if (!SEGMENT_TONES.includes(s.tone)) return bad(`Segment ${n} : couleur invalide.`);
    if (typeof s.active !== 'boolean') return bad(`Segment ${n} : « Actif » doit être oui ou non.`);
    let id = (typeof s.id === 'string' && existingIds.has(s.id) && !usedIds.has(s.id)) ? s.id : null;
    if (!id) { do { id = 'seg_' + crypto.randomBytes(3).toString('hex'); } while (usedIds.has(id) || existingIds.has(id)); }
    usedIds.add(id);
    segments.push({ id, label, type: s.type, stamps, weight: s.weight, tone: s.tone, active: s.active });
  }
  const activeSegs = segments.filter(s => s.active);
  if (activeSegs.length < 6 || activeSegs.length > 12) return bad('La roue doit compter entre 6 et 12 segments actifs.');
  if (!activeSegs.some(s => s.type === 'lose' && s.weight > 0)) return bad('Il faut au moins un segment « Perdu » actif avec un poids supérieur à 0.');
  if (activeSegs.reduce((sum, s) => sum + s.weight, 0) <= 0) return bad('La somme des poids des segments actifs doit être supérieure à 0.');
  const loseIds = segments.filter(s => s.type === 'lose').map(s => s.id);
  if (loseIds.length && await WheelStock.exists({ segmentId: { $in: loseIds } })) {
    return bad("Un segment « Perdu » ne peut pas avoir de stock : passez-le d'abord en illimité.");
  }

  const updated = await WheelConfig.findOneAndUpdate(
    { key: 'main', version: b.version },
    { $set: { enabled: b.enabled, cooldownHours: b.cooldownHours, ipMaxPlaysPerDay: b.ipMaxPlaysPerDay, dailyWinCap: b.dailyWinCap,
              codeValidityDays: b.codeValidityDays, rules, segments, updatedAt: new Date() }, $inc: { version: 1 } },
    { new: true }
  ).lean();
  if (!updated) {
    const cur = await WheelConfig.findOne({ key: 'main' }).lean();
    return sendError(res, 409, 'version_conflict', 'La roue a été modifiée entre-temps. Rechargez.', { version: cur ? cur.version : null });
  }
  // Stock of removed segments goes with them. W2 never writes stock levels.
  await WheelStock.deleteMany({ segmentId: { $nin: segments.map(s => s.id) } });
  await createAuditLog(req.admin.role, req.admin.username, 'WHEEL_CONFIG_UPDATE',
    `Roue mise à jour (v${updated.version}, ${updated.enabled ? 'active' : 'désactivée'}, ${segments.length} segments)`);
  sendSseNotification('wheelConfigChanged', { version: updated.version });
  res.json(await wheelAdminView(updated));
}));

// W3 — stock for one segment (the config version does not change)
app.put('/api/admin/wheel/stock/:segmentId', authMiddleware, requireRoles('admin'), noStore, featureRoute('admin-wheel-stock', async (req, res) => {
  const segmentId = String(req.params.segmentId);
  const b = req.body || {};
  const cfg = await loadWheelConfig();
  const seg = ((cfg && cfg.segments) || []).find(s => s.id === segmentId);
  if (!seg || seg.type === 'lose') return sendError(res, 400, 'invalid_stock', 'Segment inconnu, ou segment « Perdu » (sans stock).');
  const labelFr = (seg.label && seg.label.fr) || seg.id;
  let stock = null;
  let detail;
  if (b.limited === false) {
    await WheelStock.deleteOne({ segmentId });
    detail = 'illimité';
  } else if (b.limited === true && b.set !== undefined && b.add === undefined) {
    if (!isInt(b.set, 0, 100000)) return sendError(res, 400, 'invalid_stock', 'Le stock doit être un entier entre 0 et 100000.');
    const doc = await WheelStock.findOneAndUpdate({ segmentId }, { $set: { left: b.set, total: b.set, updatedAt: new Date() } }, { upsert: true, new: true }).lean();
    stock = { left: doc.left, total: doc.total };
    detail = `remplacé par ${b.set}`;
  } else if (b.limited === true && b.add !== undefined && b.set === undefined) {
    if (!isInt(b.add, 1, 100000)) return sendError(res, 400, 'invalid_stock', 'Le réassort doit être un entier entre 1 et 100000.');
    const doc = await WheelStock.findOneAndUpdate({ segmentId }, { $inc: { left: b.add, total: b.add }, $set: { updatedAt: new Date() } }, { upsert: true, new: true }).lean();
    stock = { left: doc.left, total: doc.total };
    detail = `réassort +${b.add}`;
  } else {
    return sendError(res, 400, 'invalid_stock', 'Requête de stock invalide.');
  }
  await createAuditLog(req.admin.role, req.admin.username, 'WHEEL_STOCK_UPDATE',
    `Stock roue « ${labelFr} » : ${detail}${stock ? ` (reste ${stock.left}/${stock.total})` : ''}`);
  res.json({ segmentId, stock });
}));

// W4
app.get('/api/admin/wheel/plays', authMiddleware, requireRoles('admin'), noStore, featureRoute('admin-wheel-plays', async (req, res) => {
  const now = new Date();
  const filter = {};
  const status = String(req.query.status || '');
  if (status === 'won') { filter.status = 'won'; filter.expiresAt = { $gt: now }; }
  else if (status === 'expired') { filter.status = 'won'; filter.expiresAt = { $lte: now }; }
  else if (['redeemed', 'lost', 'void'].includes(status)) filter.status = status;
  const q = String(req.query.q == null ? '' : req.query.q).trim().slice(0, 40);
  if (q) {
    const code = normalizeCode(q);
    if (code) filter.code = code;
    else if (/^[\d\s+]+$/.test(q)) {
      const digits = q.replace(/\D/g, '');
      if (digits) filter.phone = { $regex: escapeRegex(digits) };
    } else filter.firstName = { $regex: escapeRegex(q), $options: 'i' };
  }
  const dayRe = /^\d{4}-\d{2}-\d{2}$/;
  const from = String(req.query.from || ''), to = String(req.query.to || '');
  if (dayRe.test(from) || dayRe.test(to)) {
    filter.day = {};
    if (dayRe.test(from)) filter.day.$gte = from;
    if (dayRe.test(to)) filter.day.$lte = to;
  }
  const page = Math.max(1, Math.min(100000, parseInt(req.query.page, 10) || 1));
  const [total, plays] = await Promise.all([
    WheelPlay.countDocuments(filter),
    WheelPlay.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PLAYS_PAGE_SIZE).limit(PLAYS_PAGE_SIZE).lean()
  ]);
  res.json({
    items: plays.map(p => ({
      id: p.id, createdAt: p.createdAt, firstName: p.firstName, phone: p.phone, phoneDisplay: formatPhone(p.phone),
      segmentId: p.segmentId, segmentLabel: p.segmentLabel, type: p.type, stamps: p.stamps,
      result: p.result, status: playStatus(p, now), code: p.code ? formatCode(p.code) : null,
      expiresAt: p.expiresAt, redeemedAt: p.redeemedAt, redeemedBy: p.redeemedBy
    })),
    page, pageSize: PLAYS_PAGE_SIZE, total
  });
}));

// W5 — informational lookup, 200 for every status
app.get('/api/admin/wheel/codes/:code', authMiddleware, requireRoles('admin', 'cashier'), staffCodeLimiter, noStore, featureRoute('admin-wheel-code', async (req, res) => {
  const code = normalizeCode(req.params.code);
  if (!code) return sendError(res, 400, 'invalid_code', 'Format de code invalide (BK-XXXX-XXXX).');
  const play = await WheelPlay.findOne({ code }).lean();
  if (!play) return sendError(res, 404, 'code_not_found', 'Code inconnu.');
  res.json({ play: wheelCodeView(play) });
}));

// Non-redeemable status → [http, error, message, extra], or null when redeemable.
function codeStatusError(play) {
  const st = playStatus(play);
  if (st === 'void') return [409, 'code_void', 'Ce code a été annulé.', {}];
  if (st === 'redeemed') return [409, 'already_redeemed', 'Code déjà utilisé.', { redeemedAt: play.redeemedAt, redeemedBy: play.redeemedBy }];
  if (st === 'expired') return [410, 'code_expired', 'Code expiré.', { expiresAt: play.expiresAt }];
  if (st !== 'won') return [409, 'code_void', 'Ce code a été annulé.', {}];
  return null;
}

// W6 — single-use redemption by authenticated staff, atomic
app.post('/api/admin/wheel/redeem', authMiddleware, requireRoles('admin', 'cashier'), staffCodeLimiter, noStore, featureRoute('admin-wheel-redeem', async (req, res) => {
  const b = req.body || {};
  const code = normalizeCode(b.code);
  if (!code) return sendError(res, 400, 'invalid_code', 'Format de code invalide (BK-XXXX-XXXX).');
  const play = await WheelPlay.findOne({ code }).lean();
  if (!play) return sendError(res, 404, 'code_not_found', 'Code inconnu.');
  const pre = codeStatusError(play);
  if (pre) return sendError(res, pre[0], pre[1], pre[2], pre[3]);

  const memberId = (typeof b.memberId === 'string' && b.memberId) ? b.memberId.slice(0, 80) : null;
  let member = null;
  if (play.type === 'stamps') {
    if (!memberId) return sendError(res, 400, 'member_required', 'Scannez la Carte Babke du client pour créditer les sceaux.');
    member = await LoyaltyMember.findOne({ id: memberId }).lean();
    if (!member) return sendError(res, 404, 'member_not_found', 'Membre introuvable.');
  } else if (memberId) {
    member = await LoyaltyMember.findOne({ id: memberId }).lean();   // optional link, ignored if unknown
  }

  const now = new Date();
  let updated = await WheelPlay.findOneAndUpdate(
    { code, status: 'won', expiresAt: { $gt: now } },
    { $set: { status: 'redeemed', redeemedAt: now, redeemedBy: req.admin.username, redeemedMemberId: member ? member.id : null } },
    { new: true }
  ).lean();
  if (!updated) {
    const cur = await WheelPlay.findOne({ code }).lean();
    const e = (cur && codeStatusError(cur)) || [409, 'already_redeemed', 'Code déjà utilisé.', { redeemedAt: cur ? cur.redeemedAt : null, redeemedBy: cur ? cur.redeemedBy : null }];
    return sendError(res, e[0], e[1], e[2], e[3]);
  }

  let program = null;
  if (play.type === 'stamps') {
    const n = updated.stamps;
    const m2 = await LoyaltyMember.findOneAndUpdate({ id: member.id },
      { $inc: { stamps: n, lifetimeStamps: n }, $set: { lastVisitAt: now } }, { new: true }).lean();
    if (!m2) {
      await WheelPlay.updateOne({ id: updated.id, status: 'redeemed' }, { $set: { status: 'won', redeemedAt: null, redeemedBy: null, redeemedMemberId: null } });
      return sendError(res, 404, 'member_not_found', 'Membre introuvable.');
    }
    member = m2;
    await logLoyaltyEvent({ type: 'wheel_stamps', memberId: m2.id, count: n, byRole: req.admin.role, byUser: req.admin.username });
    sendSseNotification('loyaltyMemberChanged', { memberId: m2.id });
  }
  const labelFr = (updated.segmentLabel && updated.segmentLabel.fr) || updated.segmentId;
  await createAuditLog(req.admin.role, req.admin.username, 'WHEEL_CODE_REDEEM',
    `Lot « ${labelFr} » (${formatCode(updated.code)}) remis à ${updated.firstName} ${maskPhone(updated.phone)}`);
  sendSseNotification('wheelCodeRedeemed', { playId: updated.id, segmentId: updated.segmentId });
  const out = { play: wheelCodeView(updated) };
  if (member) {
    program = await loadProgram();
    out.member = await memberViewOne(member);
    out.program = programSummary(program);
  }
  res.json(out);
}));

// W7
app.post('/api/admin/wheel/plays/:id/void', authMiddleware, requireRoles('admin'), noStore, featureRoute('admin-wheel-void', async (req, res) => {
  const reason = typeof (req.body || {}).reason === 'string' ? req.body.reason.replace(/[\u0000-\u001F\u007F]/g, ' ').trim() : '';
  if (reason.length < 3 || reason.length > 200) return sendError(res, 400, 'invalid_reason', 'Motif obligatoire (3 à 200 caractères).');
  const id = String(req.params.id);
  const play = await WheelPlay.findOneAndUpdate({ id, status: 'won' }, { $set: { status: 'void', voidReason: reason } }, { new: true }).lean();
  if (!play) {
    const exists = await WheelPlay.exists({ id });
    if (!exists) return sendError(res, 404, 'play_not_found', 'Partie introuvable.');
    return sendError(res, 409, 'not_voidable', 'Seul un lot non remis peut être annulé.');
  }
  // Give the unit back to the pool if the segment's stock is still tracked.
  await WheelStock.updateOne({ segmentId: play.segmentId }, { $inc: { left: 1 } });
  const labelFr = (play.segmentLabel && play.segmentLabel.fr) || play.segmentId;
  await createAuditLog(req.admin.role, req.admin.username, 'WHEEL_PLAY_VOID',
    `Lot « ${labelFr} » (${formatCode(play.code)}) annulé pour ${play.firstName} ${maskPhone(play.phone)} — motif : ${reason}`);
  res.json({ play: wheelCodeView(play) });
}));

// W8
app.get('/api/admin/wheel/stats', authMiddleware, requireRoles('admin', 'comptable', 'sm_manager'), noStore, featureRoute('admin-wheel-stats', async (req, res) => {
  const nowMs = Date.now();
  const since7 = new Date(nowMs - 7 * DAY_MS);
  const since30 = new Date(nowMs - 30 * DAY_MS);
  const days = last14DaysWithLabels();
  const [cfg, plays7d, phones7dAgg, wins7d, redeemed7d, wins30d, redeemed30d, expiringSoon, dayAgg, segAgg, stocks] = await Promise.all([
    loadWheelConfig(),
    WheelPlay.countDocuments({ createdAt: { $gt: since7 } }),
    WheelPlay.aggregate([{ $match: { createdAt: { $gt: since7 } } }, { $group: { _id: '$phone' } }, { $count: 'n' }]),
    WheelPlay.countDocuments({ createdAt: { $gt: since7 }, result: 'win' }),
    WheelPlay.countDocuments({ status: 'redeemed', redeemedAt: { $gt: since7 } }),
    WheelPlay.countDocuments({ createdAt: { $gt: since30 }, result: 'win' }),
    WheelPlay.countDocuments({ createdAt: { $gt: since30 }, status: 'redeemed' }),
    WheelPlay.countDocuments({ status: 'won', expiresAt: { $gt: new Date(nowMs), $lte: new Date(nowMs + 72 * HOUR_MS) } }),
    WheelPlay.aggregate([
      { $match: { day: { $in: days.map(d => d.day) } } },
      { $group: { _id: '$day', plays: { $sum: 1 },
                  wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
                  redeemed: { $sum: { $cond: [{ $eq: ['$status', 'redeemed'] }, 1, 0] } } } }
    ]),
    WheelPlay.aggregate([{ $match: { createdAt: { $gt: since30 } } }, { $group: { _id: '$segmentId', n: { $sum: 1 } } }]),
    WheelStock.find({}).lean()
  ]);
  const byDay = new Map(dayAgg.map(d => [d._id, d]));
  const bySeg = new Map(segAgg.map(s => [s._id, s.n]));
  const stockBySeg = new Map(stocks.map(s => [s.segmentId, { left: s.left, total: s.total }]));
  const plays30d = segAgg.reduce((sum, s) => sum + s.n, 0);
  const segs = (cfg && cfg.segments) || [];
  const activeWeight = segs.filter(s => s.active).reduce((sum, s) => sum + (s.weight || 0), 0);
  res.json({
    enabled: Boolean(cfg && cfg.enabled), version: cfg ? cfg.version : 0,
    plays7d, uniquePhones7d: phones7dAgg.length ? phones7dAgg[0].n : 0, wins7d, redeemed7d,
    redemptionRate30d: wins30d ? redeemed30d / wins30d : 0,
    expiringSoon,
    days: days.map(d => {
      const g = byDay.get(d.day);
      return { day: d.day, label: d.label, plays: g ? g.plays : 0, wins: g ? g.wins : 0, redeemed: g ? g.redeemed : 0 };
    }),
    segments: segs.map(s => {
      const n = bySeg.get(s.id) || 0;
      return {
        id: s.id, label: s.label, type: s.type, active: Boolean(s.active), weight: s.weight,
        configuredShare: (s.active && activeWeight > 0) ? s.weight / activeWeight : 0,
        plays30d: n, actualShare30d: plays30d ? n / plays30d : 0,
        stock: stockBySeg.get(s.id) || null
      };
    })
  });
}));

// =========================== ADMIN: MENU BOOK ===========================

// M1
app.get('/api/admin/menu-book', authMiddleware, requireRoles('admin', 'sm_manager'), noStore, featureRoute('admin-menu-book', async (req, res) => {
  res.json(stripMeta(await loadMenuBook()));
}));

// M2
app.put('/api/admin/menu-book', authMiddleware, requireRoles('admin', 'sm_manager'), noStore, featureRoute('admin-menu-book-put', async (req, res) => {
  const b = req.body || {};
  const bad = (message) => sendError(res, 400, 'invalid_menubook', message);
  if (!Number.isInteger(b.version)) return bad('Version du carnet manquante. Rechargez la page.');
  if (typeof b.enabled !== 'boolean') return bad('« Carnet affiché » doit être oui ou non.');
  if (!isInt(b.itemsPerPage, 2, 4)) return bad('Plats par page : un entier entre 2 et 4.');
  if (typeof b.showSoldOut !== 'boolean') return bad('« Afficher les plats épuisés » doit être oui ou non.');
  const cv = b.cover || {};
  const cover = { kicker: pickLoc(cv.kicker, 40), title: pickLoc(cv.title, 30), subtitle: pickLoc(cv.subtitle, 80) };
  if (!cover.kicker) return bad("Couverture : l'accroche (FR) est obligatoire.");
  if (!cover.title) return bad('Couverture : le titre (FR) est obligatoire.');
  if (!cover.subtitle) return bad('Couverture : le sous-titre (FR) est obligatoire.');
  const hp = b.housePage || {};
  const housePage = { title: pickLoc(hp.title, 30), body: pickLoc(hp.body, 400) };
  if (!housePage.title) return bad('Page « La Maison » : le titre (FR) est obligatoire.');
  if (!housePage.body) return bad('Page « La Maison » : le texte (FR) est obligatoire.');
  const backPage = { note: pickLoc((b.backPage || {}).note, 120) };
  if (!backPage.note) return bad('Dernière page : la note (FR) est obligatoire.');
  if (!Array.isArray(b.categories) || b.categories.length < 1 || b.categories.length > 12) return bad('Il faut entre 1 et 12 catégories.');
  const seen = new Set();
  const categories = [];
  for (let i = 0; i < b.categories.length; i++) {
    const c = b.categories[i] || {};
    const n = i + 1;
    if (typeof c.id !== 'string' || !/^[a-z0-9-]{2,30}$/.test(c.id)) return bad(`Catégorie ${n} : identifiant invalide (a-z, 0-9, tiret ; 2 à 30 caractères).`);
    if (seen.has(c.id)) return bad(`Catégorie ${n} : identifiant « ${c.id} » en double.`);
    seen.add(c.id);
    const title = pickLoc(c.title, 30);
    if (!title) return bad(`Catégorie ${n} : le titre (FR) est obligatoire.`);
    const kicker = pickLoc(c.kicker, 60) || emptyLoc();
    categories.push({ id: c.id, title, kicker, visible: c.visible !== false });
  }
  const updated = await MenuBookSettings.findOneAndUpdate(
    { key: 'main', version: b.version },
    { $set: { enabled: b.enabled, itemsPerPage: b.itemsPerPage, showSoldOut: b.showSoldOut, cover, categories, housePage, backPage, updatedAt: new Date() }, $inc: { version: 1 } },
    { new: true }
  ).lean();
  if (!updated) {
    const cur = await MenuBookSettings.findOne({ key: 'main' }).lean();
    return sendError(res, 409, 'version_conflict', 'Le carnet a été modifié entre-temps. Rechargez.', { version: cur ? cur.version : null });
  }
  await createAuditLog(req.admin.role, req.admin.username, 'MENUBOOK_UPDATE',
    `Carnet 3D mis à jour (v${updated.version}, ${updated.enabled ? 'affiché' : 'masqué'}, ${updated.itemsPerPage} plats/page, ${categories.length} catégories)`);
  sendSseNotification('menuBookChanged', { version: updated.version });
  res.json(stripMeta(updated));
}));

// ----------------------------------------------------
// HEALTHCHECK
// Deliberately does NOT touch Mongo: any query would sit on the 10s
// bufferTimeoutMS while Mongo is down and blow the container healthcheck.
// readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting.
// ----------------------------------------------------
app.get('/healthz', (req, res) => {
  const state = mongoose.connection.readyState;
  const healthy = state === 1;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    mongo: state,
    uptime: Math.round(process.uptime())
  });
});

// ----------------------------------------------------
// STATIC ASSETS — explicit allowlist ONLY.
// This used to be `app.use(express.static(__dirname))`, which published the
// entire repository root: /server.js, /seed.js, /package.json,
// /package-lock.json, /config/settings.js, /node_modules/** and /.git/*.
// ----------------------------------------------------
const STATIC_DIRS = ['assets', 'styles', 'scripts', 'components', 'data', 'config'];
const staticOptions = { dotfiles: 'deny', index: false, redirect: false };

STATIC_DIRS.forEach(dir => {
  app.use(`/${dir}`, express.static(path.join(__dirname, dir), staticOptions));
});

// Admin SPA lives in its own directory and keeps a directory index.
app.use('/admin', express.static(path.join(__dirname, 'admin'), {
  index: 'index.html',
  dotfiles: 'deny'
}));

// Landing page.
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Unknown API paths must be a JSON 404. Previously they fell through to the
// catch-all and got a 200 HTML page, which silently broke every client that
// mistyped a route.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl });
});

// ----------------------------------------------------
// SPA FALLBACK — navigation requests only.
// Anything that looks like a file (has an extension) or a dotfile gets a real
// 404 instead of index.html, so browsers never receive HTML under a
// .js/.css/.json MIME type.
// ----------------------------------------------------
const LOOKS_LIKE_FILE = /\.[A-Za-z0-9]{1,8}$/;
const LOOKS_LIKE_DOTFILE = /(^|\/)\.[^/]/;

app.use((req, res) => {
  const isNavigation =
    (req.method === 'GET' || req.method === 'HEAD') &&
    Boolean(req.accepts('html')) &&
    !LOOKS_LIKE_DOTFILE.test(req.path) &&
    !LOOKS_LIKE_FILE.test(req.path);

  if (isNavigation) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  res.status(404).type('text/plain').send('404 Not Found');
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Babke Kebab Backend Server running on port ${PORT}`);
  console.log(`  Open storefront: http://localhost:${PORT}/`);
  console.log(`  Open dashboard:  http://localhost:${PORT}/admin/`);
  console.log(`====================================================`);
});

// ----------------------------------------------------
// GRACEFUL SHUTDOWN
// As PID 1 in the container, without these handlers `docker stop` waits the
// full grace period and then SIGKILLs.
// ----------------------------------------------------
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received — shutting down gracefully...`);

  // Backstop: never hang past this, whatever a socket is doing.
  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out — forcing exit.');
    process.exit(1);
  }, 8000);
  if (typeof forceExit.unref === 'function') forceExit.unref();

  // Release SSE keep-alive connections, otherwise server.close() never fires.
  [...sseClients, ...publicSseClients].forEach(client => {
    try { client.end(); } catch (e) { /* already gone */ }
  });
  sseClients = [];
  publicSseClients = [];

  server.close(async () => {
    try {
      await mongoose.connection.close(false);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err.message);
    }
    clearTimeout(forceExit);
    console.log('Shutdown complete.');
    process.exit(0);
  });

  // Drop idle keep-alive sockets so server.close() does not wait on them.
  // In-flight requests are still allowed to finish. (Node >= 18.2)
  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
