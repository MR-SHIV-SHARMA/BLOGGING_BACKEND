import express from "express";
import {
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTag,
  getPostsByTag,
} from "../controllers/tag.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .post(createTag) // Create a new tag
  .get(getAllTags); // Get all tags

router
  .route("/:tagId")
  .get(getTagById) // Get a tag by ID
  .patch(updateTag) // Update a tag by ID
  .delete(deleteTag); // Delete a tag by ID

// Get posts by tag
router.route("/:tagId/posts").get(getPostsByTag);

export default router;
