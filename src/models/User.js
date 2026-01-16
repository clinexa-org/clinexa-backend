import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "doctor", "patient"], default: "patient" },
    is_active: { type: Boolean, default: true },
    avatar: { type: String, default: "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=200" },
    avatar_public_id: { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
