const mongoose = require("mongoose");
const config = require("./env");

async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Warning: ${error.message} (Provide MONGO_URI in backend/.env)`);
    if (config.nodeEnv === "production") {
      process.exit(1);
    }
  }
}

module.exports = connectDB;
