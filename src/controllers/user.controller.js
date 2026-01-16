import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import { success, error } from "../utils/response.js";

/**
 * Upload Avatar
 * POST /api/users/avatar
 */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, "No image file provided", 400);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return error(res, "User not found", 404);
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatar_public_id) {
      await cloudinary.uploader.destroy(user.avatar_public_id);
    }

    // Update user with new avatar
    user.avatar = req.file.path;
    user.avatar_public_id = req.file.filename;
    await user.save();

    return success(
      res,
      {
        avatar: user.avatar,
      },
      "Avatar uploaded successfully"
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Remove Avatar
 * DELETE /api/users/avatar
 */
export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return error(res, "User not found", 404);
    }

    if (!user.avatar_public_id) {
      return error(res, "No avatar to remove", 400);
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(user.avatar_public_id);

    // Clear avatar fields
    user.avatar = null;
    user.avatar_public_id = null;
    await user.save();

    return success(res, null, "Avatar removed successfully");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Update Profile
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return error(res, "User not found", 404);
    }

    if (name) user.name = name;
    await user.save();

    return success(
      res,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
      "Profile updated successfully"
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get Profile
 * GET /api/users/profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) {
      return error(res, "User not found", 404);
    }

    return success(res, { user });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
