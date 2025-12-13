import express from "express";
import { auth } from "../middleware/auth.js";
import { role } from "../middleware/role.js";
import {
  getStats,
  getPatients,
  togglePatientActive,
  getAppointments,
  updateAppointmentStatus,
  getPrescriptions,
  getClinicSettings,
  updateClinicSettings
} from "../controllers/admin.controller.js";

const router = express.Router();

// all admin routes require auth + admin role
router.use(auth, role("admin"));

// dashboard stats
router.get("/stats", getStats);

// patients management
router.get("/patients", getPatients);
router.patch("/patients/:id/toggle-active", togglePatientActive);

// appointments management
router.get("/appointments", getAppointments);
router.patch("/appointments/:id/status", updateAppointmentStatus);

// prescriptions overview
router.get("/prescriptions", getPrescriptions);

// clinic settings
router.get("/clinic", getClinicSettings);
router.put("/clinic", updateClinicSettings);

export default router;
