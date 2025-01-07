import { Admin } from "../models/admin.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ActivityLog } from "../models/activityLog.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "crypto";
import { sendEmail } from "../helpers/mailer.js";

// Generate Access and Refresh Tokens
const generateAccessTokensAndRefreshTokens = async (adminId) => {
  try {
    console.log(`Generating tokens for admin ID: ${adminId}`);
    const admin = await Admin.findById(adminId);
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    console.log(`Tokens generated for admin ID: ${adminId}`);
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating access and refresh tokens:", error);
    throw new apiError(500, "Error generating access and refresh tokens");
  }
};

// User Login
const login = asyncHandler(async (req, res) => {
  console.log("Admin login attempt:", req.body);
  const { password, email } = req.body;

  if (!email) {
    throw new apiError(422, "Email is required");
  }

  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new apiError(401, "Invalid credentials. Please try again");
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Password is incorrect. Please try again");
  }

  const isDefaultSuperAdmin = admin.isDefaultSuperAdmin; // This will be true or false based on the DB

  const { accessToken, refreshToken } =
    await generateAccessTokensAndRefreshTokens(admin._id);

  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );

  // Ensure that req.admin has isDefaultSuperAdmin
  req.admin = { ...loggedInAdmin._doc, isDefaultSuperAdmin }; // This ensures that isDefaultSuperAdmin is included

  const options = {
    httpOnly: true,
    secure: true,
  };

  const role = admin.role === "super-admin" ? "Super Admin" : "Admin";
  console.log(`${role} logged in successfully:`, loggedInAdmin);

  const loginLog = await ActivityLog.create({
    adminId: admin._id,
    action: `${role} logged in`,
  });

  req.session.loginLogId = loginLog._id; // Store the login log ID in the session
  console.log("Login Log ID:", req.session.loginLogId); // Debugging: Log the loginLogId

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          success: true,
          admin: req.admin, // Use the updated req.admin object
          accessToken,
          refreshToken,
        },
        `${role} logged in successfully`
      )
    );
});

// Logout an admin
const logout = asyncHandler(async (req, res) => {
  console.log("Admin logout attempt:", req.admin._id);
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

  const loginLog = await ActivityLog.findById(req.session.loginLogId);

  await ActivityLog.create({
    adminId: req.admin._id,
    action: `${role} logged out`,
  });

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

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  console.log("Refreshing access token:", req.body);
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const admin = await Admin.findById(decodedToken?._id);

    if (!admin || incomingRefreshToken !== admin?.refreshToken) {
      throw new apiError(401, "Invalid or expired refresh token");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokensAndRefreshTokens(admin._id);

    console.log("Access token refreshed successfully:", admin._id);

    await ActivityLog.create({
      adminId: admin._id,
      action: "Refreshed access token",
    });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new apiError(401, error?.message || "Invalid refresh token");
  }
});

// Forget Password
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new apiError(404, "Admin not found");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour

  admin.resetPasswordToken = resetToken;
  admin.resetPasswordExpiry = resetTokenExpiry;
  await admin.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get("host")}/api/admin/reset-password/${resetToken}`;
  const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: admin.email,
      subject: "Password Reset Token",
      message,
    });

    await ActivityLog.create({
      adminId: admin._id,
      action: "Requested password reset",
    });

    res.status(200).json({ message: "Email sent" });
  } catch (error) {
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpiry = undefined;
    await admin.save({ validateBeforeSave: false });

    throw new apiError(500, "Email could not be sent");
  }
});

// Reset Password with Token
const resetPasswordWithToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const admin = await Admin.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!admin) {
    throw new apiError(400, "Invalid or expired token");
  }

  admin.password = await bcrypt.hash(newPassword, 10);
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpiry = undefined;
  await admin.save();

  await ActivityLog.create({
    adminId: admin._id,
    action: "Reset password with token",
  });

  res.status(200).json({ message: "Password reset successfully" });
});

// Reset Password for Logged-in Admin
const resetPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin._id);

  if (!admin) {
    throw new apiError(404, "Admin not found");
  }

  const isPasswordValid = await admin.isPasswordCorrect(currentPassword);

  if (!isPasswordValid) {
    throw new apiError(401, "Current password is incorrect");
  }

  admin.password = await bcrypt.hash(newPassword, 10);
  await admin.save();

  await ActivityLog.create({
    adminId: admin._id,
    action: "Reset password",
  });

  res.status(200).json({ message: "Password reset successfully" });
});

export {
  login,
  logout,
  refreshAccessToken,
  resetPassword,
  requestPasswordReset,
  resetPasswordWithToken,
};
