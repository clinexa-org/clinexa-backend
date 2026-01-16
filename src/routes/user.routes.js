import express from "express";
import {
  uploadAvatar,
  removeAvatar,
  updateProfile,
  getProfile,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Avatar routes
router.post("/avatar", upload.single("avatar"), uploadAvatar);
router.delete("/avatar", removeAvatar);

// Profile routes
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

export default router;
