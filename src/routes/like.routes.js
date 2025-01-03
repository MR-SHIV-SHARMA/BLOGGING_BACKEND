import express from "express";
import {
  addLike,
  removeLike,
  getLikesForPost,
  getLikesForComment,
} from "../controllers/like.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Add a like for a post or comment
router.route("/post/:postId").post(addLike);
router.route("/comment/:commentId").post(addLike);

// Remove a like for a post or comment
router.route("/post/:postId").delete(removeLike);
router.route("/comment/:commentId").delete(removeLike);

// Get likes for a post
router.route("/post/:postId").get(getLikesForPost);

// Get likes for a comment
router.route("/comment/:commentId").get(getLikesForComment);

export default router;
