import { Comment } from "../Models/comment.models.js";
import { Post } from "../Models/post.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// Add a Comment
const addComment = asyncHandler(async (req, res) => {
  const { postId, author, content } = req.body;

  if (!postId || !author || !content?.trim()) {
    throw new apiError(422, "Post ID, author, and content are required.");
  }

  const postExists = await Post.findById(postId);
  if (!postExists) {
    throw new apiError(404, "Post not found.");
  }

  const comment = await Comment.create({
    postId,
    author,
    content,
  });

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

  const comments = await Comment.find({ postId }).populate("author", "name");

  return res
    .status(200)
    .json(new apiResponse(200, comments, "Comments retrieved successfully."));
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
  const { authorId } = req.params;

  if (!authorId) {
    throw new apiError(400, "Author ID is required.");
  }

  const comments = await Comment.find({ author: authorId }).populate(
    "postId",
    "title"
  );

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
