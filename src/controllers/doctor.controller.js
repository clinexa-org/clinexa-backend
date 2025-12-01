import Doctor from "../models/Doctor.js";
import Clinic from "../models/Clinic.js";
import User from "../models/User.js";
import { success, error } from "../utils/response.js";

/**
 * Create Doctor Profile
 */
export const createDoctor = async (req, res) => {
  try {
    const { specialty, bio, years_of_experience } = req.body;

    const doctor = await Doctor.create({
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
    const doctor = await Doctor.findOne({ user_id: req.user.id }).populate("clinic_id");

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
    const { specialty, bio, years_of_experience } = req.body;

    const doctor = await Doctor.findOneAndUpdate(
      { user_id: req.user.id },
      { specialty, bio, years_of_experience },
      { new: true }
    );

    return success(res, { doctor }, "Doctor updated successfully");
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
