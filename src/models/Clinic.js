import mongoose from "mongoose";

const clinicSchema = new mongoose.Schema(
  {
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    location_link: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Clinic", clinicSchema);
