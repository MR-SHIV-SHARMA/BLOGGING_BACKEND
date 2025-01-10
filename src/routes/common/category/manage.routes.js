import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  insertPredefinedCategories,
} from "../../../controllers/common/category/manage.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT);

// Create a category
router.route("/").post(createCategory).get(getAllCategories);

// Get category by ID
router
  .route("/:categoryId")
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

// Insert predefined categories
router.route("/insert-predefined").post(insertPredefinedCategories);

export default router;
