import Patient from "../models/Patient.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import { success, error } from "../utils/response.js";

/**
 * Create or Update Patient Profile (with optional avatar)
 */
export const upsertPatient = async (req, res) => {
  try {
    const { age, gender, phone, address } = req.body;

    // Handle avatar - save to User model
    if (req.file) {
      const user = await User.findById(req.user.id);
      if (user) {
        // Delete old avatar if exists
        if (user.avatar_public_id) {
          await cloudinary.uploader.destroy(user.avatar_public_id);
        }
        user.avatar = req.file.path;
        user.avatar_public_id = req.file.filename;
        await user.save();
      }
    }

    let patient = await Patient.findOne({ user_id: req.user.id });

    if (patient) {
      patient.age = age ?? patient.age;
      patient.gender = gender ?? patient.gender;
      patient.phone = phone ?? patient.phone;
      patient.address = address ?? patient.address;
      await patient.save();

      // Populate user for response
      await patient.populate("user_id", "name email avatar");
      return success(res, { patient }, "Patient profile updated");
    }

    patient = await Patient.create({
      user_id: req.user.id,
      age,
      gender,
      phone,
      address
    });

    // Populate user for response
    await patient.populate("user_id", "name email avatar");
    return success(res, { patient }, "Patient profile created", 201);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get My Patient Profile (with user avatar)
 */
export const getMyPatient = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user_id: req.user.id }).populate("user_id", "name email avatar");

    return success(res, { patient });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Admin: Get all patients
 */
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate("user_id", "name email avatar");

    return success(res, { patients });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Doctor: Get Patient by ID
 */
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("user_id", "name email avatar");

    if (!patient) return error(res, "Patient not found", 404);

    return success(res, { patient });
  } catch (err) {
    return error(res, err.message);
  }
};
