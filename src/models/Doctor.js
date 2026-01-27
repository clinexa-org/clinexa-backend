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


// Cascade delete: When a doctor is deleted, delete their clinic and appointments
doctorSchema.pre("findOneAndDelete", async function (next) {
  try {
    const filter = this.getFilter();
    const doctorId = filter._id;

    if (doctorId) {
      // 1. Delete associated Clinic
      await mongoose.model("Clinic").deleteMany({ doctor_id: doctorId });

      // 2. Delete/Cancel linked Appointments
      // We delete them to prevent orphaned records.
      await mongoose.model("Appointment").deleteMany({ doctor_id: doctorId });
      
      // 3. Delete associated Prescriptions
       await mongoose.model("Prescription").deleteMany({ doctor_id: doctorId });
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Doctor", doctorSchema);

