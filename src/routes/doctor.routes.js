import express from "express";
import { auth } from "../middleware/auth.js";
import { role } from "../middleware/role.js";
import {
  createDoctor,
  getMyDoctorProfile,
  updateDoctor,
  getAllDoctors,
  getDoctorById
} from "../controllers/doctor.controller.js";

const router = express.Router();

// Doctor creates their profile
router.post("/", auth, role("doctor"), createDoctor);

// Get my doctor profile
router.get("/me", auth, role("doctor"), getMyDoctorProfile);

// Update my profile
router.put("/", auth, role("doctor"), updateDoctor);

// Public — Get all doctors
router.get("/", getAllDoctors);

// Public — Get one doctor
router.get("/:id", getDoctorById);

export default router;
