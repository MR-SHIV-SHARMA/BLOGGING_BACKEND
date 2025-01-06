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