import { Like } from "../Models/like.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// Add a Like
const addLike = asyncHandler(async (req, res) => {
  const { postId, comment, tweet, userId } = req.body;

  if (!userId || (!postId && !comment && !tweet)) {
    throw new apiError(
      422,
      "A valid userId and either postId, comment, or tweet are required."
    );
  }

  const like = await Like.create({
    postId,
    comment,
    tweet,
    userId,
  });

  return res
    .status(201)
    .json(new apiResponse(201, like, "Like added successfully."));
});

// Remove a Like
const removeLike = asyncHandler(async (req, res) => {
  const { likeId } = req.params;

  if (!likeId) {
    throw new apiError(400, "A valid likeId is required.");
  }

  const like = await Like.findByIdAndDelete(likeId);

  if (!like) {
    throw new apiError(404, "Like not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, like, "Like removed successfully."));
});

// Get Likes for a Post
const getLikesForPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    throw new apiError(400, "A valid postId is required.");
  }

  const likes = await Like.find({ postId }).populate("userId", "name");

  return res
    .status(200)
    .json(new apiResponse(200, likes, "Likes retrieved successfully."));
});

// Get Likes for a Comment
const getLikesForComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new apiError(400, "A valid commentId is required.");
  }

  const likes = await Like.find({ comment: commentId }).populate(
    "userId",
    "name"
  );

  return res
    .status(200)
    .json(new apiResponse(200, likes, "Likes retrieved successfully."));
});

// Get Likes for a Tweet
const getLikesForTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new apiError(400, "A valid tweetId is required.");
  }

  const likes = await Like.find({ tweet: tweetId }).populate("userId", "name");

  return res
    .status(200)
    .json(new apiResponse(200, likes, "Likes retrieved successfully."));
});

// Get All Likes by a User
const getUserLikes = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "A valid userId is required.");
  }

  const likes = await Like.find({ userId }).populate([
    { path: "postId", select: "title" },
    { path: "comment", select: "content" },
    { path: "tweet", select: "text" },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, likes, "User likes retrieved successfully."));
});

export {
  addLike,
  removeLike,
  getLikesForPost,
  getLikesForComment,
  getLikesForTweet,
  getUserLikes,
};
