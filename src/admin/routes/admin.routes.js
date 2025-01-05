import express from "express";
import {
  login,
  logout,
  resetPassword,
  superAdminCreateAdmin,
  superAdminDeleteAdmin,
  getActivityLogs,
  getAllAdmins,
  registerSuperAdmin,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../controllers/admin.controllers.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { adminRateLimiter } from "../middleware/rateLimiter.js";
import authenticateAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

// Register a super admin
router.post("/super-admin/register", adminRateLimiter, registerSuperAdmin);

// Login an admin or super admin
router.post("/login", adminRateLimiter, login);

// Logout an admin
router.post(
  "/logout",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  logout
);

// Reset password for logged-in admin
router.post(
  "/reset-password",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  resetPassword
);

// Request password reset
router.post("/request-password-reset", requestPasswordReset);

// Reset password with token
router.put("/reset-password/:token", resetPasswordWithToken);

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

// Get all admins
router.get(
  "/super-admin/admins",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["super-admin"]),
  getAllAdmins
);

// Get activity logs
router.get(
  "/super-admin/activity-logs",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["super-admin"]),
  getActivityLogs
);

export default router;
