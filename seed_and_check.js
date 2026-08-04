const mongoose = require('mongoose');
const defaultData = require('./data/defaultData.js');
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/babkeweb";

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

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    let count = await Event.countDocuments();
    if (count === 0) {
      console.log("Seeding events into MongoDB...");
      await Event.insertMany(defaultData.events);
    }
    const events = await Event.find().lean();
    console.log("=== EVENTS IN MONGODB ===");
    events.forEach(e => {
      console.log(`ID: ${e.id} | Status: '${e.status}' | Date: ${e.date}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
