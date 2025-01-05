import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  loginTime: Date,
  logoutTime: Date,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
