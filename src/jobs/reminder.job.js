import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { notifyUser } from "../services/notification.service.js";

/**
 * Reminder Job: Send notifications 10 minutes before appointments
 * Runs every minute to check for upcoming appointments
 */
export const startReminderJob = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
      const elevenMinutesFromNow = new Date(now.getTime() + 11 * 60 * 1000);

      // Find appointments starting in ~10 minutes that haven't been reminded
      const appointments = await Appointment.find({
        start_time: { $gte: tenMinutesFromNow, $lt: elevenMinutesFromNow },
        status: { $in: ["pending", "confirmed"] },
        reminderSentAt: null
      })
        .populate({
          path: "patient_id",
          populate: { path: "user_id", select: "name" }
        })
        .populate({
          path: "doctor_id",
          populate: { path: "user_id", select: "name" }
        });

      for (const appointment of appointments) {
        const patientUser = appointment.patient_id?.user_id;
        const doctorUser = appointment.doctor_id?.user_id;
        
        const timeStr = appointment.start_time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        });

        // Notify patient
        if (patientUser) {
          await notifyUser({
            recipientUserId: patientUser._id,
            type: "REMINDER",
            title: "Appointment Reminder",
            body: `Your appointment with Dr. ${doctorUser?.name || "Doctor"} is in 10 minutes at ${timeStr}`,
            data: { appointmentId: appointment._id },
            socketEvent: "appointment:reminder"
          });
        }

        // Notify doctor
        if (doctorUser) {
          await notifyUser({
            recipientUserId: doctorUser._id,
            type: "REMINDER",
            title: "Appointment Reminder",
            body: `Appointment with ${patientUser?.name || "Patient"} in 10 minutes at ${timeStr}`,
            data: { appointmentId: appointment._id },
            socketEvent: "appointment:reminder"
          });
        }

        // Mark as reminded
        appointment.reminderSentAt = new Date();
        await appointment.save();
        
        console.log(`[Reminder] Sent for appointment ${appointment._id}`);
      }
    } catch (err) {
      console.error("[Reminder] Job error:", err.message);
    }
  });

  console.log("[Reminder] Job scheduled - runs every minute");
};

export default { startReminderJob };
