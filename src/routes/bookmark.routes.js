import express from "express";
import {
  createBookmark,
  getAllBookmarks,
  deleteBookmark,
} from "../controllers/bookmark.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Create a bookmark
router.route("/").post(createBookmark);

// Get all bookmarks for a user
router.route("/:userId").get(getAllBookmarks);

// Delete a bookmark
router.route("/").delete(deleteBookmark);

export default router;
