import { Media } from "../Models/media.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// Upload Media
const uploadMedia = asyncHandler(async (req, res) => {
  const { url, type, uploadedBy, postId, commentId } = req.body;

  if (!url || !type || !uploadedBy) {
    throw new apiError(422, "URL, type, and uploadedBy fields are required.");
  }

  const allowedTypes = ["image", "video", "audio"];
  if (!allowedTypes.includes(type)) {
    throw new apiError(
      400,
      `Invalid media type. Allowed types: ${allowedTypes.join(", ")}`
    );
  }

  const media = await Media.create({
    url,
    type,
    uploadedBy,
    postId,
    commentId,
  });

  return res
    .status(201)
    .json(new apiResponse(201, media, "Media uploaded successfully."));
});

// Get All Media
const getAllMedia = asyncHandler(async (req, res) => {
  const mediaList = await Media.find().sort({ createdAt: -1 });

  if (!mediaList.length) {
    throw new apiError(404, "No media files found.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, mediaList, "Media files retrieved successfully.")
    );
});

// Get Media by ID
const getMediaById = asyncHandler(async (req, res) => {
  const { mediaId } = req.params;

  if (!mediaId) {
    throw new apiError(400, "Media ID is required.");
  }

  const media = await Media.findById(mediaId);

  if (!media) {
    throw new apiError(404, "Media file not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, media, "Media file retrieved successfully."));
});

// Delete Media
const deleteMedia = asyncHandler(async (req, res) => {
  const { mediaId } = req.params;

  if (!mediaId) {
    throw new apiError(400, "Media ID is required.");
  }

  const media = await Media.findByIdAndDelete(mediaId);

  if (!media) {
    throw new apiError(404, "Media file not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, media, "Media file deleted successfully."));
});

// Get Media by Post ID
const getMediaByPostId = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    throw new apiError(400, "Post ID is required.");
  }

  const media = await Media.find({ postId });

  if (!media.length) {
    throw new apiError(404, "No media files found for this post.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, media, "Media files retrieved successfully."));
});

// Get Media by Comment ID
const getMediaByCommentId = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new apiError(400, "Comment ID is required.");
  }

  const media = await Media.find({ commentId });

  if (!media.length) {
    throw new apiError(404, "No media files found for this comment.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, media, "Media files retrieved successfully."));
});

export {
  uploadMedia,
  getAllMedia,
  getMediaById,
  deleteMedia,
  getMediaByPostId,
  getMediaByCommentId,
};
