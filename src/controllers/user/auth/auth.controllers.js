import jwt from "jsonwebtoken";
import { User } from "../../../Models/user.models.js";
import { apiError } from "../../../utils/apiError.js";
import { apiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Profile } from "../../../Models/profile.models.js";
import { sendEmail } from "../../../helpers/mailer.js";

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

  // First check if user or profile already exists
  const [existedUser, existedProfile] = await Promise.all([
    User.findOne({
      $or: [{ username }, { email }],
    }),
    Profile.findOne({ username }),
  ]);

  if (existedUser || existedProfile) {
    throw new apiError(
      422,
      "Username or email already in use, please try a different one"
    );
  }

  // Create user
  const user = await User.create({
    email,
    username,
    password,
  });

  // Create default profile for the user
  const userProfile = await Profile.create({
    user: user._id,
    username: user.username,
    fullname: "",
    location: "",
    hobbies: [],
    bio: "",
    link: "",
    socialMedia: new Map(),
    avatar: "",
    coverImage: "",
  });

  // Set profile ID in user document
  user.profile = userProfile._id;
  await user.save({ validateBeforeSave: false });

  // Generate verification token
  const verificationToken = user.generateVerificationToken();
  user.verifyToken = verificationToken;
  user.verifyTokenExpiry = Date.now() + 3600000; // 1 hour validity
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email,
    emailType: "VERIFY",
    userId: user._id,
    token: verificationToken,
  });

  // Return both user and profile data
  const userData = await User.findById(user._id)
    .select("-password -refreshToken")
    .populate("profile");

  return res.status(201).json(
    new apiResponse(
      201,
      {
        user: userData,
        profile: userProfile,
      },
      "User registered successfully. Please check your email to verify your account.",
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

export { loginUser, registerUser, logoutUser, refreshAccessToken, verifyEmail };
