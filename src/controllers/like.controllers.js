import { Like } from "../Models/like.models.js";
import { Post } from "../Models/post.models.js";
import { Comment } from "../Models/comment.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// Add a Like to a Post or Comment
const addLike = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId, commentId } = req.params;

  console.log("Request Body:", req.body);
  console.log("Request Params:", req.params);
  console.log("User ID:", userId);

  if (!userId || (!postId && !commentId)) {
    console.error("Validation Error: Missing required fields");
    console.log("userId:", userId);
    console.log("postId:", postId);
    console.log("commentId:", commentId);
    throw new apiError(
      422,
      "A valid userId and either postId or commentId are required."
    );
  }

  let existingLike;
  if (postId) {
    existingLike = await Like.findOne({ userId, postId });
  } else if (commentId) {
    existingLike = await Like.findOne({ userId, comment: commentId });
  }

  if (existingLike) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "You have already liked this item."));
  }

  const likeData = { userId };
  if (postId) likeData.postId = postId;
  if (commentId) likeData.comment = commentId;

  console.log("Like Data:", likeData);

  const like = await Like.create(likeData);

  if (postId) {
    // Update the post to include the like reference
    await Post.findByIdAndUpdate(postId, { $push: { likes: like._id } });
  } else if (commentId) {
    // Update the comment to include the like reference
    await Comment.findByIdAndUpdate(commentId, { $push: { likes: userId } });
  }

  return res
    .status(201)
    .json(new apiResponse(201, like, "Like added successfully."));
});

// Remove a Like
const removeLike = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId, commentId } = req.params;

  console.log("Request Params:", req.params);
  console.log("User ID:", userId);

  if (!userId || (!postId && !commentId)) {
    console.error("Validation Error: Missing required fields");
    console.log("userId:", userId);
    console.log("postId:", postId);
    console.log("commentId:", commentId);
    throw new apiError(
      422,
      "A valid userId and either postId or commentId are required."
    );
  }

  let like;
  if (postId) {
    like = await Like.findOneAndDelete({ userId, postId });
  } else if (commentId) {
    like = await Like.findOneAndDelete({ userId, comment: commentId });
  }

  if (!like) {
    throw new apiError(404, "Like not found.");
  }

  if (postId) {
    // Update the post to remove the like reference
    await Post.findByIdAndUpdate(postId, { $pull: { likes: like._id } });
  } else if (commentId) {
    // Update the comment to remove the like reference
    await Comment.findByIdAndUpdate(commentId, { $pull: { likes: userId } });
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
  const likeCount = await Like.countDocuments({ postId });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { likes, likeCount },
        "Likes retrieved successfully."
      )
    );
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
  const likeCount = await Like.countDocuments({ commentId });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { likes, likeCount },
        "Likes retrieved successfully."
      )
    );
});

// Get All Likes by a User
const getUserLikes = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "A valid userId is required.");
  }

  const likes = await Like.find({ userId }).populate([
    { path: "postId", select: "title content" },
    { path: "comment", select: "content" },
  ]);

  const posts = likes.filter((like) => like.postId).map((like) => like.postId);
  const comments = likes
    .filter((like) => like.comment)
    .map((like) => like.comment);

  const postCount = posts.length;
  const commentCount = comments.length;

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { posts, comments, postCount, commentCount },
        "User likes retrieved successfully."
      )
    );
});

export {
  addLike,
  removeLike,
  getLikesForPost,
  getLikesForComment,
  getUserLikes,
};
