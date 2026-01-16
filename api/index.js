import dotenv from "dotenv";
dotenv.config();

import app from "../src/app.js";
import connectDB from "../src/config/db.js";

// Vercel serverless handler
export default async function handler(req, res) {
  // Ensure DB connection before handling requests
  await connectDB();
  
  // Pass request to Express app
  return app(req, res);
}
