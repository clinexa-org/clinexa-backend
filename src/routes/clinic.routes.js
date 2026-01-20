import express from "express";
import { auth } from "../middleware/auth.js";
import { role } from "../middleware/role.js";
import {
  upsertClinic,
  getMyClinic,
  getClinicByDoctor,
  getMyWorkingHours,
  updateMyWorkingHours
} from "../controllers/clinic.controller.js";

const router = express.Router();

// Doctor creates or updates clinic
router.post("/", auth, role("doctor"), upsertClinic);

// Get my clinic
router.get("/me", auth, role("doctor"), getMyClinic);

// Working hours routes
router.get("/working-hours/me", auth, role("doctor"), getMyWorkingHours);
router.put("/working-hours/me", auth, role("doctor"), updateMyWorkingHours);

// Public - get clinic for specific doctor
router.get("/:doctorId", getClinicByDoctor);

export default router;
