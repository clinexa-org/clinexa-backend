import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    specialty: { type: String, required: true },
    bio: { type: String, default: "" },
    years_of_experience: { type: Number, default: 0 },
    clinic_id: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" }
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
