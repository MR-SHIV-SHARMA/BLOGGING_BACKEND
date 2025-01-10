import { Comment } from "../../Models/comment.models.js";
import { Post } from "../../Models/post.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiError } from "../../utils/apiError.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { sendNotification } from "../interaction/notification.controllers.js"; // Import sendNotification function

// Add a Comment
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  console.log("Request Params:", req.params);
  console.log("Request Body:", req.body);
  console.log("User ID:", userId);

  if (!postId || !userId || !content?.trim()) {
    console.error("Validation Error: Missing required fields");
    console.log("postId:", postId);
    console.log("userId:", userId);
    console.log("content:", content);
    throw new apiError(422, "Post ID, userId, and content are required.");
  }

  const postExists = await Post.findById(postId);
  if (!postExists) {
    throw new apiError(404, "Post not found.");
  }

  const comment = await Comment.create({
    postId,
    userId,
    content,
  });

  // Update the post to include the comment reference
  await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

  // Retrieve the post with the userId field populated
  const post = await Post.findById(postId).populate("userId");
  if (!post) {
    throw new apiError(404, "Post not found.");
  }

  console.log("Post owner ID:", post.userId); // Debug logging
  // Send notification to the post owner
  await sendNotification(
    post.userId._id,
    `${req.user.username} commented on your post`,
    "comment"
  );

  return res
    .status(201)
    .json(new apiResponse(201, comment, "Comment added successfully."));
});

// Get All Comments for a Post
const getCommentsForPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    throw new apiError(400, "Post ID is required.");
  }

  const comments = await Comment.find({ postId }).populate("userId", "name");
  const commentCount = await Comment.countDocuments({ postId });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { comments, commentCount },
        "Comments retrieved successfully."
      )
    );
});

// Update a Comment
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new apiError(400, "Content is required for updating the comment.");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  );

  if (!updatedComment) {
    throw new apiError(404, "Comment not found.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedComment, "Comment updated successfully.")
    );
});

// Delete a Comment
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new apiError(400, "Comment ID is required.");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new apiError(404, "Comment not found.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, deletedComment, "Comment deleted successfully.")
    );
});

// Get All Comments by a User
const getCommentsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "User ID is required.");
  }

  const comments = await Comment.find({ userId }).populate("postId", "title");

  return res
    .status(200)
    .json(
      new apiResponse(200, comments, "User's comments retrieved successfully.")
    );
});

export {
  addComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
  getCommentsByUser,
};
