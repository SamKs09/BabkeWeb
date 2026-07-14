const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 65342;

// Middleware
app.use(cors());
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
  likes: String
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
    }

    // Seed Events
    const eventsCount = await Event.countDocuments();
    if (eventsCount === 0) {
      await Event.insertMany(defaultData.events || []);
      console.log('Seeded Events collection successfully.');
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
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const reservations = await Reservation.find().sort({ createdAt: -1 }).lean();
    const events = await Event.find().lean();

    res.json({
      menu,
      content: contentDoc,
      reviews,
      gallery,
      orders,
      reservations,
      events
    });
  } catch (err) {
    console.error('Error fetching all data:', err);
    res.status(500).json({ error: 'Server error fetching all database state.' });
  }
});

// Admin login verification route
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'babke2026';

  if (username === adminUser && password === adminPass) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid username or password' });
  }
});

// Menu Endpoints
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await Menu.find();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const newItem = new Menu(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id', async (req, res) => {
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

app.delete('/api/menu/:id', async (req, res) => {
  try {
    const deleted = await Menu.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu', async (req, res) => {
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

app.put('/api/content', async (req, res) => {
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

app.post('/api/reviews', async (req, res) => {
  try {
    const newReview = new Review(req.body);
    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reviews/:id', async (req, res) => {
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

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const deleted = await Review.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reviews', async (req, res) => {
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

app.post('/api/gallery', async (req, res) => {
  try {
    const newPhoto = new Gallery(req.body);
    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const deleted = await Gallery.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Gallery photo not found' });
    res.json({ success: true, message: 'Gallery photo deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/gallery', async (req, res) => {
  try {
    await Gallery.deleteMany({});
    const updatedGallery = await Gallery.insertMany(req.body);
    res.json(updatedGallery);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

app.post('/api/events', async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
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

app.delete('/api/events/:id', async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events', async (req, res) => {
  try {
    await Event.deleteMany({});
    const updatedEvents = await Event.insertMany(req.body);
    res.json(updatedEvents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders Endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
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
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reservations Endpoints
app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();
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
