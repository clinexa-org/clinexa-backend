import Prescription from "../models/Prescription.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import { success, error } from "../utils/response.js";
import { notifyUser } from "../services/notification.service.js";

/**
 * Doctor creates prescription
 * Body:
 *  - patient_id (required)
 *  - appointment_id (optional but recommended)
 *  - notes (optional)
 *  - items: [{ name, dosage, duration, instructions }]
 */

/**
 * Doctor – get my written prescriptions
 */
export const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    const prescriptions = await Prescription.find({ doctor_id: doctor._id })
      .populate("doctor_id")
      .populate({
        path: "patient_id",
        populate: { path: "user_id", select: "name email avatar" }
      })
      .populate("appointment_id")
      .sort({ createdAt: -1 });

    return success(res, { prescriptions });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const createPrescription = async (req, res) => {
  try {
    const { patient_id, appointment_id, diagnosis, notes, items } = req.body;

    if (!diagnosis) {
      return error(res, "diagnosis is required", 400);
    }

    if (!patient_id) {
      return error(res, "patient_id is required", 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return error(res, "At least one prescription item is required", 400);
    }

    // doctor (single doctor per system, but we still respect user_id)
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    // patient must exist
    const patient = await Patient.findById(patient_id);
    if (!patient) return error(res, "Patient not found", 404);

    let appointment = null;

    if (appointment_id) {
      appointment = await Appointment.findById(appointment_id);
      if (!appointment) return error(res, "Appointment not found", 404);

      // ensure this appointment belongs to that patient
      if (appointment.patient_id.toString() !== patient._id.toString()) {
        return error(res, "Appointment does not belong to this patient", 400);
      }

      // Enforce: Appointment must be completed
      if (appointment.status !== "completed") {
        return error(res, "Cannot create prescription for an incomplete appointment", 409);
      }

      // CARDINALITY CHECK: One prescription per appointment
      const existingPrescription = await Prescription.findOne({ appointment_id });
      if (existingPrescription) {
        return error(res, "Prescription already exists for this appointment", 409);
      }
    }

    const prescription = await Prescription.create({
      doctor_id: doctor._id,
      patient_id: patient._id,
      appointment_id: appointment ? appointment._id : null,
      diagnosis,
      notes,
      items
    });

    await prescription.populate([
      { path: "doctor_id", populate: { path: "user_id", select: "name email avatar" } },
      { path: "patient_id", populate: { path: "user_id", select: "name email avatar" } },
      { path: "appointment_id" }
    ]);

    // Notify patient about prescription
    if (patient?.user_id) {
      // Fetch doctor user for notification
      const doctorUser = await Doctor.findById(doctor._id).populate("user_id", "name");
      await notifyUser({
        recipientUserId: patient.user_id,
        type: "PRESCRIPTION_CREATED",
        title: "Prescription Ready",
        body: `Dr. ${doctorUser?.user_id?.name || "Doctor"} has written you a prescription`,
        data: { prescriptionId: prescription._id },
        socketEvent: "prescription:created",
        socketPayload: {
          prescriptionId: prescription._id,
          diagnosis: prescription.diagnosis,
          itemsCount: prescription.items.length
        }
      });
    }

    return success(res, { prescription }, "Prescription created successfully", 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Doctor updates prescription
 */
export const updatePrescription = async (req, res) => {
  try {
    const { diagnosis, notes, items } = req.body;

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return error(res, "Prescription not found", 404);

    // ensure same doctor (optional but best practice)
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    if (prescription.doctor_id.toString() !== doctor._id.toString()) {
      return error(res, "You cannot edit this prescription", 403);
    }

    if (diagnosis !== undefined) prescription.diagnosis = diagnosis;
    if (typeof notes === "string") prescription.notes = notes;
    if (items && Array.isArray(items)) prescription.items = items;

    await prescription.save();

    return success(res, { prescription }, "Prescription updated successfully");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get prescription by ID
 * - doctor & admin: any prescription
 * - patient: only own prescriptions
 */
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("doctor_id")
      .populate("patient_id")
      .populate("appointment_id");

    if (!prescription) return error(res, "Prescription not found", 404);

    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ user_id: req.user.id });
      if (
        !patient ||
        prescription.patient_id._id.toString() !== patient._id.toString()
      ) {
        return error(res, "Access denied", 403);
      }
    } else if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ user_id: req.user.id });
      if (
        !doctor ||
        prescription.doctor_id._id.toString() !== doctor._id.toString()
      ) {
        return error(res, "Access denied", 403);
      }
    }

    return success(res, { prescription });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get prescriptions for a specific patient (doctor/admin)
 */
export const getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Security: If doctor, ensure they have at least one appointment with this patient
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ user_id: req.user.id });
      if (!doctor) return error(res, "Doctor profile not found", 404);

      const hasAppointment = await Appointment.findOne({
        doctor_id: doctor._id,
        patient_id: patientId
      });

      if (!hasAppointment) {
        return error(res, "You do not have access to this patient's prescriptions", 403);
      }
    }

    const prescriptions = await Prescription.find({ patient_id: patientId })
      .populate("doctor_id")
      .populate("patient_id")
      .populate("appointment_id")
      .sort({ createdAt: -1 });

    return success(res, { prescriptions });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get prescriptions for a specific appointment (doctor/admin)
 */
export const getPrescriptionsByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescriptions = await Prescription.find({ appointment_id: appointmentId })
      .populate("doctor_id")
      .populate("patient_id")
      .populate("appointment_id")
      .sort({ createdAt: -1 });

    return success(res, { prescriptions });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Patient – get my prescriptions
 */
export const getMyPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user_id: req.user.id });
    if (!patient) return error(res, "Patient profile not found", 404);

    const prescriptions = await Prescription.find({ patient_id: patient._id })
      .populate({
        path: "doctor_id",
        populate: { path: "user_id", select: "name email avatar" }
      })
      .populate("appointment_id")
      .sort({ createdAt: -1 });

    return success(res, { prescriptions });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Admin – get all prescriptions (optional filters later)
 */
export const adminGetPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate("doctor_id")
      .populate("patient_id")
      .populate("appointment_id")
      .sort({ createdAt: -1 });

    return success(res, { prescriptions });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
