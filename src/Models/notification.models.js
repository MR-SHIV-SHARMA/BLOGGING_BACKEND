import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["comment", "like", "follow", "other"],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false, 
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
