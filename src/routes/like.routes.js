import express from "express";
import {
  addLike,
  removeLike,
  getLikesForPost,
  getLikesForComment,
  getLikesForTweet,
  getUserLikes,
} from "../controllers/like.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Add a like
router.route("/").post(addLike);

// Remove a like
router.route("/:likeId").delete(removeLike);

// Get likes for a post
router.route("/post/:postId").get(getLikesForPost);

// Get likes for a comment
router.route("/comment/:commentId").get(getLikesForComment);

// Get likes for a tweet
router.route("/tweet/:tweetId").get(getLikesForTweet);

// Get all likes by a user
router.route("/user/:userId").get(getUserLikes);

export default router;
