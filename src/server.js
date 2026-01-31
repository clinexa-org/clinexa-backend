import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./services/socket.js";
import { initFirebase } from "./config/firebase.js";
import { startReminderJob } from "./jobs/reminder.job.js";

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  
  // Initialize Firebase Admin SDK
  initFirebase();
  
  // Create HTTP server and attach Socket.io
  const server = http.createServer(app);
  initSocket(server);
  
  // Start reminder cron job
  startReminderJob();
  
  server.listen(PORT, () => {
    console.log(`Clinexa Backend running on port ${PORT}`);
  });
} catch (err) {
  console.error("DB connection failed:", err.message);
  process.exit(1);
}
