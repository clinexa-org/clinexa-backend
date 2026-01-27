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



import { toClinicTime, getDayOfWeekInTimezone, getTimeStringInTimezone } from "../utils/date.utils.js";

/**
 * Helper: Generate available slots for a date (Timezone Aware)
 */
const generateSlotsForDate = (clinic, dateStr) => {
  const slots = [];
  const timezone = clinic.timezone || "UTC";
  
  // Try to determine the day of week relative to the date string
  const targetDate = new Date(dateStr); 
  const dayMap = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
  const dayOfWeek = dayMap[targetDate.getDay()];

  // Check for exceptions first
  const exception = clinic.exceptions?.find(e => e.date === dateStr);
  
  if (exception) {
    if (exception.type === "closed") {
      return []; // Day off
    }
    return generateSlotsFromHours(dateStr, exception.from, exception.to, clinic.slotDurationMinutes);
  }

  // Check weekly schedule
  const dayConfig = clinic.weekly?.find(d => d.day === dayOfWeek);
  if (!dayConfig || !dayConfig.enabled) {
    return []; // Not a working day
  }

  return generateSlotsFromHours(dateStr, dayConfig.from, dayConfig.to, clinic.slotDurationMinutes);
};

const generateSlotsFromHours = (dateStr, fromTime, toTime, slotDuration) => {
  const slots = [];
  const [fromHour, fromMin] = fromTime.split(":").map(Number);
  const [toHour, toMin] = toTime.split(":").map(Number);

  // We simply generate ISO strings assuming UTC for the slot generation
  // The validation in isSlotWithinWorkingHours will handle timezone correctness
  let current = new Date(`${dateStr}T${fromTime}:00`);
  const end = new Date(`${dateStr}T${toTime}:00`);

  while (current < end) {
    slots.push(current.toISOString());
    current = new Date(current.getTime() + slotDuration * 60 * 1000);
  }

  return slots;
};


/**
 * Helper: Check if a slot is within working hours (Timezone Aware)
 */
