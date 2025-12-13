import express from "express";
import { auth } from "../middleware/auth.js";
import { role } from "../middleware/role.js";
import {
  upsertPatient,
  getMyPatient,
  getAllPatients,
  getPatientById
} from "../controllers/patient.controller.js";

const router = express.Router();

// Patient create/update
router.post("/", auth, role("patient"), upsertPatient);

// Patient get my data
router.get("/me", auth, role("patient"), getMyPatient);

// Admin get all patients
router.get("/", auth, role("admin"), getAllPatients);

// Doctor get patient by ID
router.get("/:id", auth, role("doctor"), getPatientById);

export default router;
