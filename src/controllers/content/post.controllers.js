import { Post } from "../../Models/post.models.js";
import { Category } from "../../Models/category.models.js";
import { Tag } from "../../Models/tag.models.js";
import { apiError } from "../../utils/apiError.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadFileToCloudinary } from "../../utils/cloudinary.js";
import mongoose from "mongoose";

// Utility function to format and save content
const formatAndSaveContent = (content, formatOptions) => {
  if (!formatOptions) return content;

  let formattedContent = content;

  // Apply font style
  if (formatOptions.fontStyle) {
    formattedContent = `<span style="font-family:${formatOptions.fontStyle};">${formattedContent}</span>`;
  }

  // Apply font color
  if (formatOptions.fontColor) {
    formattedContent = `<span style="color:${formatOptions.fontColor};">${formattedContent}</span>`;
  }

  // Apply font size
  if (formatOptions.fontSize) {
    formattedContent = `<span style="font-size:${formatOptions.fontSize};">${formattedContent}</span>`;
  }

  // Apply text alignment
  if (formatOptions.textAlign) {
    formattedContent = `<div style="text-align:${formatOptions.textAlign};">${formattedContent}</div>`;
  }

  // Apply background color
  if (formatOptions.backgroundColor) {
    formattedContent = `<div style="background-color:${formatOptions.backgroundColor};">${formattedContent}</div>`;
  }

  // Apply bold formatting
  if (formatOptions.isBold) {
    formattedContent = `<b>${formattedContent}</b>`;
  }

  // Apply italic formatting
  if (formatOptions.isItalic) {
    formattedContent = `<i>${formattedContent}</i>`;
  }

  // Apply underline formatting
  if (formatOptions.isUnderline) {
    formattedContent = `<u>${formattedContent}</u>`;
  }

  // Apply strikethrough formatting
  if (formatOptions.isStrikethrough) {
    formattedContent = `<s>${formattedContent}</s>`;
  }

  // Apply letter spacing
  if (formatOptions.letterSpacing) {
    formattedContent = `<span style="letter-spacing:${formatOptions.letterSpacing};">${formattedContent}</span>`;
  }

  // Apply line height
  if (formatOptions.lineHeight) {
    formattedContent = `<span style="line-height:${formatOptions.lineHeight};">${formattedContent}</span>`;
  }

  // Apply text decoration
  if (formatOptions.textDecoration) {
    formattedContent = `<span style="text-decoration:${formatOptions.textDecoration};">${formattedContent}</span>`;
  }

  // Apply text shadow
  if (formatOptions.textShadow) {
    formattedContent = `<span style="text-shadow:${formatOptions.textShadow};">${formattedContent}</span>`;
  }

  // Apply border
  if (formatOptions.border) {
    formattedContent = `<div style="border:${formatOptions.border};">${formattedContent}</div>`;
  }

  // Apply padding
  if (formatOptions.padding) {
    formattedContent = `<div style="padding:${formatOptions.padding};">${formattedContent}</div>`;
  }

  // Apply margin
  if (formatOptions.margin) {
    formattedContent = `<div style="margin:${formatOptions.margin};">${formattedContent}</div>`;
  }

  // Apply text direction (RTL/LTR)
  if (formatOptions.textDirection) {
    formattedContent = `<div style="direction:${formatOptions.textDirection};">${formattedContent}</div>`;
  }

  // Apply custom font using URL
  if (formatOptions.customFontURL) {
    formattedContent = `<style>
      @font-face {
        font-family: 'CustomFont';
        src: url('${formatOptions.customFontURL}');
      }
    </style>
    <span style="font-family: 'CustomFont';">${formattedContent}</span>`;
  }

  // Apply text transform (uppercase, lowercase, capitalize)
  if (formatOptions.textTransform) {
    formattedContent = `<span style="text-transform:${formatOptions.textTransform};">${formattedContent}</span>`;
  }

  // Apply opacity
  if (formatOptions.opacity) {
    formattedContent = `<span style="opacity:${formatOptions.opacity};">${formattedContent}</span>`;
  }

  // Apply gradient background
  if (formatOptions.gradientBackground) {
    formattedContent = `<div style="background: linear-gradient(${formatOptions.gradientBackground});">${formattedContent}</div>`;
  }

  // Apply animation effects
  if (formatOptions.animation) {
    formattedContent = `<div style="animation:${formatOptions.animation};">${formattedContent}</div>`;
  }

  // Wrap content in hyperlink
  if (formatOptions.hyperlink) {
    formattedContent = `<a href="${formatOptions.hyperlink}" target="_blank">${formattedContent}</a>`;
  }

  // Convert content to list (ordered/unordered)
  if (formatOptions.isList) {
    const listType = formatOptions.listType === "ordered" ? "ol" : "ul";
    const items = formattedContent
      .split("\n")
      .map((item) => `<li>${item}</li>`)
      .join("");
    formattedContent = `<${listType}>${items}</${listType}>`;
  }

  // Add custom CSS classes
  if (formatOptions.customClasses) {
    const classes = formatOptions.customClasses.join(" ");
    formattedContent = `<div class="${classes}">${formattedContent}</div>`;
  }

  return formattedContent;
};

