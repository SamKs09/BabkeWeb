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
  tags: mongoose.Schema.Types.Mixed
}));

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

    // Check if authenticated to include order/reservation or leftovers
    let orders = [];
    let reservations = [];
    let leftovers = [];
    const token = req.cookies.admin_token;
    if (token) {
      try {
        const verified = jwt.verify(token, process.env.SESSION_SECRET || 'babkesupersecretkey2026');
        leftovers = await Leftover.find().sort({ date: -1, createdAt: -1 }).lean();
        
        // Only return orders & bookings for admin/owner roles
        if (verified.role === 'admin') {
          orders = await Order.find().sort({ createdAt: -1 }).lean();
          reservations = await Reservation.find().sort({ createdAt: -1 }).lean();
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
      leftovers
    });
  } catch (err) {
    console.error('Error fetching all data:', err);
    res.status(500).json({ error: 'Server error fetching all database state.' });
  }
});

// Admin login verification route
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'babke2026';
  
  const workerUser = 'worker';
  const workerPass = process.env.WORKER_PASSWORD || 'babkeworker2026';

  let role = null;
  if (username === adminUser && password === adminPass) {
    role = 'admin';
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
    res.json({ success: true, role: role });
  } else {
    res.status(401).json({ success: false, error: 'Invalid username or password' });
  }
});

// Admin verification route
app.get('/api/admin/verify', authMiddleware, (req, res) => {
  res.json({ success: true, role: req.admin.role });
});

// Admin logout route
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
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

// Keep track of active SSE connections (admin dashboard tabs)
let sseClients = [];

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

function sendSseNotification(event, data) {
  sseClients.forEach(client => {
    try {
      client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      // Clean up client if write fails
      sseClients = sseClients.filter(c => c !== client);
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
    const updated = await Menu.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Menu item not found' });
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

app.post('/api/events', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const updated = await Event.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    await Event.deleteMany({});
    const updatedEvents = await Event.insertMany(req.body);
    res.json(updatedEvents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders Endpoints
app.get('/api/orders', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
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
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reservations Endpoints
app.get('/api/reservations', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
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
    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reservations/:id', authMiddleware, ownerOnlyMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
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
