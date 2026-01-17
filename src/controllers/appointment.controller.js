import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Clinic from "../models/Clinic.js";
import Patient from "../models/Patient.js";
import { success, error } from "../utils/response.js";

import { sendEmail } from "../services/email.service.js";
import {
  appointmentCreatedTemplate,
  appointmentConfirmedTemplate,
  appointmentCancelledTemplate
} from "../services/email.templates.js";

/**
 * Patient creates appointment
 * Single-doctor system → backend picks doctor automatically
 */
export const createAppointment = async (req, res) => {
  try {
    const { start_time, date, time, reason } = req.body;

    let appointmentStartTime;

    if (start_time) {
      appointmentStartTime = new Date(start_time);
    } else if (date && time) {
      // Combine date (YYYY-MM-DD) and time (HH:mm)
      appointmentStartTime = new Date(`${date}T${time}:00`);
    }

    if (!appointmentStartTime || isNaN(appointmentStartTime.getTime())) {
      return error(res, "Valid start_time or both date and time are required", 400);
    }

    // find patient profile
    const patient = await Patient.findOne({ user_id: req.user.id }).populate("user_id");
    if (!patient) return error(res, "Patient profile not found", 404);

    // single doctor in system (V1) + populate user to get doctor email
    const doctor = await Doctor.findOne().populate("user_id");
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
      start_time: appointmentStartTime,
      reason,
      source: "patient_app"
    });

    // Email → Doctor (appointment created)
    if (doctor?.user_id?.email) {
      await sendEmail({
        to: doctor.user_id.email,
        subject: "New Appointment Booked",
        html: appointmentCreatedTemplate({
          patientName: patient?.user_id?.name || "Patient",
          date: appointment.start_time.toLocaleString('en-US', { hour12: true })
        })
      });
    }

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
      .populate({
        path: "doctor_id",
        populate: { path: "user_id" }
      })
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
      .populate({
        path: "patient_id",
        populate: { path: "user_id" }
      })
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
      .populate({
        path: "doctor_id",
        populate: { path: "user_id" }
      })
      .populate({
        path: "patient_id",
        populate: { path: "user_id" }
      })
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

    const doctor = await Doctor.findOne().populate("user_id");
    const patient = await Patient.findById(appointment.patient_id).populate("user_id");

    // Email → Patient (appointment confirmed)
    if (patient?.user_id?.email) {
      await sendEmail({
        to: patient.user_id.email,
        subject: "Appointment Confirmed",
        html: appointmentConfirmedTemplate({
          doctorName: doctor?.user_id?.name || "Clinexa Doctor",
          date: appointment.start_time.toLocaleString()
        })
      });
    }

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

    const patient = await Patient.findById(appointment.patient_id).populate("user_id");

    // Email → Patient (appointment cancelled)
    if (patient?.user_id?.email) {
      await sendEmail({
        to: patient.user_id.email,
        subject: "Appointment Cancelled",
        html: appointmentCancelledTemplate({
          date: appointment.start_time.toLocaleString()
        })
      });
    }

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
