import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "doctor", "patient"], default: "patient" },
    is_active: { type: Boolean, default: true },
    avatar: { type: String, default: "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=200" },
    avatar_public_id: { type: String, default: null },
    passwordResetOtp: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null }
  },
  { timestamps: true }
);


// Cascade delete: When a user is deleted, delete linked Patient/Doctor profiles
userSchema.pre("findOneAndDelete", async function (next) {
  try {
    const filter = this.getFilter();
    const userId = filter._id;

    if (userId) {
      // 1. Delete Patient profile(s) - iterate to trigger Patient middleware
      const patients = await mongoose.model("Patient").find({ user_id: userId });
      for (const p of patients) {
        await mongoose.model("Patient").findOneAndDelete({ _id: p._id });
      }
      
      // 2. Delete Doctor profile - trigger Doctor middleware
      const doctor = await mongoose.model("Doctor").findOne({ user_id: userId });
      if (doctor) {
        await mongoose.model("Doctor").findOneAndDelete({ _id: doctor._id });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("User", userSchema);

