import { Admin } from "../models/admin.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Post } from "../../Models/post.models.js";
import { Comment } from "../../Models/comment.models.js";
import { User } from "../../Models/user.models.js";
import { Category } from "../../Models/category.models.js";
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

// Function to Create Default Super Admin
const createDefaultSuperAdmin = asyncHandler(async (req, res) => {
  const defaultEmail = process.env.DEFAULT_SUPER_ADMIN_EMAIL;
  const defaultPassword = process.env.DEFAULT_SUPER_ADMIN_PASSWORD;

  // Check if default credentials are provided
  if (!defaultEmail || !defaultPassword) {
    console.error(
      "Default Super Admin credentials are not set in the .env file."
    );
    throw new apiError(500, "Default Super Admin credentials are missing.");
  }

  try {
    // Check if a default super admin already exists
    const existingSuperAdmin = await Admin.findOne({
      email: defaultEmail,
      role: "super-admin",
      isDefaultSuperAdmin: true,
    });

    if (existingSuperAdmin) {
      console.log(
        `Default Super Admin already exists with email: ${existingSuperAdmin.email}`
      );
      return res
        .status(200)
        .json(
          new apiResponse(
            200,
            { email: existingSuperAdmin.email },
            "Default Super Admin already exists.",
            true
          )
        );
    }

    // Create the default super admin
    const superAdmin = new Admin({
      email: defaultEmail,
      password: defaultPassword,
      role: "super-admin",
      isDefaultSuperAdmin: true, // Flag to identify default super admin
    });

    await superAdmin.save();

    console.log("Default Super Admin created successfully!");

    // Send notification email
    await sendEmail({
      email: defaultEmail,
      subject: "Your Default Super Admin Account",
      message: `Your Super Admin account has been created successfully. \n\nEmail: ${defaultEmail}\nPassword: ${defaultPassword}`,
    });

    console.log("Super Admin notified via email.");

    return res
      .status(201)
      .json(
        new apiResponse(
          201,
          { email: defaultEmail },
          "Default Super Admin created successfully.",
          true
        )
      );
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000 && error.keyPattern?.email) {
      console.error(
        `Default Super Admin already exists with email: ${error.keyValue.email}`
      );
      return res
        .status(200)
        .json(
          new apiResponse(
            200,
            { email: error.keyValue.email },
            "Default Super Admin already exists.",
            true
          )
        );
    }

    // Log other errors
    console.error("Error creating default Super Admin:", error);
    throw new apiError(500, "Error creating default Super Admin.");
  }
});

// Register a new Super Admin
const registerSuperAdmin = asyncHandler(async (req, res) => {
  console.log("Registering new super admin:", req.body);
  const { email, password } = req.body;

  // Validate input fields
  if (!email || !password) {
    throw new apiError(422, "Email and password are required!");
  }

  // Ensure the requesting admin is the default super admin
  if (!req.admin.isDefaultSuperAdmin) {
    throw new apiError(
      403,
      "Only the default super admin can create another super admin!"
    );
  }

  // Check if a super admin with the same email already exists
  const existingSuperAdmin = await Admin.findOne({
    email,
    role: "super-admin",
  });
  if (existingSuperAdmin) {
    throw new apiError(422, "A super admin already exists with this email!");
  }

  // Create the new super admin
  const newSuperAdmin = await Admin.create({
    email,
    password: await bcrypt.hash(password, 10), // Hash the password for security
    role: "super-admin",
  });

  // Fetch the newly created super admin without sensitive fields
  const createdSuperAdmin = await Admin.findById(newSuperAdmin._id).select(
    "-password -refreshToken"
  );

  if (!createdSuperAdmin) {
    throw new apiError(
      500,
      "Failed to create super admin. Please try again later."
    );
  }

  console.log("Super admin registered successfully:", createdSuperAdmin);

  // Log the activity
  await ActivityLog.create({
    adminId: req.admin._id,
    action: `Created a new super admin with email: ${email}`,
  });

  // Respond with success
  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        createdSuperAdmin,
        "Super admin created successfully!",
        true
      )
    );
});

