import { Admin } from "../models/admin.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Post } from "../../Models/post.models.js";
import { Comment } from "../../Models/comment.models.js";
import { User } from "../../Models/user.models.js";
import { Category } from "../../Models/category.models.js";
import { ActivityLog } from "../models/activityLog.models.js";
import { sendEmail } from "../utils/email.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

const registerSuperAdmin = asyncHandler(async (req, res) => {
  console.log("Registering super admin:", req.body);
  const { email, password, role } = req.body;
  if ([email, password, role].some((field) => field?.trim() === "")) {
    throw new apiError(422, "Please fill in all the required fields");
  }

  // Check if super admin already exists
  const existedSuperAdmin = await Admin.findOne({ email, role: "super-admin" });

  if (existedSuperAdmin) {
    throw new apiError(422, "Super admin already exists with this email");
  }

  // Create new super admin
  const newSuperAdmin = await Admin.create({
    email,
    password,
    role: "super-admin",
  });

  const createdSuperAdmin = await Admin.findById(newSuperAdmin._id).select(
    "-password -refreshToken"
  );

  if (!createdSuperAdmin) {
    throw new apiError(500, "Failed to register super admin. Please try again later");
  }

  console.log("Super admin registered successfully:", createdSuperAdmin);
  return res
    .status(201)
    .json(
      new apiResponse(201, createdSuperAdmin, "Super admin registered successfully", true)
    );
});

const register = asyncHandler(async (req, res) => {
  console.log("Registering admin:", req.body);
  const { email, password, role } = req.body;
  if ([email, password, role].some((field) => field?.trim() === "")) {
    throw new apiError(422, "Please fill in all the required fields");
  }

  // Check if the requester is a super admin
  const requester = await Admin.findById(req.admin._id);
  if (requester.role !== "super-admin") {
    throw new apiError(403, "Only super admins can create new admins");
  }

  // Check if user already exists
  const existedAdmin = await Admin.findOne({ email });

  if (existedAdmin) {
    throw new apiError(422, "Email already in use, please try a different one");
  }

  // Create new admin
  const newAdmin = await Admin.create({ email, password, role });

  const createdAdmin = await Admin.findById(newAdmin._id).select(
    "-password -refreshToken"
  );

  if (!createdAdmin) {
    throw new apiError(500, "Failed to register admin. Please try again later");
  }

  console.log("Admin registered successfully:", createdAdmin);
  return res
    .status(201)
    .json(
      new apiResponse(201, createdAdmin, "Admin registered successfully", true)
    );
});

// User Login
const login = asyncHandler(async (req, res) => {
  console.log("Admin login attempt:", req.body);
  const { password, email } = req.body;

  if (!email) {
    throw new apiError(422, "Email are required");
  }

  const admin = await Admin.findOne({
    email,
  });

  if (!admin) {
    throw new apiError(401, "Invalid credentials. Please try again");
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Password is incorrect. Please try again");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokensAndRefreshTokens(admin._id);

  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  console.log("Admin logged in successfully:", loggedInAdmin);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          success: true,
          admin: loggedInAdmin,
          accessToken,
          refreshToken,
        },
        "Admin logged in successfully"
      )
    );
});

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

  console.log("Admin logged out successfully:", req.admin._id);
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "Admin logged out successfully"));
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

const deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ email, password: hashedPassword, role });
    await newAdmin.save();
    sendEmail(
      email,
      "Admin Account Created",
      "Your admin account has been created."
    );
    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    await ActivityLog.create({ adminId: admin._id, action: "Password reset" });
    sendEmail(
      email,
      "Password Reset",
      "Your password has been reset successfully."
    );
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const superAdminResetAdminPassword = async (req, res) => {
  try {
    const { adminId, newPassword } = req.body;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Reset password for admin ${admin.email}`,
    });
    sendEmail(
      admin.email,
      "Password Reset by Super Admin",
      "Your password has been reset by the super admin."
    );
    res.status(200).json({ message: "Admin password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const superAdminCreateAdmin = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ email, password: hashedPassword, role });
    await newAdmin.save();
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Created new admin ${email}`,
    });
    sendEmail(
      email,
      "Admin Account Created by Super Admin",
      "A super admin has created your admin account."
    );
    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const superAdminDeleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted admin ${admin.email}`,
    });
    sendEmail(
      admin.email,
      "Admin Account Deleted",
      "Your admin account has been deleted by the super admin."
    );
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const enable2FA = async (req, res) => {
  const secret = speakeasy.generateSecret({ length: 20 });
  const url = speakeasy.otpauthURL({
    secret: secret.base32,
    label: req.admin.email,
    algorithm: "sha512",
  });

  await qrcode.toDataURL(url, (err, data_url) => {
    res.json({ secret: secret.base32, qrCode: data_url });
  });
};

const verify2FA = (req, res) => {
  const { token, secret } = req.body;
  const verified = speakeasy.totp.verify({ secret, encoding: "base32", token });

  if (verified) {
    res.json({ message: "2FA verified successfully" });
  } else {
    res.status(400).json({ message: "Invalid 2FA token" });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate("adminId", "email");
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createSuperAdmin = async (req, res) => {
  try {
    const { email, password, username, role } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user with the role of super-admin
    const newUser = new User({
      email,
      username, // Add the username field
      password: hashedPassword,
      role: role || "super-admin",
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "Super admin created successfully" });
  } catch (error) {
    console.error("Error creating super admin:", error); // Add this line to log the error
    res.status(500).json({ message: "Something went wrong" });
  }
};

export {
  register,
  registerSuperAdmin,
  login,
  logout,
  deletePost,
  deleteComment,
  deleteUser,
  addCategory,
  createAdmin,
  resetPassword,
  superAdminCreateAdmin,
  superAdminDeleteAdmin,
  superAdminResetAdminPassword,
  getActivityLogs,
  getAllAdmins,
  enable2FA,
  verify2FA,
  createSuperAdmin,
  refreshAccessToken,
};
