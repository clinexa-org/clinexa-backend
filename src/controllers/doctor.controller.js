import Doctor from "../models/Doctor.js";
import Clinic from "../models/Clinic.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import cloudinary from "../config/cloudinary.js";
import { success, error } from "../utils/response.js";

/**
 * Create Doctor Profile
 */
export const upsertDoctor = async (req, res) => {
  try {
    const { specialty, bio, years_of_experience } = req.body;

    let doctor = await Doctor.findOne({ user_id: req.user.id });

    if (doctor) {
      // Update existing doctor
      doctor.specialty = specialty;
      doctor.bio = bio;
      doctor.years_of_experience = years_of_experience;

      await doctor.save();
      return success(res, { doctor }, "Doctor profile updated successfully");
    }

    // Create new doctor
    doctor = await Doctor.create({
      user_id: req.user.id,
      specialty,
      bio,
      years_of_experience
    });

    return success(res, { doctor }, "Doctor profile created", 201);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get My Doctor Profile
 */
export const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user_id: req.user.id })
      .populate("clinic_id")
      .populate("user_id", "name email avatar role");

    return success(res, { doctor });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Update Doctor Profile
 */
export const updateDoctor = async (req, res) => {
  try {
    const { specialty, bio, years_of_experience, name } = req.body;

    // 1. Update Doctor Profile
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found (please re-register if issue persists)", 404);

    if (specialty !== undefined) doctor.specialty = specialty;
    if (bio !== undefined) doctor.bio = bio;
    if (years_of_experience !== undefined) doctor.years_of_experience = years_of_experience;

    await doctor.save();

    // 2. Update User Profile (Name, Avatar)
    const user = await User.findById(req.user.id);
    if (name) user.name = name;

    if (req.file) {
      // Destroy old avatar if exists (optional but good practice)
      if (user.avatar_public_id) {
        await cloudinary.uploader.destroy(user.avatar_public_id);
      }
      user.avatar = req.file.path;
      user.avatar_public_id = req.file.filename;
    }
    await user.save();

    // 3. Return combined data
    await doctor.populate("user_id", "name email avatar");

    return success(res, { doctor }, "Doctor profile updated successfully");


  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get Doctor Stats (Dashboard)
 */
export const getDoctorStats = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return error(res, "Doctor profile not found", 404);

    const { month } = req.query;
    const query = { 
      doctor_id: doctor._id,
      status: { $ne: "cancelled" }
    };

    if (month) {
      // Validate YYYY-MM format
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return error(res, "Invalid month format. Use YYYY-MM", 400);
      }

      const [year, m] = month.split("-").map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 1);

      query.start_time = { $gte: startDate, $lt: endDate };
    }

    const appointmentsCount = await Appointment.countDocuments(query);
    
    // Count unique patients for this doctor (optionally within the month)
    // If month is provided, the query already includes the date range
    const patients = await Appointment.distinct("patient_id", query);
    
    // Basic stats for now
    return success(res, {
      appointments: appointmentsCount,
      patients: patients.length,
      rating: 4.9, // Placeholder
      reviews: 24  // Placeholder
    });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get All Doctors
 */
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("user_id");

    return success(res, { doctors });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get Doctor By ID
 */
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("user_id")
      .populate("clinic_id");

    if (!doctor) return error(res, "Doctor not found", 404);

    return success(res, { doctor });
  } catch (err) {
    return error(res, err.message);
  }
};
