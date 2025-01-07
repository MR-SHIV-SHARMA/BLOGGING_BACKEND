import jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.models.js";

const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new apiError(401, "Access token is missing"));
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.admin = await Admin.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!req.admin) {
      return next(new apiError(401, "Invalid token"));
    }

    next();
  } catch (error) {
    return next(new apiError(401, "Invalid token"));
  }
});

export default authenticateAdmin;


// Logout an admin
const logout = asyncHandler(async (req, res) => {
  console.log("Admin logout attempt:", req.admin._id);

  // Ensure that the admin exists
  if (!req.admin || !req.admin._id) {
    console.error("Logout Error: Admin not found in request.");
    return res.status(400).json(new apiResponse(400, null, "Admin not found."));
  }

  await Admin.findByIdAndUpdate(
    req.admin._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  const role = req.admin.role === "super-admin" ? "Super Admin" : "Admin";
  console.log(`${role} logged out successfully:`, req.admin._id);

  // Create ActivityLog for logout
  try {
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `${role} logged out`,
    });
    console.log("Activity logged for admin logout.");
  } catch (error) {
    console.error("Error logging activity during logout:", error);
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new apiResponse(
        200,
        {
          admin: {
            id: req.admin._id,
            email: req.admin.email,
            role: req.admin.role,
          },
        },
        `${role} logged out successfully`
      )
    );
});


// Super Admin deletes an admin by ID
const superAdminDeleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Attempting to delete admin with ID:", id);

    // Check if the admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      console.log("Admin not found for ID:", id);
      return res.status(404).json({ message: "Admin not found!" });
    }

    // Delete the admin using findByIdAndDelete
    await Admin.findByIdAndDelete(id);
    console.log("Admin deleted successfully:", admin.email);

    // Log the activity
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted admin ${admin.email}`,
    });
    console.log("Activity logged for deleting admin.");

    // Send email notification if the admin email is defined
    if (admin.email) {
      await sendEmail(
        admin.email,
        "Admin Account Deleted",
        "Your admin account has been deleted by the super admin."
      );
      console.log("Email notification sent to:", admin.email);
    } else {
      console.error("Error: Admin email is not defined.");
    }

    res.status(200).json({
      message: "Admin deleted successfully!",
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};