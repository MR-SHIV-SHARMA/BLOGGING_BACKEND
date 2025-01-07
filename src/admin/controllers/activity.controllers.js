import { ActivityLog } from "../models/activityLog.models.js";

// Get activity logs
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate("adminId", "email");
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { getActivityLogs };
