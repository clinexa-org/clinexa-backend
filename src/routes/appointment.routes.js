import express from "express";
import { auth } from "../middleware/auth.js";
import { role } from "../middleware/role.js";
import {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  adminGetAppointments,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  getAvailableSlots
} from "../controllers/appointment.controller.js";

const router = express.Router();

// Patient: get available slots for a date
router.get("/slots", auth, role("patient"), getAvailableSlots);


// Patient: create appointment (single-doctor system)
router.post("/", auth, role("patient"), createAppointment);

// Patient: my appointments
router.get("/my", auth, role("patient"), getMyAppointments);

// Doctor: all doctor appointments (optional ?date=YYYY-MM-DD)
router.get("/doctor", auth, role("doctor"), getDoctorAppointments);

// Admin: all appointments
router.get("/", auth, role("admin"), adminGetAppointments);

// Doctor/Admin: confirm appointment
router.patch("/confirm/:id", auth, role("doctor", "admin"), confirmAppointment);

// Patient/Doctor/Admin: cancel appointment
router.patch("/cancel/:id", auth, role("patient", "doctor", "admin"), cancelAppointment);

// Doctor/Admin: complete appointment
router.patch("/complete/:id", auth, role("doctor", "admin"), completeAppointment);

// Patient: reschedule appointment
router.patch("/reschedule/:id", auth, role("patient"), rescheduleAppointment);

export default router;
