import Patient from "../models/Patient.js";
import { success, error } from "../utils/response.js";

/**
 * Create or Update Patient Profile
 */
export const upsertPatient = async (req, res) => {
  try {
    const { age, gender, phone, address } = req.body;

    let patient = await Patient.findOne({ user_id: req.user.id });

    if (patient) {
      patient.age = age ?? patient.age;
      patient.gender = gender ?? patient.gender;
      patient.phone = phone ?? patient.phone;
      patient.address = address ?? patient.address;
      await patient.save();

      return success(res, { patient }, "Patient profile updated");
    }

    patient = await Patient.create({
      user_id: req.user.id,
      age,
      gender,
      phone,
      address
    });

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
