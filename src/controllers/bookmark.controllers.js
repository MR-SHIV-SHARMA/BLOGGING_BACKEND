import { Bookmark } from "../Models/bookmark.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// Create a Bookmark
const createBookmark = asyncHandler(async (req, res) => {
  const { userId, postId } = req.body;

  if (!userId || !postId) {
    throw new apiError(422, "User ID and Post ID are required.");
  }

  const existingBookmark = await Bookmark.findOne({ userId, postId });

  if (existingBookmark) {
    throw new apiError(409, "This post is already bookmarked.");
  }

  const bookmark = await Bookmark.create({
    userId,
    postId,
  });

  return res
    .status(201)
    .json(new apiResponse(201, bookmark, "Bookmark created successfully."));
});

// Get All Bookmarks for a User
const getAllBookmarks = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "User ID is required.");
  }

  const bookmarks = await Bookmark.find({ userId }).populate("postId");

  return res
    .status(200)
    .json(new apiResponse(200, bookmarks, "Bookmarks retrieved successfully."));
});

// Delete a Bookmark
const deleteBookmark = asyncHandler(async (req, res) => {
  const { userId, postId } = req.body;

  if (!userId || !postId) {
    throw new apiError(422, "User ID and Post ID are required.");
  }

  const deletedBookmark = await Bookmark.findOneAndDelete({ userId, postId });

  if (!deletedBookmark) {
    throw new apiError(404, "Bookmark not found.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, deletedBookmark, "Bookmark deleted successfully.")
    );
});

export { createBookmark, getAllBookmarks, deleteBookmark };
