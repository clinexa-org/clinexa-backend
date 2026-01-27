import mongoose from "mongoose";

// Sub-schema for weekly working hours
const weeklyHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["sat", "sun", "mon", "tue", "wed", "thu", "fri"],
      required: true
    },
    enabled: { type: Boolean, default: false },
    from: { type: String, default: "09:00" }, // HH:mm format
    to: { type: String, default: "17:00" }    // HH:mm format
  },
  { _id: false }
);

// Sub-schema for schedule exceptions (closed days or custom hours)
const scheduleExceptionSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    type: {
      type: String,
      enum: ["closed", "custom"],
      required: true
    },
    from: { type: String }, // Only for type: "custom"
    to: { type: String }    // Only for type: "custom"
  },
  { _id: false }
);

const clinicSchema = new mongoose.Schema(
  {
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: false },
    phone: { type: String, required: true },
    location_link: { type: String, default: "" },

    // Schedule fields
    timezone: { type: String, default: "Africa/Cairo" },
    slotDurationMinutes: { type: Number, default: 30 },
    gapMinutes: { type: Number, default: 0 }, // Gap between slots
    weekly: {

      type: [weeklyHoursSchema],
      default: [
        { day: "sat", enabled: true, from: "09:00", to: "17:00" },
        { day: "sun", enabled: true, from: "09:00", to: "17:00" },
        { day: "mon", enabled: true, from: "09:00", to: "17:00" },
        { day: "tue", enabled: true, from: "09:00", to: "17:00" },
        { day: "wed", enabled: true, from: "09:00", to: "17:00" },
        { day: "thu", enabled: true, from: "09:00", to: "17:00" },
        { day: "fri", enabled: false, from: "09:00", to: "17:00" }
      ]
    },
    exceptions: {
      type: [scheduleExceptionSchema],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("Clinic", clinicSchema);
