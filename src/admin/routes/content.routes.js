import express from "express";
import session from "express-session";
import {
  deletePost,
  deleteComment,
  deleteUser,
  addCategory,
  deleteCategory,
} from "../controllers/content.controllers.js";
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
