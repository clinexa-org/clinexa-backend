import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
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
    clinic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic"
    },
    start_time: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending"
    },
    reason: {
      type: String,
      default: ""
    },
    notes: {
      type: String,
      default: ""
    },
    source: {
      type: String,
      enum: ["patient_app", "admin_panel", "doctor_panel"],
      default: "patient_app"
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Partial unique index: Prevents double-booking for non-cancelled appointments
// Only one appointment per (doctor_id, start_time) where status is NOT 'cancelled'
appointmentSchema.index(
  { doctor_id: 1, start_time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed", "completed"] }
    }
  }
);

export default mongoose.model("Appointment", appointmentSchema);
