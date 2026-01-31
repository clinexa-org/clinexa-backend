import mongoose from "mongoose";

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      enum: ["android", "ios", "web"],
      default: "android"
    }
  },
  { timestamps: true }
);

// Compound unique index: one token per user
deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

export default mongoose.model("DeviceToken", deviceTokenSchema);
