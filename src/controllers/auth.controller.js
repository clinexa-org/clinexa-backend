import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { success, error } from "../utils/response.js";

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
      role: role || "patient",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`,
    });

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
