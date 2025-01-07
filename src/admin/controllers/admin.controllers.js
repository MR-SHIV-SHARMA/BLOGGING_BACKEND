import { Admin } from "../models/admin.models.js";

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { getAllAdmins };
