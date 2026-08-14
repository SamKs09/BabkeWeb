/**
 * BABKE KEBAB & PLATES — DATABASE PURGE & SEED SCRIPT
 * Run via CLI: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const defaultData = require('./data/defaultData.js');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/babke_db';

// Define Mongoose Schemas & Models
const menuSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  image: String,
  fallbackImage: String,
  title: { en: String, fr: String, tn: String },
  description: { en: String, fr: String, tn: String },
  tags: { en: [String], fr: [String], tn: [String] }
}, { timestamps: true });

const contentSchema = new mongoose.Schema({ key: { type: String, default: 'main' } }, { strict: false });

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  stars: Number,
  date: String,
  text: String,
  author: String,
  role: String,
  avatar: String,
  featured: Boolean,
  hidden: Boolean
}, { timestamps: true });

const gallerySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  image: String,
  alt: String,
  likes: String,
  link: String
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  image: String,
  fallbackImage: String,
  title: { en: String, fr: String, tn: String },
  date: String,
  duration: { en: String, fr: String, tn: String },
  location: { en: String, fr: String, tn: String },
  description: { en: String, fr: String, tn: String },
  status: { type: String, default: 'published' }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: { name: String, phone: String, address: String },
  items: Array,
  subtotal: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const reservationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  date: String,
  time: String,
  guests: Number,
  notes: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const leftoverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: String,
  item: String,
  quantity: Number,
  unit: String,
  createdAt: { type: Date, default: Date.now }
});

const expenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: String,
  category: String,
  description: String,
  amount: Number,
  paymentMethod: String,
  recordedBy: String,
  createdAt: { type: Date, default: Date.now }
});

const productTypeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  defaultUnit: { type: String, required: true },
  minStockAlert: { type: Number, default: 5 }
}, { timestamps: true });

const stockMovementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: String,
  productName: String,
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  quantity: Number,
  unit: String,
  unitPrice: Number,
  totalPrice: Number,
  supplier: String,
  reason: String,
  recordedBy: String,
  createdAt: { type: Date, default: Date.now }
});

const ruinedProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: String,
  item: String,
  quantity: Number,
  unit: String,
  reason: String,
  recordedBy: String,
  createdAt: { type: Date, default: Date.now }
});

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: String,
  userRole: String,
  username: String,
  actionType: String,
  details: String,
  createdAt: { type: Date, default: Date.now }
});

const accountingSheetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sheetType: { type: String, required: true },
  date: String,
  article: String,
  quantity: Number,
  unitValue: Number,
  total: Number,
  cuisseQty: Number,
  cuisseVal: Number,
  cuisseTot: Number,
  blancQty: Number,
  blancVal: Number,
  blancTot: Number,
  escalopeQty: Number,
  escalopeVal: Number,
  escalopeTot: Number,
  cuisseCompQty: Number,
  cuisseCompVal: Number,
  cuisseCompTot: Number,
  oeufQty: Number,
  oeufVal: Number,
  oeufTot: Number,
  recordedBy: String,
  createdAt: { type: Date, default: Date.now }
});

const Menu = mongoose.model('Menu', menuSchema);
const Content = mongoose.model('Content', contentSchema);
const Review = mongoose.model('Review', reviewSchema);
const Gallery = mongoose.model('Gallery', gallerySchema);
const Event = mongoose.model('Event', eventSchema);
const Order = mongoose.model('Order', orderSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);
const Leftover = mongoose.model('Leftover', leftoverSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const ProductType = mongoose.model('ProductType', productTypeSchema);
const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
const RuinedProduct = mongoose.model('RuinedProduct', ruinedProductSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);
const AccountingSheet = mongoose.model('AccountingSheet', accountingSheetSchema);

async function purgeAndSeed() {
  try {
    console.log('Connecting to MongoDB database at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    console.log('🧹 Purging existing collections...');
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
    console.log('✨ All collections purged successfully.');

    console.log('🌱 Seeding clean demo datasets...');

    // 1. Menu Items
    await Menu.insertMany(defaultData.menu);
    console.log(`- Menu: Seeded ${defaultData.menu.length} items`);

    // 2. Main Content
    await Content.create({ key: 'main', ...defaultData.content });
    console.log('- Content: Seeded main website configuration');

    // 3. Reviews
    await Review.insertMany(defaultData.reviews);
    console.log(`- Reviews: Seeded ${defaultData.reviews.length} reviews`);

    // 4. Gallery
    await Gallery.insertMany(defaultData.gallery);
    console.log(`- Gallery: Seeded ${defaultData.gallery.length} gallery posts`);

    // 5. Events
    await Event.insertMany(defaultData.events || []);
    console.log(`- Events: Seeded ${(defaultData.events || []).length} events`);

    // 6. Orders
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
      },
      {
        id: "ORD-1719020000",
        customer: { name: "Karim Ben Cheikh", phone: "+216 50 112 233", address: "Avenue Hédi Chaker, Sousse" },
        items: [
          { name: "Babke \"2 Viandes\" Wrap", qty: 2, price: 16.0, spice: "Spicy", addons: ["Extra Cheese"], exclusions: [] },
          { name: "Cheddarli Taouk", qty: 1, price: 14.0, spice: "Medium", addons: [], exclusions: [] }
        ],
        subtotal: 46.0,
        status: "delivered",
        createdAt: new Date("2026-07-28T19:45:00.000Z")
      }
    ];
    await Order.insertMany(seedOrders);
    console.log(`- Orders: Seeded ${seedOrders.length} customer orders`);

    // 7. Reservations
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
    console.log(`- Reservations: Seeded ${seedReservations.length} table reservations`);

    // 8. Leftovers
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
    console.log(`- Leftovers: Seeded ${seedLeftovers.length} entries`);

    // 9. Caisse Expenses
    await Expense.insertMany(defaultData.expenses);
    console.log(`- Expenses: Seeded ${defaultData.expenses.length} entries`);

    // 10. Product Types
    await ProductType.insertMany(defaultData.productTypes);
    console.log(`- ProductTypes: Seeded ${defaultData.productTypes.length} catalog items`);

    // 11. Stock Movements
    await StockMovement.insertMany(defaultData.stockMovements);
    console.log(`- StockMovements: Seeded ${defaultData.stockMovements.length} inventory movements`);

    // 12. Ruined Products
    await RuinedProduct.insertMany(defaultData.ruinedProducts);
    console.log(`- RuinedProducts: Seeded ${defaultData.ruinedProducts.length} entries`);

    // 13. Audit Logs
    await AuditLog.insertMany(defaultData.auditLogs);
    console.log(`- AuditLogs: Seeded ${defaultData.auditLogs.length} audit trail logs`);

    // 14. Digitized Accounting Sheets
    const docsToInsert = [];
    const sheets = defaultData.accountingSheets;
    for (const sheetType in sheets) {
      sheets[sheetType].forEach(item => {
        docsToInsert.push({ ...item, sheetType: sheetType, recordedBy: 'comptable' });
      });
    }
    await AccountingSheet.insertMany(docsToInsert);
    console.log(`- AccountingSheets: Seeded ${docsToInsert.length} physical sheet rows across 4 categories`);

    console.log('\n🎉 ALL DASHBOARD DATA HAS BEEN RE-SEEDED SUCCESSFULLY!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error during purge and seed:', err);
    process.exit(1);
  }
}

purgeAndSeed();
