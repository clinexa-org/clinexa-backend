import Clinic from "../models/Clinic.js";
import Doctor from "../models/Doctor.js";
import { success, error } from "../utils/response.js";

/**
 * Create or Update Clinic
 */
export const upsertClinic = async (req, res) => {
  try {
    const { name, address, city, phone, location_link } = req.body;

    // Doctor must exist
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    // If clinic exists → update it
    let clinic = await Clinic.findOne({ doctor_id: doctor._id });

    if (clinic) {
      clinic.name = name;
      clinic.address = address;
      clinic.city = city;
      clinic.phone = phone;
      clinic.location_link = location_link;

      await clinic.save();
    } else {
      // Create clinic
      clinic = await Clinic.create({
        doctor_id: doctor._id,
        name,
        address,
        city,
        phone,
        location_link
      });

      // Link clinic to doctor
      doctor.clinic_id = clinic._id;
      await doctor.save();
    }

    return success(res, { clinic }, "Clinic saved successfully");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get My Clinic
 */
export const getMyClinic = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    const clinic = await Clinic.findOne({ doctor_id: doctor._id });

    return success(res, { clinic });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get Clinic by Doctor ID
 */
export const getClinicByDoctor = async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ doctor_id: req.params.doctorId });

    if (!clinic) return error(res, "Clinic not found", 404);

    return success(res, { clinic });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get My Working Hours
 */
export const getMyWorkingHours = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    const clinic = await Clinic.findOne({ doctor_id: doctor._id });
    if (!clinic) return error(res, "Clinic not found. Please create your clinic first.", 404);

    return success(res, {
      timezone: clinic.timezone,
      slotDurationMinutes: clinic.slotDurationMinutes,
      weekly: clinic.weekly,
      exceptions: clinic.exceptions
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Update My Working Hours
 */
export const updateMyWorkingHours = async (req, res) => {
  try {
    const { timezone, slotDurationMinutes, weekly, exceptions } = req.body;

    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    const clinic = await Clinic.findOne({ doctor_id: doctor._id });
    if (!clinic) return error(res, "Clinic not found. Please create your clinic first.", 404);

    // Validate slotDurationMinutes
    if (slotDurationMinutes !== undefined) {
      if (slotDurationMinutes < 10 || slotDurationMinutes > 120) {
        return error(res, "slotDurationMinutes must be between 10 and 120", 400);
      }
      clinic.slotDurationMinutes = slotDurationMinutes;
    }

    if (timezone !== undefined) {
      clinic.timezone = timezone;
    }

    if (weekly !== undefined) {
      // Validate weekly structure
      if (!Array.isArray(weekly)) {
        return error(res, "weekly must be an array", 400);
      }
      clinic.weekly = weekly;
    }

    if (exceptions !== undefined) {
      if (!Array.isArray(exceptions)) {
        return error(res, "exceptions must be an array", 400);
      }
      clinic.exceptions = exceptions;
    }

    await clinic.save();

    return success(res, {
      timezone: clinic.timezone,
      slotDurationMinutes: clinic.slotDurationMinutes,
      weekly: clinic.weekly,
      exceptions: clinic.exceptions
    }, "Working hours updated successfully");
  } catch (err) {
    return error(res, err.message, 500);
  }
};
