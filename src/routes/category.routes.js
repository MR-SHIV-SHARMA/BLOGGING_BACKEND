import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Create a category
router.route("/").post(createCategory);

// Get all categories
router.route("/").get(getAllCategories);

// Get category by ID
router.route("/:categoryId").get(getCategoryById);

// Update a category
router.route("/:categoryId").put(updateCategory);

// Delete a category
router.route("/:categoryId").delete(deleteCategory);

export default router;
