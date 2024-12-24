import { Post } from "../Models/post.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";

// Create a new post
const createPost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    throw new apiError(422, "Title and content are required fields.");
  }

  // Handle optional cover image upload
  const coverImagePath = req.files?.coverImage?.[0]?.path;
  let coverImageUrl = null;

  if (coverImagePath) {
    const uploadedImage = await uploadFileToCloudinary(coverImagePath);
    if (!uploadedImage) {
      throw new apiError(
        400,
        "Failed to upload cover image. Please try again."
      );
    }
    coverImageUrl = uploadedImage.url;
  }

  const post = await Post.create({
    title,
    content,
    coverImage: coverImageUrl,
    author: req.user._id, // Assuming user is authenticated and attached to req
  });

  return res
    .status(201)
    .json(new apiResponse(201, post, "Post created successfully."));
});

// Update a post
const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { title, content } = req.body;

  if (!postId) {
    throw new apiError(400, "Post ID is required.");
  }

  if (!mongoose.isValidObjectId(postId)) {
    throw new apiError(400, "Invalid post ID.");
  }

  const updates = {};
  if (title) updates.title = title;
  if (content) updates.content = content;

  // Handle optional cover image update
  if (req.files?.coverImage?.[0]?.path) {
    const uploadedImage = await uploadFileToCloudinary(
      req.files.coverImage[0].path
    );
    if (uploadedImage) {
      updates.coverImage = uploadedImage.url;
    }
  }

  const updatedPost = await Post.findByIdAndUpdate(postId, updates, {
    new: true,
  });

  if (!updatedPost) {
    throw new apiError(404, "Post not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedPost, "Post updated successfully."));
});

// Get all posts
const getAllPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const filter = {};

  if (search) {
    filter.title = { $regex: search, $options: "i" }; // Case-insensitive search
  }

  const posts = await Post.find(filter)
    .populate("author", "name email")
    .populate("categories", "name")
    .populate("tags", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new apiResponse(200, posts, "Posts fetched successfully."));
});

// Get a single post by ID
const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.isValidObjectId(postId)) {
    throw new apiError(400, "Invalid post ID.");
  }

  const post = await Post.findById(postId)
    .populate("author", "name email")
    .populate("categories", "name")
    .populate("tags", "name")
    .populate("comments");

  if (!post) {
    throw new apiError(404, "Post not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, post, "Post fetched successfully."));
});

// Delete a post by ID
const deletePostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.isValidObjectId(postId)) {
    throw new apiError(400, "Invalid post ID.");
  }

  const deletedPost = await Post.findByIdAndDelete(postId);

  if (!deletedPost) {
    throw new apiError(404, "Post not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, deletedPost, "Post deleted successfully."));
});

export { createPost, updatePost, getAllPosts, getPostById, deletePostById };