const isSlotWithinWorkingHours = (clinic, slotTime) => {
  const timezone = clinic.timezone || "UTC";
  
  // Get date string relative to clinic timezone
  // This ensures we check exceptions for the correct DATE in that timezone
  const clinicDate = toClinicTime(slotTime, timezone);
  const year = clinicDate.getFullYear();
  const month = String(clinicDate.getMonth() + 1).padStart(2, '0');
  const day = String(clinicDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const dayOfWeek = getDayOfWeekInTimezone(slotTime, timezone);
  const slotTimeStr = getTimeStringInTimezone(slotTime, timezone);

  // Check exceptions first
  const exception = clinic.exceptions?.find(e => e.date === dateStr);
  if (exception) {
    if (exception.type === "closed") {
      return { valid: false, reason: "Clinic is closed on this date" };
    }
    // Custom hours
    if (slotTimeStr < exception.from || slotTimeStr >= exception.to) {
      return { valid: false, reason: "Slot is outside custom working hours for this date" };
    }
    return { valid: true };
  }


  // Check weekly schedule
  const dayConfig = clinic.weekly?.find(d => d.day === dayOfWeek);
  if (!dayConfig || !dayConfig.enabled) {
    return { valid: false, reason: `Clinic is closed on ${dayOfWeek}` };
  }

  if (slotTimeStr < dayConfig.from || slotTimeStr >= dayConfig.to) {
    return { 
        valid: false, 
        reason: `Slot (${slotTimeStr}) is outside working hours (${dayConfig.from} - ${dayConfig.to})` 
    };
  }

  return { valid: true };
};


/**
 * Patient: Get available slots for a date
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return error(res, "date query param is required in YYYY-MM-DD format", 400);
    }

    // Single doctor V1
    const doctor = await Doctor.findOne();
    if (!doctor) return error(res, "No doctor available", 404);

    const clinic = await Clinic.findOne({ doctor_id: doctor._id });
    if (!clinic) return error(res, "Clinic not configured", 404);

    // Generate all possible slots for this date
    const allSlots = generateSlotsForDate(clinic, date);

    // Get booked slots (non-cancelled)
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    const bookedAppointments = await Appointment.find({
      doctor_id: doctor._id,
      start_time: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed", "completed"] }
    }).select("start_time");

    const bookedTimes = new Set(bookedAppointments.map(a => a.start_time.toISOString()));

    // Filter available slots
    const availableSlots = allSlots.filter(slot => !bookedTimes.has(slot));

    return success(res, {
      date,
      timezone: clinic.timezone,
      slotDurationMinutes: clinic.slotDurationMinutes,
      slots: availableSlots
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Patient creates appointment
 * Single-doctor system → backend picks doctor automatically
 * Now includes conflict checking and working hours validation
 */
export const createAppointment = async (req, res) => {
  try {
    const { start_time, date, time, reason, notes } = req.body;

    let appointmentStartTime;

    if (start_time) {
      appointmentStartTime = new Date(start_time);
    } else if (date && time) {
      // Combine date (YYYY-MM-DD) and time (HH:mm)
      appointmentStartTime = new Date(`${date}T${time}:00`);
    }


    // find patient profile
    const patient = await Patient.findOne({ user_id: req.user.id }).populate("user_id");
    if (!patient) return error(res, "Patient profile not found", 404);

    // single doctor in system (V1) + populate user to get doctor email
    const doctor = await Doctor.findOne().populate("user_id");
    if (!doctor) return error(res, "Doctor profile not found", 404);

    // clinic for that doctor
    let clinic = null;
    if (doctor.clinic_id) {
      clinic = await Clinic.findById(doctor.clinic_id);
    } else {
      clinic = await Clinic.findOne({ doctor_id: doctor._id });
    }

    // Resolve date and time relative to clinic timezone
    if (start_time) {
      appointmentStartTime = new Date(start_time);
    } else if (date && time) {
      // If client sends date+time strings, we assume they mean CLINIC TIME
      // So we must construct the UTC date that corresponds to "date time" in "clinic.timezone"
      
      const timezone = clinic?.timezone || "UTC";
      // This is complex without a library like moment-timezone.
      // Easiest hack: 
      // 1. Create date as UTC: 2026-02-01T11:00:00Z
      // 2. Shift it by the offset?
      
      // Better: Assume input is ISO if no timezone info?
      // Actually standardizing on sending `start_time` (ISO) from frontend is better.
      // But if frontend sends date/time strings, standard JS Date constructor usually assumes UTC or Local.
      
      // Let's stick to the existing behavior: Date(`${date}T${time}:00`) -> Server Local/UTC
      // BUT we must validate it against clinic hours correctly (which we fixed in isSlotWithinWorkingHours)
       appointmentStartTime = new Date(`${date}T${time}:00`);
    }

    if (!appointmentStartTime || isNaN(appointmentStartTime.getTime())) {
      return error(res, "Valid start_time or both date and time are required", 400);
    }

    // SCHEDULING VALIDATION: Check if slot is within working hours
    if (clinic) {
      const workingHoursCheck = isSlotWithinWorkingHours(clinic, appointmentStartTime);
      if (!workingHoursCheck.valid) {
        return error(res, workingHoursCheck.reason, 409);
      }
    }

    // CONFLICT CHECK: The unique index will prevent duplicates at DB level
    // But we also check here for a better error message
    const existingAppointment = await Appointment.findOne({
      doctor_id: doctor._id,
      start_time: appointmentStartTime,
      status: { $in: ["pending", "confirmed", "completed"] }
    });

    if (existingAppointment) {
      return error(res, "This time slot is already booked", 409);
    }

    try {
      const appointment = await Appointment.create({
        doctor_id: doctor._id,
        patient_id: patient._id,
        clinic_id: clinic ? clinic._id : null,
        start_time: appointmentStartTime,
        reason,
        notes: notes || "",
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

      // Populate for immediate use in Flutter UI
      await appointment.populate({
        path: "doctor_id",
        populate: { path: "user_id", select: "name" }
      });
      await appointment.populate("clinic_id");

      return success(res, { appointment }, "Appointment created", 201);
    } catch (dbErr) {
      // Handle MongoDB duplicate key error (race condition safety)
      if (dbErr.code === 11000) {
        return error(res, "This time slot is already booked", 409);
      }
      throw dbErr;
    }
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
    if (!doctor) return success(res, { appointments: [] });

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
        populate: { path: "user_id", select: "name email avatar" }
      })
      .populate("clinic_id")
      .sort({ start_time: 1 })
      .lean();

    // Transform to ensure patient details are accessible directly
    const formattedAppointments = appointments.map(app => {
      const patient = app.patient_id || {};
      const user = patient.user_id || {};
      
      return {
        ...app,
        patient_id: {
          ...patient,
          name: user.name || "Unknown Patient",
          email: user.email || "",
          avatar: user.avatar || "https://ui-avatars.com/api/?name=Unknown&background=c7d2fe&color=3730a3&bold=true&size=200",
          user_id: patient.user_id || null 
        }
      };
    });

    return success(res, { appointments: formattedAppointments });
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

    if (appointment.status !== "pending") {
      return error(res, "Only pending appointments can be confirmed", 409);
    }

    // Role-based ownership check
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ user_id: req.user.id });
      if (!doctor || appointment.doctor_id.toString() !== doctor._id.toString()) {
        return error(res, "You cannot confirm this appointment", 403);
      }
    }


    appointment.status = "confirmed";
    await appointment.save();

    // Populate for email template & response
    const doctor = await Doctor.findById(appointment.doctor_id).populate("user_id");
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

    // Format response to match getDoctorAppointments structure
    const populatedAppointment = await Appointment.findById(appointment._id)
        .populate({
            path: "patient_id",
            populate: { path: "user_id", select: "name email avatar" }
        })
        .populate("clinic_id")
        .lean();

    const formattedPatient = populatedAppointment.patient_id || {};
    const formattedUser = formattedPatient.user_id || {};
    
    const responseAppointment = {
        ...populatedAppointment,
        patient_id: {
            ...formattedPatient,
            name: formattedUser.name || "Unknown Patient",
            email: formattedUser.email || "",
            avatar: formattedUser.avatar || "https://ui-avatars.com/api/?name=Unknown&background=c7d2fe&color=3730a3&bold=true&size=200",
            user_id: formattedPatient.user_id || null
        }
    };

    return success(res, { appointment: responseAppointment }, "Appointment confirmed");

  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Patient/Doctor/Admin – cancel appointment
 * patient can only cancel his own appointment
 * Cancelling FREES the slot for rebooking
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return error(res, "Appointment not found", 404);

    if (appointment.status === "cancelled") {
      return error(res, "Appointment is already cancelled", 409);
    }
    if (appointment.status === "completed") {
      return error(res, "Cannot cancel a completed appointment", 409);
    }

    // Role-based ownership check
    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ user_id: req.user.id });
      if (!patient || appointment.patient_id.toString() !== patient._id.toString()) {
        return error(res, "You cannot cancel this appointment", 403);
      }
    } else if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ user_id: req.user.id });
      if (!doctor || appointment.doctor_id.toString() !== doctor._id.toString()) {
        return error(res, "You cannot cancel this appointment", 403);
      }
    }

    appointment.status = "cancelled";
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = req.user.id;
    appointment.cancellationReason = reason || null;
    await appointment.save();

    const patient = await Patient.findById(appointment.patient_id).populate("user_id");

    if (patient?.user_id?.email) {
      await sendEmail({
        to: patient.user_id.email,
        subject: "Appointment Cancelled",
        html: appointmentCancelledTemplate({
          date: appointment.start_time.toLocaleString()
        })
      });
    }


    await appointment.populate("cancelledBy", "name email role");

    // Format response consistent with other endpoints
    const populatedAppointment = await Appointment.findById(appointment._id)
        .populate({
            path: "patient_id",
            populate: { path: "user_id", select: "name email avatar" }
        })
        .populate("clinic_id")
        .lean();

    const formattedPatient = populatedAppointment.patient_id || {};
    const formattedUser = formattedPatient.user_id || {};

    const responseAppointment = {
        ...populatedAppointment,
        patient_id: {
            ...formattedPatient,
            name: formattedUser.name || "Unknown Patient",
            email: formattedUser.email || "",
            avatar: formattedUser.avatar || "https://ui-avatars.com/api/?name=Unknown&background=c7d2fe&color=3730a3&bold=true&size=200",
            user_id: formattedPatient.user_id || null
        }
    };

    return success(res, { appointment: responseAppointment }, "Appointment cancelled");

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

    if (appointment.status !== "confirmed") {
      return error(res, "Only confirmed appointments can be completed", 409);
    }

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ user_id: req.user.id });
      if (!doctor || appointment.doctor_id.toString() !== doctor._id.toString()) {
        return error(res, "You cannot complete this appointment", 403);
      }
    }

    appointment.status = "completed";
    await appointment.save();


    // Format response consistent with other endpoints
    const populatedAppointment = await Appointment.findById(appointment._id)
        .populate({
            path: "patient_id",
            populate: { path: "user_id", select: "name email avatar" }
        })
        .populate("clinic_id")
        .lean();

    const formattedPatient = populatedAppointment.patient_id || {};
    const formattedUser = formattedPatient.user_id || {};

    const responseAppointment = {
        ...populatedAppointment,
        patient_id: {
            ...formattedPatient,
            name: formattedUser.name || "Unknown Patient",
            email: formattedUser.email || "",
            avatar: formattedUser.avatar || "https://ui-avatars.com/api/?name=Unknown&background=c7d2fe&color=3730a3&bold=true&size=200",
            user_id: formattedPatient.user_id || null
        }
    };

    return success(res, { appointment: responseAppointment }, "Appointment completed");

  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Patient/Doctor/Admin – reschedule appointment
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, date, time } = req.body;

    let appointmentStartTime;
    if (start_time) {
      appointmentStartTime = new Date(start_time);
    } else if (date && time) {
      appointmentStartTime = new Date(`${date}T${time}:00`);
    }

    if (!appointmentStartTime || isNaN(appointmentStartTime.getTime())) {
      return error(res, "Valid start_time or both date and time are required", 400);
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) return error(res, "Appointment not found", 404);

    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ user_id: req.user.id });
      if (!patient || appointment.patient_id.toString() !== patient._id.toString()) {
        return error(res, "You cannot reschedule this appointment", 403);
      }
    }

    // Check for conflicts at new time
    const existingAppointment = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor_id: appointment.doctor_id,
      start_time: appointmentStartTime,
      status: { $in: ["pending", "confirmed", "completed"] }
    });

    if (existingAppointment) {
      return error(res, "The new time slot is already booked", 409);
    }

    appointment.start_time = appointmentStartTime;
    appointment.status = "pending";
    await appointment.save();

    
    // Format response consistent with other endpoints
    const populatedAppointment = await Appointment.findById(appointment._id)
        .populate({
            path: "patient_id",
            populate: { path: "user_id", select: "name email avatar" }
        })
        .populate("clinic_id")
        .lean();

    const formattedPatient = populatedAppointment.patient_id || {};
    const formattedUser = formattedPatient.user_id || {};

    const responseAppointment = {
        ...populatedAppointment,
        patient_id: {
            ...formattedPatient,
            name: formattedUser.name || "Unknown Patient",
            email: formattedUser.email || "",
            avatar: formattedUser.avatar || "https://ui-avatars.com/api/?name=Unknown&background=c7d2fe&color=3730a3&bold=true&size=200",
            user_id: formattedPatient.user_id || null
        }
    };

    return success(res, { appointment: responseAppointment }, "Appointment rescheduled successfully");

  } catch (err) {
    if (err.code === 11000) {
      return error(res, "The new time slot is already booked", 409);
    }
    return error(res, err.message, 500);
  }
};
