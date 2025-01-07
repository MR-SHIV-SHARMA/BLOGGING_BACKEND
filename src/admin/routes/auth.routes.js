import express from "express";
import session from "express-session";
import {
  login,
  logout,
  resetPassword,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../controllers/auth.controllers.js";
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

export default router;
