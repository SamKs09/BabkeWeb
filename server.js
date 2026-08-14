const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  console.warn('\x1b[33m%s\x1b[0m', 'WARNING: ADMIN_USERNAME or ADMIN_PASSWORD not set in environment. Falling back to defaults.');
}
if (!process.env.SESSION_SECRET) {
  console.warn('\x1b[33m%s\x1b[0m', 'WARNING: SESSION_SECRET not set in environment. Falling back to default secret.');
}


const app = express();
const PORT = process.env.PORT || 65342;

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: true, // Allow all origins for API calls, but credential-based ones require credentials
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Support base64 image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/babke';
mongoose.connect(mongoURI)
  .then(() => {
    console.log(`Successfully connected to MongoDB at ${mongoURI}`);
    seedDatabase();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

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

const authMiddleware = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized access. Token missing.' });
  }
  try {
    const verified = jwt.verify(token, process.env.SESSION_SECRET || 'babkesupersecretkey2026');
    req.admin = verified;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized access. Invalid or expired token.' });
  }
};

const ownerOnlyMiddleware = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Owner permissions required.' });
  }
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
    } else {
      // Auto-migrate past seeded events to future dates and restore published status
      const defaultEvt0 = (defaultData.events || []).find(e => e.id === "evt-0");
      const defaultEvt1 = (defaultData.events || []).find(e => e.id === "evt-1");
      if (defaultEvt0) {
        await Event.updateOne(
          { id: "evt-0" },
          { $set: { date: defaultEvt0.date, status: "published" } }
        );
      }
      if (defaultEvt1) {
        await Event.updateOne(
          { id: "evt-1" },
          { $set: { date: defaultEvt1.date, status: "published" } }
        );
      }
      console.log('Successfully migrated seeded events to future dates.');
    }

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
    const ptCount = await ProductType.countDocuments();
    if (ptCount === 0) {
      const seedPt = defaultData.productTypes || [];
      if (seedPt.length > 0) {
        await ProductType.insertMany(seedPt);
        console.log('Seeded ProductType collection with 34 physical sheet articles successfully.');
      }
    } else {
      // Re-sync product types to ensure all 34 articles match the physical sheet
      await ProductType.deleteMany({});
      await ProductType.insertMany(defaultData.productTypes);
      console.log('ProductType collection synced successfully with all 34 physical sheet articles.');
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
        const verified = jwt.verify(token, process.env.SESSION_SECRET || 'babkesupersecretkey2026');
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
      accountingSheets
    });
  } catch (err) {
    console.error('Error fetching all data:', err);
    res.status(500).json({ error: 'Server error fetching all database state.' });
  }
});

// Admin login verification route
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'babke2026';

  const comptableUser = process.env.COMPTABLE_USERNAME || 'comptable';
  const comptablePass = process.env.COMPTABLE_PASSWORD || 'babkecomptable2026';

  const mediaUser = process.env.MEDIA_USERNAME || 'media';
  const mediaPass = process.env.MEDIA_PASSWORD || 'babkemedia2026';

  const cashierUser = process.env.CASHIER_USERNAME || 'cashier';
  const cashierPass = process.env.CASHIER_PASSWORD || 'babkecashier2026';
  
  const workerUser = process.env.WORKER_USERNAME || 'worker';
  const workerPass = process.env.WORKER_PASSWORD || 'babkeworker2026';

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
      process.env.SESSION_SECRET || 'babkesupersecretkey2026',
      { expiresIn: '24h' }
    );
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
  res.clearCookie('admin_token');
  res.json({ success: true });
});

// Admin Reset & Seed Database Route
app.post('/api/admin/reset-database', authMiddleware, async (req, res) => {
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
app.get('/api/product-types', async (req, res) => {
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
    jwt.verify(token, process.env.SESSION_SECRET || 'babkesupersecretkey2026');
  } catch (err) {
    return res.status(401).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Public SSE stream for real-time storefront synchronization
app.get('/api/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  publicSseClients.push(res);

  req.on('close', () => {
    publicSseClients = publicSseClients.filter(client => client !== res);
  });
});

function sendSseNotification(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (err) {
      sseClients = sseClients.filter(c => c !== client);
    }
  });

  publicSseClients.forEach(client => {
    try {
      client.write(payload);
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
app.patch('/api/menu/:id/availability', async (req, res) => {
  try {
    const { available } = req.body;
    const targetId = req.params.id;

    // Case-insensitive search for menu item ID
    let updated = await Menu.findOneAndUpdate(
      { $or: [{ id: targetId }, { id: targetId.toLowerCase() }] },
      { $set: { available: Boolean(available) } },
      { new: true }
    );

    // If item doesn't exist in MongoDB yet, upsert it from defaultData
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

app.put('/api/orders/:id', async (req, res) => {
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

app.put('/api/reservations/:id', async (req, res) => {
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

// Serve Static Assets from Root
app.use(express.static(__dirname));

// Fallback index.html serving (single page application support, though not strictly needed since static handles it)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Babke Kebab Backend Server running on port ${PORT}`);
  console.log(`  Open storefront: http://localhost:${PORT}/index.html`);
  console.log(`  Open dashboard:  http://localhost:${PORT}/admin/index.html`);
  console.log(`====================================================`);
});
