import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Clinic from "../models/Clinic.js";
import Patient from "../models/Patient.js";
import { success, error } from "../utils/response.js";

/**
 * Patient creates appointment
 * Single-doctor system → backend picks doctor automatically
 */
export const createAppointment = async (req, res) => {
  try {
    const { start_time, reason } = req.body;

    if (!start_time) {
      return error(res, "start_time is required");
    }

    // find patient profile
    const patient = await Patient.findOne({ user_id: req.user.id });
    if (!patient) return error(res, "Patient profile not found", 404);

    // single doctor in system (V1)
    const doctor = await Doctor.findOne();
    if (!doctor) return error(res, "Doctor profile not found", 404);

    // clinic for that doctor (optional)
    let clinic = null;
    if (doctor.clinic_id) {
      clinic = await Clinic.findById(doctor.clinic_id);
    } else {
      clinic = await Clinic.findOne({ doctor_id: doctor._id });
    }

    const appointment = await Appointment.create({
      doctor_id: doctor._id,
      patient_id: patient._id,
      clinic_id: clinic ? clinic._id : null,
      start_time: new Date(start_time),
      reason,
      source: "patient_app"
    });

    return success(res, { appointment }, "Appointment created", 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Patient – get my appointments
 */
export const getMyAppointments = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user_id: req.user.id });
    if (!patient) return error(res, "Patient profile not found", 404);

    const appointments = await Appointment.find({ patient_id: patient._id })
      .populate("doctor_id")
      .populate("clinic_id")
      .sort({ start_time: 1 });

    return success(res, { appointments });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Doctor – get doctor appointments
 * optional ?date=YYYY-MM-DD
 */
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    const query = { doctor_id: doctor._id };

    if (req.query.date) {
      const day = new Date(req.query.date);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      query.start_time = { $gte: day, $lt: nextDay };
    }

    const appointments = await Appointment.find(query)
      .populate("patient_id")
      .populate("clinic_id")
      .sort({ start_time: 1 });

    return success(res, { appointments });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Admin – get all appointments (with filters)
 * ?status=&date=
 */
export const adminGetAppointments = async (req, res) => {
  try {
    const query = {};

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
      .populate("doctor_id")
      .populate("patient_id")
      .populate("clinic_id")
      .sort({ start_time: 1 });

    return success(res, { appointments });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Doctor/Admin – confirm appointment
 */
export const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return error(res, "Appointment not found", 404);

    appointment.status = "confirmed";
    await appointment.save();

    return success(res, { appointment }, "Appointment confirmed");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Patient/Doctor/Admin – cancel appointment
 * patient can only cancel his own appointment
 */
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return error(res, "Appointment not found", 404);

    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ user_id: req.user.id });
      if (!patient || appointment.patient_id.toString() !== patient._id.toString()) {
        return error(res, "You cannot cancel this appointment", 403);
      }
    }

    appointment.status = "cancelled";
    await appointment.save();

    return success(res, { appointment }, "Appointment cancelled");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Doctor/Admin – complete appointment
 */
export const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return error(res, "Appointment not found", 404);

    appointment.status = "completed";
    await appointment.save();

    return success(res, { appointment }, "Appointment completed");
  } catch (err) {
    return error(res, err.message, 500);
  }
};
