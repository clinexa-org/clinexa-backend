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
  try {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000
      });
    }

    cached.conn = await cached.promise;

    // اختياري: اطبع مرة واحدة
    if (process.env.NODE_ENV !== "production") {
      console.log("MongoDB Connected Successfully");
    }

    return cached.conn;
  } catch (error) {
    cached.promise = null; // reset so next request can retry
    console.error("MongoDB Connection Error:", error?.message || error);
    throw error; // مهم: خلي Vercel يرجّع 500 بدل ما يكمّل بـ app فاضي
  }
};

export default connectDB;
