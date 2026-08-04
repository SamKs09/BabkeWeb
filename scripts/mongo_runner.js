const mongoose = require('mongoose');

async function runQuery() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node scripts/mongo_runner.js '<json_query_payload>'");
    console.error("Payload format: { \"collection\": \"producttypes\", \"action\": \"find\", \"filter\": {}, \"projection\": {} }");
    process.exit(1);
  }

  let payloadStr = args.join(' ');
  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch (e) {
    try {
      // Evaluate JS object literal format
      payload = Function('"use strict"; return (' + payloadStr + ')')();
    } catch (err2) {
      console.error("Invalid query payload:", err2.message);
      process.exit(1);
    }
  }

  const { collection, action = 'find', filter = {}, projection = {}, pipeline = [] } = payload;
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/babke';

  try {
    await mongoose.connect(mongoURI);
    const db = mongoose.connection.db;
    const targetColl = db.collection(collection);

    let results;
    if (action === 'find') {
      results = await targetColl.find(filter, { projection }).limit(50).toArray();
    } else if (action === 'aggregate') {
      results = await targetColl.aggregate(pipeline).toArray();
    } else if (action === 'countDocuments' || action === 'count') {
      results = await targetColl.countDocuments(filter);
    } else if (action === 'listCollections') {
      results = await db.listCollections().toArray();
      results = results.map(c => c.name);
    } else {
      throw new Error(`Unsupported read action: ${action}`);
    }

    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("Execution error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

runQuery();
