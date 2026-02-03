import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Clinic from "../models/Clinic.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import { success, error } from "../utils/response.js";

import { sendEmail } from "../services/email.service.js";
import {
  appointmentConfirmedTemplate,
  appointmentCancelledTemplate,
  patientCancelledAppointmentTemplate
} from "../services/email.templates.js";




import { toClinicTime, getDayOfWeekInTimezone, getTimeStringInTimezone, formatTime12Hour, createDateFromClinicTime } from "../utils/date.utils.js";
import { notifyUser } from "../services/notification.service.js";


/**
 * Helper: Generate available slots for a date (Timezone Aware)
 */
const generateSlotsForDate = (clinic, dateStr) => {
  const slots = [];
  const timezone = clinic.timezone || "Africa/Cairo";
  
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
    return generateSlotsFromHours(dateStr, exception.from, exception.to, clinic.slotDurationMinutes, timezone);
  }

  // Check weekly schedule
  const dayConfig = clinic.weekly?.find(d => d.day === dayOfWeek);
  if (!dayConfig || !dayConfig.enabled) {
    return []; // Not a working day
  }

  return generateSlotsFromHours(dateStr, dayConfig.from, dayConfig.to, clinic.slotDurationMinutes, timezone);
};

const generateSlotsFromHours = (dateStr, fromTime, toTime, slotDuration, timezone) => {
  const slots = [];
  const [fromHour, fromMin] = fromTime.split(":").map(Number);
  const [toHour, toMin] = toTime.split(":").map(Number);

  // We loop in minutes
  let startMins = fromHour * 60 + fromMin;
  let endMins = toHour * 60 + toMin;

  // Handle overnight: if end < start, it means next day (add 24h to end)
  if (endMins < startMins) {
      endMins += 24 * 60;
  }

  const step = slotDuration;

  for (let mins = startMins; mins < endMins; mins += step) {
      // Normalize mins relative to start of day (00:00)
      // If > 24*60, it's next day
      
      const currentMins = mins; 
      // We want to construct a "Clinic wall clock time" string
      // But we might cross midnight
      
      let dayOffset = 0;
      let timeMins = currentMins;
      
      if (timeMins >= 24 * 60) {
          dayOffset = 1; // next day
          timeMins -= 24 * 60;
      }
      
      const h = Math.floor(timeMins / 60);
      const m = timeMins % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      // Calculate DATE string based on dayOffset
      let targetDateStr = dateStr;
      if (dayOffset > 0) {
          const d = new Date(dateStr);
          d.setDate(d.getDate() + 1);
          targetDateStr = d.toISOString().split('T')[0];
      }
      
      // Convert "Wall Clock" (targetDateStr + timeStr) -> UTC Date
      const utcDate = createDateFromClinicTime(targetDateStr, timeStr, timezone);
      slots.push(utcDate.toISOString());
  }

  return slots;
};


/**
 * Helper: Check if a slot is within working hours (Timezone Aware)
 */
