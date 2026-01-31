import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "APPOINTMENT_CREATED",
        "APPOINTMENT_CONFIRMED",
        "APPOINTMENT_CANCELLED",
        "APPOINTMENT_COMPLETED",
        "PRESCRIPTION_CREATED",
        "REMINDER"
      ],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    data: {
      appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
      prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" }
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });
notificationSchema.index({ recipientUserId: 1, readAt: 1 });

export default mongoose.model("Notification", notificationSchema);
