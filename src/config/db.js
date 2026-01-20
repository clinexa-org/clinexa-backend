import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Missing MONGO_URI in environment variables");
}

// Cache connection across hot-reloads / serverless invocations
let cached = globalThis.__mongoose;
if (!cached) {
  cached = globalThis.__mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, return immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection is in progress, wait for it
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      cached.promise = null; // Reset on error
      throw err;
    }
  }

  // Start new connection
  try {
    cached.promise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000, // Increased for cold starts
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    cached.conn = await cached.promise;

    if (process.env.NODE_ENV !== "production") {
      console.log("MongoDB Connected Successfully");
    }

    return cached.conn;
  } catch (error) {
    cached.promise = null; // reset so next request can retry
    console.error("MongoDB Connection Error:", error?.message || error);
    throw error;
  }
};

export default connectDB;
