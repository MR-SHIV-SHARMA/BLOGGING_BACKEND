import jwt from "jsonwebtoken";
import { User } from "../Models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Profile } from "../Models/profile.models.js";
import { sendEmail } from "../helpers/mailer.js";

// Generate Access and Refresh Tokens
const generateAccessTokensAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Error generating access and refresh tokens");
  }
};

// User Registration
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new apiError(422, "Please fill in all the required fields");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(
      422,
      "Username or email already in use, please try a different one"
    );
  }

  const user = await User.create({
    email,
    username,
    password,
  });

  // Generate verification token
  const verificationToken = user.generateVerificationToken();
  user.verifyToken = verificationToken; // Set the verification token
  user.verifyTokenExpiry = Date.now() + 3600000; // 1 hour validity
  await user.save({ validateBeforeSave: false });

  console.log("Generated verification token:", verificationToken);

  await sendEmail({
    email,
    emailType: "VERIFY",
    userId: user._id,
    token: verificationToken,
  });

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        user,
        "User created successfully. Please check your email to verify your account.",
        true
      )
    );
});

// User Login
const loginUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;

  if (!(username || email)) {
    throw new apiError(422, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(401, "Invalid credentials");
  }

  // Check if account is deactivated
  if (user.isDeactivated) {
    // Check if restoration period has expired
    if (user.restorationDeadline && user.restorationDeadline < new Date()) {
      throw new apiError(
        410, // Gone status code
        "This account has been permanently deleted due to inactivity for more than 30 days"
      );
    }
    throw new apiError(
      403,
      "This account has been deactivated. Please restore it first to continue"
    );
  }

  // Check if the user is verified
  if (!user.isVerified) {
    throw new apiError(403, "Please verify your email before logging in.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Password is incorrect. Please try again");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokensAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          success: true,
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// User Logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
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
    const user = await User.findById(decodedToken?._id);

    if (!user || incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Invalid or expired refresh token");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokensAndRefreshTokens(user._id);

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
    throw new apiError(401, error?.message || "Invalid refresh token");
  }
});

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

// Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: "fullname",
      select: "fullname",
      model: "Profile",
    })
    .populate({
      path: "avatar",
      select: "avatar",
      model: "Profile",
    })
    .populate({
      path: "coverImage",
      select: "coverImage",
      model: "Profile",
    });

  // Fetch the profile data
  const profile = await Profile.findOne({ user: req.user._id });

  // Extract the URLs from the populated fields
  const userData = {
    ...user.toObject(),
    avatar: profile?.avatar || null,
    coverImage: profile?.coverImage || null,
    fullname: profile?.fullname || null,
  };

  return res
    .status(200)
    .json(new apiResponse(200, userData, "Current user fetched successfully"));
});

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

// Get User Follow Profile
const getUserFollowProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  // Validate username input
  if (!username?.trim()) {
    throw new apiError(403, "Invalid username");
  }

  // Aggregate user data with followers and following counts
  const followProfile = await User.aggregate([
    { $match: { username: username.toLowerCase() } },
    {
      $lookup: {
        from: "follows",
        localField: "_id",
        foreignField: "followingId",
        as: "followers",
      },
    },
    {
      $lookup: {
        from: "follows",
        localField: "_id",
        foreignField: "followerId",
        as: "following",
      },
    },
    {
      $addFields: {
        followersCount: { $size: "$followers" },
        followingCount: { $size: "$following" },
        // Check if the current user follows this user
        isFollow: {
          $in: [req.user?._id, "$followers.followerId"],
        },
        // Check if this user follows the current user
        isFollowedByCurrentUser: {
          $in: [req.user?._id, "$following.followingId"],
        },
      },
    },
    {
      $project: {
        username: 1,
        followersCount: 1,
        followingCount: 1,
        isFollow: 1,
        isFollowedByCurrentUser: 1,
        email: 1,
      },
    },
  ]);

  // Check if the user exists
  if (!followProfile?.length) {
    throw new apiError(400, "User does not exist");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        followProfile[0],
        "User follow profile fetched successfully"
      )
    );
});

// Email Verification
const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      throw new apiError(400, "Token is required");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);
    } catch (error) {
      throw new apiError(400, "Invalid token");
    }

    // Find the user by ID
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new apiError(404, "User not found");
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res
        .status(200)
        .json(
          new apiResponse(200, { success: true }, "Email already verified")
        );
    }

    // Check token match and expiry
    if (user.verifyToken !== token) {
      throw new apiError(400, "Invalid token");
    }

    if (!user.verifyTokenExpiry || user.verifyTokenExpiry < Date.now()) {
      throw new apiError(400, "Token has expired");
    }

    // Verify the user
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();

    return res
      .status(200)
      .json(
        new apiResponse(200, { success: true }, "Email verified successfully")
      );
  } catch (error) {
    if (error instanceof apiError) {
      throw error;
    }
    throw new apiError(500, "Error in verification");
  }
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
  // For GET request - verify token
  if (req.method === "GET") {
    const { token } = req.query;

    if (!token) {
      throw new apiError(400, "Reset token is required");
    }

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
  const token = req.query.token || req.body.token; // Get token from query or body

  if (!token || !newPassword) {
    throw new apiError(400, "Token and new password are required");
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
  await sendEmail({
    email: userEmail,
    emailType: "ACCOUNT_DELETED",
    userId: user._id,
    message: "Your account has been deactivated",
  });

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
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getUserFollowProfile,
  verifyEmail,
  resetPassword,
  forgotPassword,
  resetPasswordWithToken,
  deleteUserAccount,
  restoreAccount,
  requestAccountRestoration,
};
