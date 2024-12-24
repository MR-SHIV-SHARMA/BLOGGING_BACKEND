import express from "express";
import {
  addComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
  getCommentsByUser,
} from "../controllers/comment.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Add a comment
router.route("/").post(addComment);

// Get comments for a post
router.route("/post/:postId").get(getCommentsForPost);

// Update a comment
router.route("/:commentId").put(updateComment);

// Delete a comment
router.route("/:commentId").delete(deleteComment);

// Get all comments by a user
router.route("/user/:authorId").get(getCommentsByUser);

export default router;