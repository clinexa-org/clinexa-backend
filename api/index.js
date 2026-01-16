import dotenv from "dotenv";
dotenv.config();

import app from "../src/app.js";
import connectDB from "../src/config/db.js";

// Connect to database for serverless function
connectDB();

export default app;

