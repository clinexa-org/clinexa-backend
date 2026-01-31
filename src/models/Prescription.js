import mongoose from "mongoose";

const prescriptionItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, default: "" },       // 1x daily
    duration: { type: String, default: "" },     // 5 days
    instructions: { type: String, default: "" }  // after food, before sleep...
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },
    diagnosis: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      default: ""
    },
    items: {
      type: [prescriptionItemSchema],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", prescriptionSchema);
