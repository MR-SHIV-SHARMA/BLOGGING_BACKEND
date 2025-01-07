import { Admin } from "../models/admin.models.js";
import { ActivityLog } from "../models/activityLog.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../helpers/mailer.js";

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

    // Send notification email
    await sendEmail({
      email: defaultEmail,
      subject: "Your Default Super Admin Account",
      message: `Your Super Admin account has been created successfully. \n\nEmail: ${defaultEmail}\nPassword: ${defaultPassword}`,
    });

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
    if (error.code === 11000 && error.keyPattern?.email) {
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

    console.error("Error creating default Super Admin:", error);
    throw new apiError(500, "Error creating default Super Admin.");
  }
});

// Register a new Super Admin
const registerSuperAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new apiError(422, "Email and password are required!");
  }

  if (!req.admin.isDefaultSuperAdmin) {
    throw new apiError(
      403,
      "Only the default super admin can create another super admin!"
    );
  }

  const existingSuperAdmin = await Admin.findOne({
    email,
    role: "super-admin",
  });

  if (existingSuperAdmin) {
    throw new apiError(422, "A super admin already exists with this email!");
  }

  const newSuperAdmin = new Admin({
    email,
    password,
    role: "super-admin",
  });

  await newSuperAdmin.save();

  const createdSuperAdmin = await Admin.findById(newSuperAdmin._id).select(
    "-password -refreshToken"
  );

  if (!createdSuperAdmin) {
    throw new apiError(
      500,
      "Failed to create super admin. Please try again later."
    );
  }

  await sendEmail({
    email: createdSuperAdmin.email,
    subject: "Your Super Admin Account",
    message: `Your super admin account has been successfully created.\n\nEmail: ${createdSuperAdmin.email}\nPlease log in with the credentials provided to you.`,
  });

  await ActivityLog.create({
    adminId: req.admin._id,
    action: `Created a new super admin with email: ${email}`,
  });

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

  if (!req.admin.isDefaultSuperAdmin) {
    throw new apiError(
      403,
      "Only the default super admin can delete other super admins!"
    );
  }

  if (id === req.admin._id.toString()) {
    throw new apiError(400, "You cannot delete the default super admin!");
  }

  const superAdminToDelete = await Admin.findOne({
    _id: id,
    role: "super-admin",
  });

  if (!superAdminToDelete) {
    throw new apiError(404, "Super admin not found!");
  }

  await Admin.findByIdAndDelete(id);

  await ActivityLog.create({
    adminId: req.admin._id,
    action: `Deleted super admin with email: ${superAdminToDelete.email}`,
  });

  await sendEmail({
    email: superAdminToDelete.email,
    subject: "Super Admin Account Deleted",
    message: `Your super admin account has been deleted successfully by the default super admin. \n\nEmail: ${superAdminToDelete.email}`,
  });

  return res.status(200).json({
    message: "Super admin deleted successfully!",
    deletedSuperAdmin: {
      id: superAdminToDelete._id,
      email: superAdminToDelete.email,
    },
  });
});

// Super Admin creates a new admin
const superAdminCreateAdmin = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const validRoles = ["admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role provided!" });
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return res
      .status(400)
      .json({ message: "Admin with this email already exists!" });
  }

  const newAdmin = new Admin({
    email,
    password,
    role,
  });

  await newAdmin.save();

  await ActivityLog.create({
    adminId: req.admin._id,
    action: `Created new admin ${email}`,
  });

  await sendEmail({
    email: newAdmin.email,
    subject: "Admin Account Created",
    message: `Your admin account has been created by the super admin.\n\nEmail: ${newAdmin.email}\nPlease log in with your provided credentials.`,
  });

  res.status(201).json({
    message: "Admin created successfully!",
    admin: {
      id: newAdmin._id,
      email: newAdmin.email,
      role: newAdmin.role,
    },
  });
});

// Super Admin deletes an admin by ID
const superAdminDeleteAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const admin = await Admin.findById(id);
  if (!admin) {
    return res.status(404).json({ message: "Admin not found!" });
  }

  await Admin.findByIdAndDelete(id);

  await ActivityLog.create({
    adminId: req.admin._id,
    action: `Deleted admin ${admin.email}`,
  });

  // Send email notification to the deleted admin
  await sendEmail({
    email: admin.email,
    subject: "Admin Account Deleted",
    message: `Your admin account has been deleted by the super admin. \n\nEmail: ${admin.email}`,
  });

  res.status(200).json({
    message: "Admin deleted successfully!",
    admin: {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
  });
});

export {
  createDefaultSuperAdmin,
  registerSuperAdmin,
  deleteSuperAdmin,
  superAdminCreateAdmin,
  superAdminDeleteAdmin,
};