const isSlotWithinWorkingHours = (clinic, slotTime) => {
  const timezone = clinic.timezone || "Africa/Cairo";
  
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
  
  // Create a map for full day names for better UX
  const fullDayMap = {
      "sat": "Saturday", "sun": "Sunday", "mon": "Monday", "tue": "Tuesday",
      "wed": "Wednesday", "thu": "Thursday", "fri": "Friday"
  };
  const fullDayName = fullDayMap[dayOfWeek] || dayOfWeek;

  if (!dayConfig || !dayConfig.enabled) {
    return { valid: false, reason: `Clinic is closed on ${fullDayName}` };
  }



  const isOvernight = dayConfig.from > dayConfig.to;
  let isSlotValid = false;

  if (isOvernight) {
      // Valid if it's after start OR before end (next day - early morning)
      isSlotValid = (slotTimeStr >= dayConfig.from || slotTimeStr < dayConfig.to);
  } else {
      // Standard day: Valid if it's after start AND before end
      isSlotValid = (slotTimeStr >= dayConfig.from && slotTimeStr < dayConfig.to);
  }

  if (!isSlotValid) {
    return { 
        valid: false, 
        reason: `working hours on ${fullDayName} from ${formatTime12Hour(dayConfig.from)} to ${formatTime12Hour(dayConfig.to)} only` 
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

    // Map all slots to objects with status
    const formattedSlots = allSlots.map(slot => {
        const isBooked = bookedTimes.has(slot);
        return {
            time: slot, // ISO String (UTC)
            status: isBooked ? "booked" : "available"
        };
    });

    return success(res, {
      date,
      timezone: clinic.timezone,
      slotDurationMinutes: clinic.slotDurationMinutes,
      slots: formattedSlots
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
      const timezone = clinic?.timezone || "Africa/Cairo";
      appointmentStartTime = createDateFromClinicTime(date, time, timezone);
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

      // Format time for notifications and emails
      const emailTime = appointment.start_time.toLocaleString('en-US', { 
          timeZone: clinic?.timezone || "Africa/Cairo",
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true 
      });

      // Email → Doctor (appointment created)
      if (doctor?.user_id?.email) {
        await sendEmail({
          to: doctor.user_id.email,
          subject: "New Appointment Booked",
          html: appointmentCreatedTemplate({
            patientName: patient?.user_id?.name || "Patient",
            date: emailTime
          })
        });
      }

      // Notify doctor via push + socket
      if (doctor?.user_id?._id) {
        await notifyUser({
          recipientUserId: doctor.user_id._id,
          type: "APPOINTMENT_CREATED",
          title: "New Appointment Booked",
          body: `${patient?.user_id?.name || "A patient"} booked an appointment for ${emailTime}`,
          data: { appointmentId: appointment._id },
          socketEvent: "appointment:created",
          socketPayload: {
            appointmentId: appointment._id,
            status: appointment.status,
            start_time: appointment.start_time,
            patientName: patient?.user_id?.name || "Patient"
          }
        });
      }


      // Populate for immediate use in Flutter UI
      await appointment.populate({
        path: "doctor_id",
        populate: { path: "user_id", select: "name" }
      });
      await appointment.populate("clinic_id");

      const responseApp = appointment.toObject();
      responseApp.formatted_start_time = appointment.start_time.toLocaleString('en-US', { 
            timeZone: clinic?.timezone || "Africa/Cairo",
            hour: 'numeric',
            minute: 'numeric',
            hour12: true 
      });

      return success(res, { appointment: responseApp }, "Appointment created", 201);

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

    // SEARCH FILTER
    if (req.query.search) {
      const searchStr = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(searchStr, "i");

      // 1. Find matched Users (by name)
      const users = await User.find({ name: searchRegex }).select("_id");
      const userIds = users.map(u => u._id);

      // 2. Find matched Patients (by phone OR user_id)
      const patients = await Patient.find({
        $or: [
          { phone: searchRegex },
          { user_id: { $in: userIds } }
        ]
      }).select("_id");
      const patientIds = patients.map(p => p._id);

      // 3. Update query with OR condition
      query.$or = [
        { reason: searchRegex },
        { patient_id: { $in: patientIds } }
      ];
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

    // Notify patient via push + socket
    // Notify patient via push + socket
    if (patient?.user_id?._id) {
      console.log(`[Appointment] Notifying patient ${patient.user_id._id} about confirmation`);
      await notifyUser({
        recipientUserId: patient.user_id._id,
        type: "APPOINTMENT_CONFIRMED",
        title: "Appointment Confirmed",
        body: `Your appointment with Dr. ${doctor?.user_id?.name || "Doctor"} has been confirmed`,
        data: { appointmentId: appointment._id },
        socketEvent: "appointment:updated",
        socketPayload: {
          appointmentId: appointment._id,
          status: "confirmed",
          start_time: appointment.start_time,
          doctorName: doctor?.user_id?.name
        }
      });
    } else {
        console.warn(`[Appointment] Cannot notify patient - user_id not found on patient record`);
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
      
      // Removed restriction: Patients CAN now cancel confirmed appointments
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

    // Fetch details for notifications
    const patient = await Patient.findById(appointment.patient_id).populate("user_id");
    const doctor = await Doctor.findById(appointment.doctor_id).populate("user_id");
    const clinic = await Clinic.findById(appointment.clinic_id);

    const emailTime = appointment.start_time.toLocaleString('en-US', { 
        timeZone: clinic?.timezone || "Africa/Cairo",
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true 
    });

    // --- NOTIFICATION LOGIC (Bidirectional) ---
    
    if (req.user.role === "patient") {
        // CASE A: Patient Cancelled -> Notify Doctor
        if (doctor?.user_id?.email) {
            await sendEmail({
                to: doctor.user_id.email,
                subject: "Appointment Cancelled by Patient",
                html: patientCancelledAppointmentTemplate({
                    patientName: patient?.user_id?.name || "Patient",
                    date: emailTime,
                    reason: reason
                })
            });
        }

        if (doctor?.user_id?._id) {
            console.log(`[Appointment] Notifying doctor ${doctor.user_id._id} about cancellation by patient`);
            await notifyUser({
                recipientUserId: doctor.user_id._id,
                type: "APPOINTMENT_CANCELLED",
                title: "Appointment Cancelled",
                body: `Patient ${patient?.user_id?.name || "A patient"} has cancelled their appointment for ${emailTime}`,
                data: { appointmentId: appointment._id },
                socketEvent: "appointment:updated",
                socketPayload: {
                    appointmentId: appointment._id,
                    status: "cancelled",
                    start_time: appointment.start_time,
                    cancellationReason: appointment.cancellationReason
                }
            });
        }

    } else {
        // CASE B: Doctor/Admin Cancelled -> Notify Patient
        if (patient?.user_id?.email) {
            await sendEmail({
                to: patient.user_id.email,
                subject: "Appointment Cancelled",
                html: appointmentCancelledTemplate({
                    date: emailTime
                })
            });
        }

        if (patient?.user_id?._id) {
            console.log(`[Appointment] Notifying patient ${patient.user_id._id} about cancellation`);
            await notifyUser({
                recipientUserId: patient.user_id._id,
                type: "APPOINTMENT_CANCELLED",
                title: "Appointment Cancelled",
                body: `Your appointment with Dr. ${doctor?.user_id?.name || "Doctor"} has been cancelled`,
                data: { appointmentId: appointment._id },
                socketEvent: "appointment:updated",
                socketPayload: {
                    appointmentId: appointment._id,
                    status: "cancelled",
                    start_time: appointment.start_time,
                    cancellationReason: appointment.cancellationReason
                }
            });
        }
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

    // Fetch patient and doctor for notification
    const doctor = await Doctor.findById(appointment.doctor_id).populate("user_id");
    const patient = await Patient.findById(appointment.patient_id).populate("user_id");

    // Notify patient via push + socket
    // Notify patient via push + socket
    if (patient?.user_id?._id) {
      console.log(`[Appointment] Notifying patient ${patient.user_id._id} about completion`);
      await notifyUser({
        recipientUserId: patient.user_id._id,
        type: "APPOINTMENT_COMPLETED",
        title: "Appointment Completed",
        body: `Your appointment with Dr. ${doctor?.user_id?.name || "Doctor"} has been completed`,
        data: { appointmentId: appointment._id },
        socketEvent: "appointment:updated",
        socketPayload: {
          appointmentId: appointment._id,
          status: "completed",
          start_time: appointment.start_time
        }
      });
    } else {
        console.warn(`[Appointment] Cannot notify patient - user_id not found on patient record`);
    }


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

    const appointment = await Appointment.findById(id);
    if (!appointment) return error(res, "Appointment not found", 404);

    // Fetch doctor and clinic to determine timezone
    const doctor = await Doctor.findById(appointment.doctor_id);
    let clinic = null;
    if (doctor) {
        if (doctor.clinic_id) {
             clinic = await Clinic.findById(doctor.clinic_id);
        } else {
             clinic = await Clinic.findOne({ doctor_id: doctor._id });
        }
    }

    let appointmentStartTime;
    if (start_time) {
      appointmentStartTime = new Date(start_time);
    } else if (date && time) {
       const timezone = clinic?.timezone || "Africa/Cairo";
       appointmentStartTime = createDateFromClinicTime(date, time, timezone);
    } else {
        // If no new time provided? The endpoint implies rescheduling, so new time is required.
         return error(res, "Valid start_time or both date and time are required", 400);
    }

    if (!appointmentStartTime || isNaN(appointmentStartTime.getTime())) {
      return error(res, "Valid start_time or both date and time are required", 400);
    }


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

    // Notify patient about rescheduling
    if (formattedUser._id) {
        console.log(`[Appointment] Notifying patient ${formattedUser._id} about rescheduling`);
        await notifyUser({
          recipientUserId: formattedUser._id,
          type: "APPOINTMENT_RESCHEDULED",
          title: "Appointment Rescheduled",
          body: `Your appointment with Dr. ${doctor?.user_id?.name || "Doctor"} has been rescheduled to ${new Date(appointment.start_time).toLocaleString()}`,
          data: { appointmentId: appointment._id },
          socketEvent: "appointment:updated",
          socketPayload: {
            appointmentId: appointment._id,
            status: "pending",
            start_time: appointment.start_time,
            doctorName: doctor?.user_id?.name
          }
        });
    }

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
