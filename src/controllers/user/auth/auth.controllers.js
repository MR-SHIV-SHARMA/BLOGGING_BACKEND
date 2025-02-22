import jwt from "jsonwebtoken";
import { User } from "../../../Models/user.models.js";
import { apiError } from "../../../utils/apiError.js";
import { apiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Profile } from "../../../Models/profile.models.js";
import { sendEmail } from "../../../helpers/mailer.js";
import { cookieOptions } from "../../../utils/cookieOptions.js";

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
    throw new apiError(422, "All fields are required");
  }

  // Check if user or profile already exists
  const [existedUser, existedProfile] = await Promise.all([
    User.findOne({ $or: [{ username }, { email }] }),
    Profile.findOne({ username }),
  ]);

  if (existedUser || existedProfile) {
    throw new apiError(422, "Username or email already in use");
  }

  const user = await User.create({ email, username, password });

  const userProfile = await Profile.create({
    user: user._id,
    username: user.username,
    fullname: "",
    location: "",
    hobbies: [],
    bio: "",
    link: "",
    socialMedia: [],
    avatar: "",
    coverImage: "",
  });

  user.profile = userProfile._id;
  await user.save({ validateBeforeSave: false });

  // Generate verification token
  const verificationToken = user.generateVerificationToken();
  user.verifyToken = verificationToken;
  user.verifyTokenExpiry = Date.now() + 3600000;
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

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        { user: userData, profile: userProfile },
        "User registered successfully. Check email for verification.",
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

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user)
    throw new apiError(401, "No account found with this email or username");

  if (user.isDeactivated) {
    if (user.restorationDeadline && user.restorationDeadline < new Date()) {
      throw new apiError(410, "Account permanently deleted due to inactivity");
    }
    throw new apiError(403, "Account deactivated. Restore to continue");
  }

  // Check if the user is verified
  if (!user.isVerified) {
    throw new apiError(403, "Please verify your email before logging in.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new apiError(401, "Incorrect password");

  const { accessToken, refreshToken } =
    await generateAccessTokensAndRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new apiResponse(
        200,
        { success: true, user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    return res
      .status(401)
      .json(new apiResponse(401, {}, "Unauthorized request"));
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);

    if (!user || incomingRefreshToken !== user.refreshToken) {
      throw new apiError(401, "Invalid or expired refresh token");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokensAndRefreshTokens(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token & Refresh Token Renewed"
        )
      );
  } catch (error) {
    return res
      .status(401)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(new apiResponse(401, {}, "Session expired. Please log in again."));
  }
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params; // ✅ Fix: Get token from path params
  if (!token) throw new apiError(400, "Token is required");

  try {
    const decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) throw new apiError(404, "User not found");

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Email already verified",
        data: {},
      });
    }

    if (
      user.verifyToken !== token ||
      !user.verifyTokenExpiry ||
      user.verifyTokenExpiry < Date.now()
    ) {
      throw new apiError(400, "Invalid or expired token");
    }

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Email verified successfully",
      data: {},
    });
  } catch (error) {
    throw new apiError(500, "Error in verification");
  }
});

export { loginUser, registerUser, logoutUser, refreshAccessToken, verifyEmail };
