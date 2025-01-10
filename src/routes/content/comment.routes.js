import express from "express";
import {
  addComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
  getCommentsByUser,
} from "../../controllers/content/comment.controllers.js";
import verifyJWT from "../../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Add a comment to a post
router.route("/post/:postId").post(addComment);

// Get comments for a post
router.route("/post/comments/:postId").get(getCommentsForPost);

// Update a comment
router.route("/:commentId").put(updateComment);

// Delete a comment
router.route("/:commentId").delete(deleteComment);

// Get all comments by a user
router.route("/user/:authorId").get(getCommentsByUser);

export default router;
