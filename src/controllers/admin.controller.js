import { success, error } from "../utils/response.js";

import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Clinic from "../models/Clinic.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";

/**
 * GET /api/admin/stats
 */
export const getStats = async (req, res) => {
  try {
    const doctor = await Doctor.findOne();
    const doctorId = doctor ? doctor._id : null;

    const [
      totalPatients,
      totalAppointments,
      totalPrescriptions,
      pendingAppointments,
      confirmedAppointments
    ] = await Promise.all([
      Patient.countDocuments(),
      doctorId ? Appointment.countDocuments({ doctor_id: doctorId }) : Appointment.countDocuments(),
      Prescription.countDocuments(),
      doctorId ? Appointment.countDocuments({ doctor_id: doctorId, status: "pending" }) : Appointment.countDocuments({ status: "pending" }),
      doctorId ? Appointment.countDocuments({ doctor_id: doctorId, status: "confirmed" }) : Appointment.countDocuments({ status: "confirmed" })
    ]);

    // appointments today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const appointmentsToday = doctorId
      ? await Appointment.countDocuments({ doctor_id: doctorId, start_time: { $gte: start, $lt: end } })
      : await Appointment.countDocuments({ start_time: { $gte: start, $lt: end } });

    return success(res, {
      totalPatients,
      totalAppointments,
      appointmentsToday,
      pendingAppointments,
      confirmedAppointments,
      totalPrescriptions
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/admin/patients
 * Returns patients with their linked user
 */
export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("user_id")
      .sort({ createdAt: -1 });

    return success(res, { patients });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * PATCH /api/admin/patients/:id/toggle-active
 * Here :id is Patient._id
 * Toggles User.is_active
 */
export const togglePatientActive = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return error(res, "Patient not found", 404);

    const user = await User.findById(patient.user_id);
    if (!user) return error(res, "User not found", 404);

    user.is_active = !user.is_active;
    await user.save();

    return success(res, { user }, "Patient active status updated");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/admin/appointments?status=&date=YYYY-MM-DD
 */
export const getAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne();
    const doctorId = doctor ? doctor._id : null;

    const query = {};
    if (doctorId) query.doctor_id = doctorId;

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.date) {
      const day = new Date(req.query.date);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      query.start_time = { $gte: day, $lt: nextDay };
    }

    const appointments = await Appointment.find(query)
      .populate("patient_id")
      .populate("doctor_id")
      .populate("clinic_id")
      .sort({ start_time: 1 });

    return success(res, { appointments });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * PATCH /api/admin/appointments/:id/status
 * body: { status: "pending|confirmed|cancelled|completed" }
 */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ["pending", "confirmed", "cancelled", "completed"];
    if (!allowed.includes(status)) {
      return error(res, "Invalid status value", 400);
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return error(res, "Appointment not found", 404);

    appointment.status = status;
    await appointment.save();

    return success(res, { appointment }, "Appointment status updated");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/admin/prescriptions
 */
export const getPrescriptions = async (req, res) => {
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

/**
 * GET /api/admin/clinic
 * Single doctor V1 → fetch clinic for the only doctor
 */
export const getClinicSettings = async (req, res) => {
  try {
    const doctor = await Doctor.findOne();
    if (!doctor) return error(res, "Doctor profile not found", 404);

    let clinic = null;
    if (doctor.clinic_id) {
      clinic = await Clinic.findById(doctor.clinic_id);
    } else {
      clinic = await Clinic.findOne({ doctor_id: doctor._id });
    }

    return success(res, { clinic });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * PUT /api/admin/clinic
 * body: { name, address, city, phone, location_link }
 */
export const updateClinicSettings = async (req, res) => {
  try {
    const doctor = await Doctor.findOne();
    if (!doctor) return error(res, "Doctor profile not found", 404);

    let clinic = null;
    if (doctor.clinic_id) {
      clinic = await Clinic.findById(doctor.clinic_id);
    } else {
      clinic = await Clinic.findOne({ doctor_id: doctor._id });
    }

    if (!clinic) return error(res, "Clinic not found", 404);

    const { name, address, city, phone, location_link } = req.body;

    if (typeof name === "string") clinic.name = name;
    if (typeof address === "string") clinic.address = address;
    if (typeof city === "string") clinic.city = city;
    if (typeof phone === "string") clinic.phone = phone;
    if (typeof location_link === "string") clinic.location_link = location_link;

    await clinic.save();

    return success(res, { clinic }, "Clinic settings updated");
  } catch (err) {
    return error(res, err.message, 500);
  }
};
