import express from "express";
import { auth } from "../middleware/auth.js";
import { role } from "../middleware/role.js";
import {
  createPrescription,
  updatePrescription,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPrescriptionsByAppointment,
  getMyPrescriptions,
  getDoctorPrescriptions,
  adminGetPrescriptions
} from "../controllers/prescription.controller.js";

const router = express.Router();

// Patient: get my prescriptions
router.get("/my", auth, role("patient"), getMyPrescriptions);

// Doctor/Admin: get prescriptions by patient
router.get(
  "/patient/:patientId",
  auth,
  role("doctor", "admin"),
  getPrescriptionsByPatient
);

// Doctor/Admin: get prescriptions by appointment
router.get(
  "/appointment/:appointmentId",
  auth,
  role("doctor", "admin"),
  getPrescriptionsByAppointment
);

// Doctor: get all prescriptions I wrote
router.get("/", auth, role("doctor", "admin"), (req, res, next) => {
  if (req.user.role === "admin") {
    return adminGetPrescriptions(req, res);
  } else {
    return getDoctorPrescriptions(req, res);
  }
});

// Doctor: create prescription
router.post("/", auth, role("doctor"), createPrescription);

// Doctor: update prescription
router.put("/:id", auth, role("doctor"), updatePrescription);

// Doctor/Admin/Patient: get single prescription
router.get(
  "/:id",
  auth,
  role("doctor", "admin", "patient"),
  getPrescriptionById
);

export default router;
