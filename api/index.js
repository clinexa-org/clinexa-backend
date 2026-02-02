import dotenv from "dotenv";
dotenv.config();

import app from "../src/app.js";
import connectDB from "../src/config/db.js";
import { initFirebase } from "../src/config/firebase.js";

// Initialize Firebase once (for push notifications)
let firebaseInitialized = false;

export default async function handler(req, res) {
  await connectDB();
  
  // Initialize Firebase on first request
  if (!firebaseInitialized) {
    initFirebase();
    firebaseInitialized = true;
  }
  
  return app(req, res);
}
