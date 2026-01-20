import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import { success, error } from "../utils/response.js";
import { sendEmail } from "../services/email.service.js";
import { passwordResetOtpTemplate } from "../services/email.templates.js";

/**
 * REGISTER
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return error(res, "Email already exists", 409);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "patient", // Force role to be patient
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`,
    });

    // Validations for role-based profile creation
    if (user.role === "patient") {
      await Patient.create({
        user_id: user._id,
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return success(
      res,
      {
        user,
        token
      },
      "User registered successfully",
      201
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};


/**
 * LOGIN
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return error(res, "User does not exist", 404);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return error(res, "Invalid password", 400);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return success(
      res,
      {
        user,
        token
      },
      "Logged in successfully"
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};


/**
 * ME
 */
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    return success(res, { user });
  } catch (err) {
    return error(res, "Invalid token", 401);
  }
};


/**
 * FORGOT PASSWORD - Send OTP to email
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, "Email is required", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return error(res, "User with this email does not exist", 404);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    const expiresInMinutes = 10;
    const expires = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Save OTP and expiry to user
    user.passwordResetOtp = otp;
    user.passwordResetExpires = expires;
    await user.save();

    // Send email with OTP
    await sendEmail({
      to: email,
      subject: "Password Reset OTP - Clinexa",
      html: passwordResetOtpTemplate({ otp, expiresInMinutes })
    });

    return success(
      res,
      { expiresIn: expiresInMinutes * 60 },
      "Password reset OTP sent to your email"
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};


/**
 * RESET PASSWORD - Verify OTP and set new password
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return error(res, "Email, OTP, and new password are required", 400);
    }

    if (newPassword.length < 6) {
      return error(res, "Password must be at least 6 characters", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return error(res, "User with this email does not exist", 404);
    }

    // Check if OTP exists
    if (!user.passwordResetOtp) {
      return error(res, "No password reset was requested", 400);
    }

    // Check if OTP expired
    if (user.passwordResetExpires < new Date()) {
      // Clear expired OTP
      user.passwordResetOtp = null;
      user.passwordResetExpires = null;
      await user.save();
      return error(res, "OTP has expired. Please request a new one", 400);
    }

    // Verify OTP
    if (user.passwordResetOtp !== otp) {
      return error(res, "Invalid OTP", 400);
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtp = null;
    user.passwordResetExpires = null;
    await user.save();

    // Generate new token so user is logged in after reset
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return success(
      res,
      { user, token },
      "Password reset successfully"
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
