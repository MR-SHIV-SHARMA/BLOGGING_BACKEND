import jwt from "jsonwebtoken";
import { User } from "../../../Models/user.models.js";
import { apiError } from "../../../utils/apiError.js";
import { apiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendEmail } from "../../../helpers/mailer.js";

// Change Current Password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

// Password Reset
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password reset successfully"));
});

// Forgot Password - Request
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  // Generate reset token
  const resetToken = user.generateVerificationToken();

  // Save reset token and expiry
  user.forgotPasswordToken = resetToken;
  user.forgotPasswordExpiry = Date.now() + 3600000; // 1 hour validity
  await user.save({ validateBeforeSave: false });

  // Send reset email
  await sendEmail({
    email,
    emailType: "RESET",
    userId: user._id,
    token: resetToken,
  });

  return res
    .status(200)
    .json(
      new apiResponse(200, {}, "Password reset instructions sent to your email")
    );
});

// Reset Password with token
const resetPasswordWithToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new apiError(400, "Reset token is required");
  }

  if (req.method === "GET") {
    try {
      const decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);
      const user = await User.findOne({
        _id: decoded._id,
        forgotPasswordToken: token,
        forgotPasswordExpiry: { $gt: Date.now() },
      });

      if (!user) {
        throw new apiError(400, "Invalid or expired reset token");
      }

      return res
        .status(200)
        .json(new apiResponse(200, { valid: true }, "Token is valid"));
    } catch (error) {
      throw new apiError(400, "Invalid or expired token");
    }
  }

  // For POST request - reset password
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new apiError(400, "New password is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);
  } catch (error) {
    throw new apiError(400, "Invalid or expired token");
  }

  const user = await User.findOne({
    _id: decoded._id,
    forgotPasswordToken: token,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new apiError(400, "Invalid or expired reset token");
  }

  // Update password
  user.password = newPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password reset successful"));
});

export {
  changeCurrentPassword,
  resetPassword,
  forgotPassword,
  resetPasswordWithToken,
};
