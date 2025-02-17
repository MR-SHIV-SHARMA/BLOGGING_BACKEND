import jwt from "jsonwebtoken";
import { User } from "../../../Models/user.models.js";
import { apiError } from "../../../utils/apiError.js";
import { apiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendEmail } from "../../../helpers/mailer.js";

// Update Account Details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  if (!(username && email)) {
    throw new apiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { username, email } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Account details updated successfully"));
});

// Delete User Account
const deleteUserAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const userEmail = user.email;

  // Mark account as deactivated
  user.isDeactivated = true;
  user.deactivatedAt = new Date();
  user.restorationDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await user.save();

  // Send deletion confirmation email
  // await sendEmail({
  //   email: userEmail,
  //   emailType: "ACCOUNT_DELETED",
  //   userId: user._id,
  //   message: "Your account has been deactivated",
  // });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new apiResponse(
        200,
        {},
        "Account successfully deactivated. You can restore it within 30 days."
      )
    );
});

// Add restore account function
const restoreAccount = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new apiError(400, "Restoration token is required");
  }

  try {
    const decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      isDeactivated: true,
      restorationDeadline: { $gt: new Date() },
    });

    if (!user) {
      throw new apiError(
        400,
        "Invalid restoration link or account restoration period has expired"
      );
    }

    // Restore account
    user.isDeactivated = false;
    user.deactivatedAt = undefined;
    user.restorationDeadline = undefined;
    await user.save();

    // Send confirmation email
    await sendEmail({
      email: user.email,
      emailType: "RESTORE",
      message: "Your account has been successfully restored.",
    });

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          {},
          "Account restored successfully. You can now login."
        )
      );
  } catch (error) {
    throw new apiError(400, "Invalid or expired restoration token");
  }
});

// Add requestAccountRestoration function
const requestAccountRestoration = asyncHandler(async (req, res) => {
  const { email, username } = req.body;

  if (!email && !username) {
    throw new apiError(400, "Email or username is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
    isDeactivated: true,
    restorationDeadline: { $gt: new Date() },
  });

  if (!user) {
    throw new apiError(
      404,
      "No deactivated account found or restoration period has expired"
    );
  }

  const restorationToken = user.generateVerificationToken();

  // Send restoration link email
  await sendEmail({
    email: user.email,
    emailType: "RESTORATION_REQUEST",
    userId: user._id,
    token: restorationToken,
    restorationDeadline: user.restorationDeadline,
  });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        {},
        "Account restoration instructions have been sent to your email"
      )
    );
});

export {
  updateAccountDetails,
  deleteUserAccount,
  restoreAccount,
  requestAccountRestoration,
};
