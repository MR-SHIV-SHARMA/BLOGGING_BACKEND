import express from "express";
import session from "express-session";
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
  deletePost,
  deleteComment,
  deleteUser,
  addCategory,
  deleteCategory,
} from "../controllers/admin.controllers.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { adminRateLimiter } from "../middleware/rateLimiter.js";
import authenticateAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, httpOnly: true },
  })
);

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

// Delete a category by ID
router.delete(
  "/category/:id",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  deleteCategory
);

export default router;
