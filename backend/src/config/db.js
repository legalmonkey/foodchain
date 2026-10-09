const mongoose = require("mongoose");
const config = require("./env");

async function connectDB() {
  // Disable command buffering so queries fail-fast to in-memory fallback if disconnected
  mongoose.set("bufferCommands", false);

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Warning: ${error.message} (Using resilient in-memory data store)`);
  }
}

module.exports = connectDB;