// Create a new post
const createPost = asyncHandler(async (req, res, next) => {
  try {
    const { title, content, categoryId, tagId } = req.body;
    const userId = req.user?._id;

    if (!title || !title.trim()) {
      throw new apiError(422, "Title is required.");
    }
    if (!content || !content.trim()) {
      throw new apiError(422, "Content is required.");
    }

    let categories;
    if (!categoryId) {
      throw new apiError(422, "At least one category is required.");
    } else if (Array.isArray(categoryId)) {
      categories = categoryId;
    } else {
      categories = [categoryId];
    }

    let media = null;
    const mediaPath = req.files?.media?.[0]?.path;

    if (mediaPath) {
      media = await uploadFileToCloudinary(mediaPath).catch((error) => {});
    }

    // Create the post with isActive set to true
    const post = await Post.create({
      title,
      content,
      media: media?.url || undefined,
      categories,
      tags: tagId ? [tagId] : [],
      userId,
      isActive: true, // Set isActive to true by default
    });

    return res
      .status(201)
      .json(new apiResponse(201, post, "Post created successfully."));
  } catch (error) {
    next(error);
  }
});

// Update a post
const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { title, content, isActive } = req.body;

  if (!postId) {
    throw new apiError(400, "Post ID is required.");
  }

  if (!mongoose.isValidObjectId(postId)) {
    throw new apiError(400, "Invalid post ID.");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new apiError(404, "Post not found.");
  }

  const formattedContent = formatAndSaveContent(
    content,
    req.body.formatOptions
  );

  const updates = {};
  if (title) updates.title = title;
  if (content) updates.content = formattedContent;

  // ✅ Ensure isActive is updated even if false
  if (isActive !== undefined) updates.isActive = isActive;

  if (req.files?.media?.[0]?.path) {
    const uploadedImage = await uploadFileToCloudinary(
      req.files.media[0].path,
      post.media
    );
    if (uploadedImage) {
      updates.media = uploadedImage.url;
    }
  }

  const updatedPost = await Post.findByIdAndUpdate(postId, updates, {
    new: true,
  });

  return res
    .status(200)
    .json(new apiResponse(200, updatedPost, "Post updated successfully."));
});

// Get all posts by the logged-in user
const getPostsByUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const posts = await Post.find({ userId })
    .populate("userId", "username fullname avatar")
    .populate("categories", "name")
    .populate("tags", "name")
    .populate("comments")
    .populate("likes");

  if (!posts || posts.length === 0) {
    return res.status(404).json(new apiResponse(404, [], "No posts found."));
  }

  return res
    .status(200)
    .json(new apiResponse(200, posts, "Posts fetched successfully."));
});

// Get all posts
const getAllPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const filter = {};

  if (search) {
    filter.title = { $regex: search, $options: "i" }; // Case-insensitive search
  }

  const posts = await Post.find(filter)
    .populate("userId", "username fullname avatar")
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
    .populate("userId", "username fullname avatar")
    .populate("categories", "name")
    .populate("tags", "name")
    .populate("comments")
    .populate("likes");

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
  const userId = req.user?._id;

  if (!mongoose.isValidObjectId(postId)) {
    throw new apiError(400, "Invalid post ID.");
  }

  const post = await Post.findById(postId).populate("userId");
  if (!post) {
    throw new apiError(404, "Post not found.");
  }

  if (!post.userId) {
    throw new apiError(500, "Post data is corrupted. No owner found.");
  }

  if (post.userId._id.toString() !== userId.toString()) {
    throw new apiError(403, "You are not authorized to delete this post.");
  }

  // Delete the post
  await Post.findByIdAndDelete(postId);

  return res
    .status(200)
    .json(new apiResponse(200, null, post, "Post deleted successfully."));
});

// Get posts by userId
const getPostsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user ID.");
  }

  const posts = await Post.find({ userId })
    .populate("userId", "username fullname avatar")
    .populate("categories", "name")
    .populate("tags", "name")
    .populate("comments")
    .populate("likes")
    .sort({ createdAt: -1 });

  if (!posts || posts.length === 0) {
    return res
      .status(404)
      .json(new apiResponse(404, [], "No posts found for this user."));
  }

  return res
    .status(200)
    .json(new apiResponse(200, posts, "User posts fetched successfully."));
});

export {
  createPost,
  updatePost,
  getPostsByUser,
  getAllPosts,
  getPostById,
  deletePostById,
  getPostsByUserId,
};
