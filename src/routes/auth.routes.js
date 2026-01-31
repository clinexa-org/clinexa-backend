import express from "express";
import { register, login, me, forgotPassword, resetPassword, registerDeviceToken, removeDeviceToken } from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, me);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Device token management (for push notifications)
router.post("/device-token", auth, registerDeviceToken);
router.delete("/device-token", auth, removeDeviceToken);

export default router;
