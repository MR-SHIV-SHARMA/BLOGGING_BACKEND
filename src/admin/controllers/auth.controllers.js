import { Admin } from "../models/admin.models.js";
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
    const admin = await Admin.findById(adminId);
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Error generating access and refresh tokens");
  }
};

// User Login
const login = asyncHandler(async (req, res) => {
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

  await ActivityLog.create({
    adminId: admin._id,
    action: `${role} logged in`,
  });

  // Send login email notification
  const message = `Dear ${admin.email},\n\nYou have successfully logged in. If this was not you, please contact support immediately.`;
  await sendEmail({
    email: admin.email,
    subject: "Login Notification",
    message,
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { success: true, admin: loggedInAdmin, accessToken, refreshToken },
        `${role} logged in successfully`
      )
    );
});

// Logout an admin
const logout = asyncHandler(async (req, res) => {
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

  await ActivityLog.create({
    adminId: req.admin._id,
    action: `${role} logged out`,
  });

  // Send logout email notification
  const message = `Dear ${req.admin.email},\n\nYou have successfully logged out. If this was not you, please contact support immediately.`;
  await sendEmail({
    email: req.admin.email,
    subject: "Logout Notification",
    message,
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
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const admin = await Admin.findById(decodedToken?._id);

    if (!admin) {
      throw new apiError(401, "Invalid refresh token");
    }

    // Check if the incoming refresh token matches the stored refresh token
    if (incomingRefreshToken !== admin?.refreshToken) {
      // Generate new tokens if the refresh token is expired or used
      const { accessToken, refreshToken } =
        await generateAccessTokensAndRefreshTokens(admin._id);
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new apiResponse(
            200,
            { accessToken, refreshToken },
            "Access Token Refreshed"
          )
        );
    }

    const { accessToken, refreshToken } =
      await generateAccessTokensAndRefreshTokens(admin._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
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

  admin.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  admin.resetPasswordExpiry = resetTokenExpiry;
  await admin.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get("host")}/auth/reset-password/${resetToken}`;
  const message = `Dear ${admin.name || admin.email},\n\nYou have requested a password reset. Please click the link below to reset your password:\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

  await sendEmail({
    email: admin.email,
    subject: "Password Reset Request",
    message,
  });

  await ActivityLog.create({
    adminId: admin._id,
    action: "Requested password reset",
  });

  res.status(200).json({ message: "Password reset email sent successfully" });
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
    throw new apiError(400, "Invalid or expired reset token");
  }

  admin.password = newPassword;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpiry = undefined;
  await admin.save();

  await ActivityLog.create({
    adminId: admin._id,
    action: "Reset password with token",
  });

  const message = `Dear ${admin.name || admin.email},\n\nYour password has been successfully reset. If this was not you, please contact support immediately.`;

  await sendEmail({
    email: admin.email,
    subject: "Password Reset Confirmation",
    message,
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

  admin.password = newPassword;
  await admin.save();

  await ActivityLog.create({
    adminId: admin._id,
    action: "Reset password",
  });

  // Send password reset confirmation email
  const message = `Dear ${admin.email},\n\nYour password has been successfully changed. If this was not you, please contact support immediately.`;
  await sendEmail({
    email: admin.email,
    subject: "Password Changed",
    message,
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
