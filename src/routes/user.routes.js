import express from "express";
import {
  removeAvatar,
  updateProfile,
  getProfile,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get("/profile", getProfile);
router.put("/profile", upload.single("avatar"), updateProfile);

// Remove avatar (set back to default)
router.delete("/avatar", removeAvatar);

export default router;
