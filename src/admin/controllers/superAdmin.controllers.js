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
    console.error("Validation Error: Email and password are required!");
    throw new apiError(422, "Email and password are required!");
  }

  // Log the requesting admin for debugging
  console.log("Requesting admin:", req.admin);

  // Ensure the requesting admin is the default super admin
  if (!req.admin.isDefaultSuperAdmin) {
    console.error(
      "Permission Error: Only the default super admin can create another super admin!"
    );
    throw new apiError(
      403,
      "Only the default super admin can create another super admin!"
    );
  }

  // Check if a super admin with the same email already exists
  console.log(`Checking if a super admin already exists with email: ${email}`);
  const existingSuperAdmin = await Admin.findOne({
    email,
    role: "super-admin",
  });

  if (existingSuperAdmin) {
    console.error(`Super admin already exists with email: ${email}`);
    throw new apiError(422, "A super admin already exists with this email!");
  }

  // Create the new super admin
  console.log("Creating new super admin...");
  const newSuperAdmin = new Admin({
    email,
    password,
    role: "super-admin",
  });

  await newSuperAdmin.save();
  console.log(`New super admin created with email: ${newSuperAdmin.email}`);

  // Fetch the newly created super admin without sensitive fields
  const createdSuperAdmin = await Admin.findById(newSuperAdmin._id).select(
    "-password -refreshToken"
  );

  if (!createdSuperAdmin) {
    console.error(
      "Database Error: Failed to fetch the newly created super admin."
    );
    throw new apiError(
      500,
      "Failed to create super admin. Please try again later."
    );
  }

  console.log("Super admin registered successfully:", createdSuperAdmin);

  // Log the activity
  console.log("Logging activity for admin ID:", req.admin._id); // Debugging
  try {
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Created a new super admin with email: ${email}`,
    });
    console.log("Activity logged for creating super admin.");
  } catch (error) {
    console.error("Error logging activity:", error);
  }

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
  await sendEmail({
    email: superAdminToDelete.email,
    subject: "Super Admin Account Deleted",
    message: `"Your super admin account has been deleted successfully by the default super admin. \n\nEmail: ${superAdminToDelete.email}`,
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
    console.log("Attempting to delete admin with ID:", id);

    // Check if the admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      console.log("Admin not found for ID:", id);
      return res.status(404).json({ message: "Admin not found!" });
    }

    // Delete the admin using findByIdAndDelete
    await Admin.findByIdAndDelete(id);
    console.log("Admin deleted successfully:", admin.email);

    // Log the activity
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted admin ${admin.email}`,
    });
    console.log("Activity logged for deleting admin.");

    // Send email notification if the admin email is defined
    if (admin.email) {
      await sendEmail(
        admin.email,
        "Admin Account Deleted",
        "Your admin account has been deleted by the super admin."
      );
      console.log("Email notification sent to:", admin.email);
    } else {
      console.error("Error: Admin email is not defined.");
    }

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

export {
  createDefaultSuperAdmin,
  registerSuperAdmin,
  deleteSuperAdmin,
  superAdminCreateAdmin,
  superAdminDeleteAdmin,
};
