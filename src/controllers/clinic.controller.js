import Clinic from "../models/Clinic.js";
import Doctor from "../models/Doctor.js";
import { success, error } from "../utils/response.js";

/**
 * Create or Update Clinic
 */
export const upsertClinic = async (req, res) => {
  try {
    const { name, address, city, phone, location_link, slot_duration } = req.body;

    // Doctor must exist
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    // If clinic exists → update it
    let clinic = await Clinic.findOne({ doctor_id: doctor._id });

    if (clinic) {
      if (name) clinic.name = name;
      if (address) clinic.address = address;
      if (city) clinic.city = city;
      if (phone) clinic.phone = phone;
      if (location_link !== undefined) clinic.location_link = location_link;
      
      // Handle working hours updates if provided in upsertClinic
      // This allows the general "Update Clinic" screen to also save working hours if sent
      const { timezone, weekly, working_hours, slotDurationMinutes, gapMinutes } = req.body;
      let { slot_duration } = req.body;
      
      if (timezone) clinic.timezone = timezone;
      if (gapMinutes !== undefined) clinic.gapMinutes = gapMinutes;
      
      let finalSlotDuration = slot_duration || slotDurationMinutes;
      if (finalSlotDuration) clinic.slotDurationMinutes = finalSlotDuration;

      // Logic to map working_hours to weekly if needed (reuse logic from updateMyWorkingHours)
      let finalWeekly = weekly;
      if (working_hours && Array.isArray(working_hours)) {
         const dayMap = {
          "saturday": "sat", "sunday": "sun", "monday": "mon", "tuesday": "tue",
          "wednesday": "wed", "thursday": "thu", "friday": "fri"
        };
        finalWeekly = working_hours.map(wh => ({
          day: dayMap[wh.day_of_week.toLowerCase()] || wh.day_of_week.substr(0, 3).toLowerCase(),
          enabled: wh.is_open,
          from: wh.start_time || "09:00",
          to: wh.end_time || "17:00"
        }));
      }

      if (finalWeekly && Array.isArray(finalWeekly)) {
          clinic.weekly = finalWeekly;
      }

      await clinic.save();
    } else {
      // Create clinic
      // ... logic for creation including working hours if provided ... 
      const { timezone, weekly, working_hours } = req.body;
      let initialWeekly = weekly;
      if (working_hours && Array.isArray(working_hours)) {
          // map it...
           const dayMap = {
            "saturday": "sat", "sunday": "sun", "monday": "mon", "tuesday": "tue",
            "wednesday": "wed", "thursday": "thu", "friday": "fri"
          };
          initialWeekly = working_hours.map(wh => ({
            day: dayMap[wh.day_of_week.toLowerCase()] || wh.day_of_week.substr(0, 3).toLowerCase(),
            enabled: wh.is_open,
            from: wh.start_time || "09:00",
            to: wh.end_time || "17:00"
          }));
      }

      clinic = await Clinic.create({
        doctor_id: doctor._id,
        name,
        address,
        city: city || "",
        phone,
        location_link,
        slotDurationMinutes: slot_duration || 30,
        gapMinutes: req.body.gapMinutes || 0,
        timezone: timezone || "Africa/Cairo",
        weekly: initialWeekly || undefined
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
    const { timezone, slotDurationMinutes, weekly, exceptions, working_hours, slot_duration } = req.body;

    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    const clinic = await Clinic.findOne({ doctor_id: doctor._id });
    if (!clinic) return error(res, "Clinic not found. Please create your clinic first.", 404);

    // Handle slot_duration alias
    let finalSlotDuration = slotDurationMinutes;
    if (slot_duration !== undefined) finalSlotDuration = slot_duration;

    // Validate slotDurationMinutes
    if (finalSlotDuration !== undefined) {
      if (finalSlotDuration < 10 || finalSlotDuration > 120) {
        return error(res, "slotDurationMinutes must be between 10 and 120", 400);
      }
      clinic.slotDurationMinutes = finalSlotDuration;
    }

    if (timezone !== undefined) {
      clinic.timezone = timezone;
    }

    // Handle working_hours mapping
    let finalWeekly = weekly;
    if (working_hours && Array.isArray(working_hours)) {
      const dayMap = {
        "saturday": "sat", "sunday": "sun", "monday": "mon", "tuesday": "tue",
        "wednesday": "wed", "thursday": "thu", "friday": "fri"
      };

      finalWeekly = working_hours.map(wh => ({
        day: dayMap[wh.day_of_week.toLowerCase()] || wh.day_of_week.substr(0, 3).toLowerCase(),
        enabled: wh.is_open,
        from: wh.start_time || "09:00",
        to: wh.end_time || "17:00"
      }));
    }

    // Safety: ensure finalWeekly structure is valid day codes if passed directly
    if (finalWeekly && Array.isArray(finalWeekly)) {
        const dayMapReverse = {
            "saturday": "sat", "sunday": "sun", "monday": "mon", "tuesday": "tue",
            "wednesday": "wed", "thursday": "thu", "friday": "fri"
        };
        finalWeekly = finalWeekly.map(day => {
            if (day.day.length > 3) {
                 const short = dayMapReverse[day.day.toLowerCase()] || day.day.substr(0,3).toLowerCase();
                 return { ...day, day: short };
            }
            return day;
        });
    }


    if (finalWeekly !== undefined) {
      // Validate weekly structure
      if (!Array.isArray(finalWeekly)) {
        return error(res, "weekly must be an array", 400);
      }
      clinic.weekly = finalWeekly;
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
