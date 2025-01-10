import { Bookmark } from "../../Models/bookmark.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiError } from "../../utils/apiError.js";
import { apiResponse } from "../../utils/apiResponse.js";

// Create a Bookmark
const createBookmark = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const userId = req.user._id;

  if (!name) {
    throw new apiError(422, "Name is required.");
  }

  const bookmark = await Bookmark.create({
    userId,
    name,
  });

  return res
    .status(201)
    .json(new apiResponse(201, bookmark, "Bookmark created successfully."));
});

// Get All Bookmarks for a User
const getAllBookmarks = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const bookmarks = await Bookmark.find({ userId }).populate("posts");

  return res
    .status(200)
    .json(new apiResponse(200, bookmarks, "Bookmarks retrieved successfully."));
});

// Add a post to a bookmark
const addPostToBookmark = asyncHandler(async (req, res) => {
  const { bookmarkId } = req.params;
  const { postId } = req.body;

  const bookmark = await Bookmark.findById(bookmarkId);
  if (!bookmark) {
    throw new apiError(404, "Bookmark not found.");
  }

  bookmark.posts.push(postId);
  await bookmark.save();
  return res
    .status(200)
    .json(
      new apiResponse(200, bookmark, "Post added to bookmark successfully.")
    );
});

// Remove a post from a bookmark
const removePostFromBookmark = asyncHandler(async (req, res) => {
  const { bookmarkId, postId } = req.params;

  const bookmark = await Bookmark.findById(bookmarkId);
  if (!bookmark) {
    throw new apiError(404, "Bookmark not found.");
  }

  bookmark.posts.pull(postId);
  await bookmark.save();
  return res
    .status(200)
    .json(
      new apiResponse(200, bookmark, "Post removed from bookmark successfully.")
    );
});

// Delete a bookmark by ID
const deleteBookmarkById = asyncHandler(async (req, res) => {
  const { bookmarkId } = req.params;

  const bookmark = await Bookmark.findByIdAndDelete(bookmarkId);
  if (!bookmark) {
    throw new apiError(404, "Bookmark not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, null, "Bookmark deleted successfully."));
});

export {
  createBookmark,
  getAllBookmarks,
  addPostToBookmark,
  removePostFromBookmark,
  deleteBookmarkById,
};
