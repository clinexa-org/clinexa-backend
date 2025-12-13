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