// Super Admin deletes another Super Admin
const deleteSuperAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Ensure the requesting admin is the default super admin
  if (!req.admin.isDefaultSuperAdmin) {
    throw new apiError(
      403,
      "Only the default super admin can delete other super admins!"
    );
  }

  // Prevent the default super admin from deleting themselves
  if (id === req.admin._id.toString()) {
    throw new apiError(400, "You cannot delete the default super admin!");
  }

  // Check if the super admin to be deleted exists
  const superAdminToDelete = await Admin.findOne({
    _id: id,
    role: "super-admin",
  });

  if (!superAdminToDelete) {
    throw new apiError(404, "Super admin not found!");
  }

  // Delete the super admin
  await Admin.findByIdAndDelete(id);

  console.log("Super admin deleted successfully:", superAdminToDelete.email);

  // Log the deletion activity
  await ActivityLog.create({
    adminId: req.admin._id,
    action: `Deleted super admin with email: ${superAdminToDelete.email}`,
  });

  // Notify the deleted super admin (optional, if email service is set up)
  sendEmail(
    superAdminToDelete.email,
    "Super Admin Account Deleted",
    "Your super admin account has been deleted by the default super admin."
  );

  return res.status(200).json({
    message: "Super admin deleted successfully!",
    deletedSuperAdmin: {
      id: superAdminToDelete._id,
      email: superAdminToDelete.email,
    },
  });
});

// // Register a super admin
// const registerSuperAdmin = asyncHandler(async (req, res) => {
//   console.log("Registering super admin:", req.body);
//   const { email, password, role } = req.body;
//   if ([email, password, role].some((field) => field?.trim() === "")) {
//     throw new apiError(422, "Please fill in all the required fields");
//   }

//   // Check if super admin already exists
//   const existedSuperAdmin = await Admin.findOne({ email, role: "super-admin" });

//   if (existedSuperAdmin) {
//     throw new apiError(422, "Super admin already exists with this email");
//   }

//   // Create new super admin
//   const newSuperAdmin = await Admin.create({
//     email,
//     password,
//     role: "super-admin",
//   });

//   const createdSuperAdmin = await Admin.findById(newSuperAdmin._id).select(
//     "-password -refreshToken"
//   );

//   if (!createdSuperAdmin) {
//     throw new apiError(
//       500,
//       "Failed to register super admin. Please try again later"
//     );
//   }

//   console.log("Super admin registered successfully:", createdSuperAdmin);
//   await ActivityLog.create({
//     adminId: newSuperAdmin._id,
//     action: "Registered super admin",
//   });

//   return res
//     .status(201)
//     .json(
//       new apiResponse(
//         201,
//         createdSuperAdmin,
//         "Super admin registered successfully",
//         true
//       )
//     );
// });

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

  const { accessToken, refreshToken } =
    await generateAccessTokensAndRefreshTokens(admin._id);

  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );

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
          admin: loggedInAdmin,
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

// Super Admin creates a new admin
const superAdminCreateAdmin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input fields
    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Check if the admin role is valid
    const validRoles = ["admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided!" });
    }

    // Check if admin with the same email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin with this email already exists!" });
    }

    // Create the new admin
    const newAdmin = new Admin({
      email,
      password,
      role,
    });

    await newAdmin.save();

    // Log the activity
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Created new admin ${email}`,
    });

    // Send email notification
    sendEmail(
      email,
      "Admin Account Created by Super Admin",
      `Your admin account has been created. Login with your credentials.`
    );

    res.status(201).json({
      message: "Admin created successfully!",
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Super Admin deletes an admin by ID
const superAdminDeleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    // Delete the admin
    await admin.remove();

    // Log the activity
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted admin ${admin.email}`,
    });

    // Send email notification
    sendEmail(
      admin.email,
      "Admin Account Deleted",
      "Your admin account has been deleted by the super admin."
    );

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

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get activity logs
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate("adminId", "email");
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a post by ID
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted post ${req.params.id}`,
    });
    res.status(200).json({
      message: "Post deleted successfully",
      post: {
        id: post._id,
        title: post.title,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a comment by ID
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted comment ${req.params.id}`,
    });
    res.status(200).json({
      message: "Comment deleted successfully",
      comment: {
        id: comment._id,
        content: comment.content,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a user by ID
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted user ${req.params.id}`,
    });
    res.status(200).json({
      message: "User deleted successfully",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new category
const addCategory = async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Added category ${newCategory.name}`,
    });
    res.status(201).json({
      message: "Category added successfully",
      category: {
        id: newCategory._id,
        name: newCategory.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a category by ID
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted category ${id}`,
    });

    res.status(200).json({
      message: "Category deleted successfully",
      category: {
        id: category._id,
        name: category.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  createDefaultSuperAdmin,
  registerSuperAdmin,
  deleteSuperAdmin,
  login,
  logout,
  refreshAccessToken,
  resetPassword,
  requestPasswordReset,
  resetPasswordWithToken,
  superAdminCreateAdmin,
  superAdminDeleteAdmin,
  getAllAdmins,
  getActivityLogs,
  deletePost,
  deleteComment,
  deleteUser,
  addCategory,
  deleteCategory,
};
