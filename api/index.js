import dotenv from "dotenv";
dotenv.config();

import app from "../src/app.js";
import connectDB from "../src/config/db.js";
import { initFirebase } from "../src/config/firebase.js";
import { initSocket } from "../src/services/socket.js";

// Initialize Firebase once (for push notifications)
let firebaseInitialized = false;

export default async function handler(req, res) {
  await connectDB();
  
  // Initialize Firebase on first request
  if (!firebaseInitialized) {
    initFirebase();
    firebaseInitialized = true;
  }
  
  // Initialize Socket.io (Vercel Hack)
  if (res.socket?.server) {
    try {
      initSocket(res.socket.server);
    } catch (err) {
      console.warn("[Socket] Failed to initialize on Vercel:", err.message);
    }
  }
  
  return app(req, res);
}
