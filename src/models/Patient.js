import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    age: { type: Number, default: null },
    gender: { type: String, enum: ["male", "female"], default: null },
    phone: { type: String, default: "" },
    address: { type: String, default: "" }
  },
  { timestamps: true }
);


// Cascade delete: When a patient is deleted, delete their appointments
patientSchema.pre("findOneAndDelete", async function (next) {
  try {
    const filter = this.getFilter();
    const patientId = filter._id;
    if (patientId) {
      await mongoose.model("Appointment").deleteMany({ patient_id: patientId });
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Patient", patientSchema);

