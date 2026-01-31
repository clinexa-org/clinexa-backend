import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead
} from "../controllers/notifications.controller.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/notifications/me?unreadOnly=true|false&limit=20&page=1
router.get("/me", getMyNotifications);

// PATCH /api/notifications/read-all (must be before /:id)
router.patch("/read-all", markAllAsRead);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", markAsRead);

export default router;
