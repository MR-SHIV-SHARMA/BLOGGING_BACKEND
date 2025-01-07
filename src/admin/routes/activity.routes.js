import express from "express";
import session from "express-session";
import { getActivityLogs } from "../controllers/activity.controllers.js";
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

// Get activity logs
router.get(
  "/super-admin/activity-logs",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["super-admin"]),
  getActivityLogs
);

export default router;
