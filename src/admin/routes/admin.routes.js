import express from "express";
import {
  register,
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
} from "../controllers/admin.controllers.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { adminRateLimiter } from "../middleware/rateLimiter.js";
import authenticateAdmin from "../middleware/authMiddleware.js";
import { Admin } from "../models/admin.models.js"; // Import the Admin model

const router = express.Router();

// Register an admin
router.post("/register", adminRateLimiter, register);

// Login an admin or super admin
router.post("/login", adminRateLimiter, login);

// Delete a post by ID
router.delete(
  "/post/:id",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  deletePost
);

// Delete a comment by ID
router.delete(
  "/comment/:id",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  deleteComment
);

// Delete a user by ID
router.delete(
  "/user/:id",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  deleteUser
);

// Add a new category
router.post(
  "/category",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  addCategory
);

// Reset password for an admin
router.post(
  "/reset-password",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  resetPassword
);

// Super admin creates a new admin
router.post(
  "/super-admin/create-admin",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["super-admin"]),
  superAdminCreateAdmin
);

// Super admin deletes an admin by ID
router.delete(
  "/super-admin/delete-admin/:id",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["super-admin"]),
  superAdminDeleteAdmin
);

// Super admin resets an admin's password
router.post(
  "/super-admin/reset-admin-password",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["super-admin"]),
  superAdminResetAdminPassword
);

// Get activity logs
router.get(
  "/super-admin/activity-logs",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["super-admin"]),
  getActivityLogs
);

// Logout an admin
router.post(
  "/logout",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  logout
);

// Get all admins
router.get(
  "/super-admin/admins",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["super-admin"]),
  getAllAdmins
);

// Enable 2FA for an admin
router.post(
  "/enable-2fa",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  enable2FA
);

// Verify 2FA for an admin
router.post(
  "/verify-2fa",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  verify2FA
);

// Register a super admin
router.post(
  "/super-admin/register",
  adminRateLimiter,
  async (req, res, next) => {
    const superAdminExists = await Admin.exists({ role: "super-admin" });
    if (!superAdminExists) {
      return next();
    }
    return res.status(403).json({ message: "Super admin already exists" });
  },
  createAdmin
);

export default router;
