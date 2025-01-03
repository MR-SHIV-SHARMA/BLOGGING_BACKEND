import express from "express";
import {
  createBookmark,
  getAllBookmarks,
  addPostToBookmark,
  removePostFromBookmark,
  deleteBookmarkById,
} from "../controllers/bookmark.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Create a bookmark
router.route("/").post(createBookmark);

// Get all bookmarks for a user
router.route("/").get(getAllBookmarks);

// Add a post to a bookmark
router.route("/:bookmarkId/posts").post(addPostToBookmark);

// Remove a post from a bookmark
router.route("/:bookmarkId/posts/:postId").delete(removePostFromBookmark);

// Delete a bookmark by ID
router.route("/:bookmarkId").delete(deleteBookmarkById);

export default router;
