import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    age: { type: Number, default: null },
    gender: { type: String, enum: ["male", "female"], default: null },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    avatar: { type: String, default: null },
    avatar_public_id: { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);
