import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getPostsByCategory,
  insertPredefinedCategories,
} from "../controllers/category.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Create a category
router.route("/").post(createCategory).get(getAllCategories);

// Get all categories

// Get category by ID
router
  .route("/:categoryId")
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

// Update a category

// Delete a category

// Get posts by category
router.route("/:categoryId/posts").get(getPostsByCategory);

// Insert predefined categories
router.route("/insert-predefined").post(insertPredefinedCategories);

export default router;
