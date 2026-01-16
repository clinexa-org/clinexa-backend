import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Clinexa Backend running on port ${PORT}`);
  });
} catch (err) {
  console.error("DB connection failed:", err.message);
  process.exit(1);
}
