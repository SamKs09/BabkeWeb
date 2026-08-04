const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/babkeweb";

async function checkEvents() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    const events = await mongoose.connection.collection('events').find({}).toArray();
    console.log("=== CURRENT EVENTS IN MONGODB ===");
    events.forEach(e => {
      console.log(`ID: ${e.id} | Status: '${e.status}' | Date: ${e.date} | Title:`, e.title);
    });
  } catch (err) {
    console.log("MongoDB not running locally or error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkEvents();
