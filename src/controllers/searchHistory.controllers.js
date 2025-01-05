import { SearchHistory } from "../Models/searchHistory.models.js";
import { Post } from "../Models/post.models.js";
import { User } from "../Models/user.models.js";
import { Tag } from "../Models/tag.models.js";
import { Category } from "../Models/category.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// Create a new search history entry and perform search
const createSearchHistory = asyncHandler(async (req, res) => {
  const { query } = req.body;
  const userId = req.user._id; // Assuming authenticated user information is available in `req.user`

  if (!query || query.trim() === "") {
    throw new apiError(422, "Search query is required.");
  }

  // Save search query to history
  const searchEntry = await SearchHistory.create({
    userId,
    query: query.trim(),
  });

  let results = [];
  let suggestions = [];

  if (query.startsWith("#")) {
    // Search by tag
    const tag = query.slice(1).trim();
    const tagDoc = await Tag.findOne({ name: { $regex: tag, $options: "i" } });
    if (tagDoc) {
      results = await Post.find({ tags: tagDoc._id })
        .populate("userId", "username fullname avatar")
        .populate("tags", "name")
        .populate("categories", "name")
        .populate("comments")
        .populate("likes");

      // Provide tag suggestions
      suggestions = await Tag.find({
        name: { $regex: tag, $options: "i" },
      }).limit(10);
    }
  } else if (query.startsWith("@")) {
    // Search by username
    const username = query.slice(1).trim();
    results = await User.find({
      username: { $regex: username, $options: "i" },
    }).select("username fullname avatar");

    // Provide username suggestions
    suggestions = await User.find({
      username: { $regex: username, $options: "i" },
    })
      .select("username")
      .limit(10);
  } else {
    // General search or category search
    const search = query.trim();
    const categoryDoc = await Category.findOne({
      name: { $regex: search, $options: "i" },
    });
    if (categoryDoc) {
      results = await Post.find({ categories: categoryDoc._id })
        .populate("userId", "username fullname avatar")
        .populate("tags", "name")
        .populate("categories", "name")
        .populate("comments")
        .populate("likes");

      // Provide category suggestions
      suggestions = await Category.find({
        name: { $regex: search, $options: "i" },
      }).limit(10);
    } else {
      results = await Post.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ],
      })
        .populate("userId", "username fullname avatar")
        .populate("tags", "name")
        .populate("categories", "name")
        .populate("comments")
        .populate("likes");

      // Provide general search suggestions
      suggestions = await Post.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ],
      })
        .select("title")
        .limit(10);
    }
  }

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        { searchEntry, results, suggestions },
        "Search results fetched successfully."
      )
    );
});

// Get search history for a user
const getUserSearchHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Assuming authenticated user information is available in `req.user`
  const { query } = req.query;

  let results = [];
  let suggestions = [];

  if (query) {
    if (query.startsWith("#")) {
      // Search by tag
      const tag = query.slice(1).trim();
      const tagDoc = await Tag.findOne({
        name: { $regex: tag, $options: "i" },
      });
      if (tagDoc) {
        results = await Post.find({ tags: tagDoc._id })
          .populate("userId", "username fullname avatar")
          .populate("tags", "name")
          .populate("categories", "name")
          .populate("comments")
          .populate("likes");

        // Provide tag suggestions
        suggestions = await Tag.find({
          name: { $regex: tag, $options: "i" },
        }).limit(10);
      }
    } else if (query.startsWith("@")) {
      // Search by username
      const username = query.slice(1).trim();
      results = await User.find({
        username: { $regex: username, $options: "i" },
      }).select("username fullname avatar");

      // Provide username suggestions
      suggestions = await User.find({
        username: { $regex: username, $options: "i" },
      })
        .select("username")
        .limit(10);
    } else {
      // General search or category search
      const search = query.trim();
      const categoryDoc = await Category.findOne({
        name: { $regex: search, $options: "i" },
      });
      if (categoryDoc) {
        results = await Post.find({ categories: categoryDoc._id })
          .populate("userId", "username fullname avatar")
          .populate("tags", "name")
          .populate("categories", "name")
          .populate("comments")
          .populate("likes");

        // Provide category suggestions
        suggestions = await Category.find({
          name: { $regex: search, $options: "i" },
        }).limit(10);
      } else {
        results = await Post.find({
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
          ],
        })
          .populate("userId", "username fullname avatar")
          .populate("tags", "name")
          .populate("categories", "name")
          .populate("comments")
          .populate("likes");

        // Provide general search suggestions
        suggestions = await Post.find({
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
          ],
        })
          .select("title")
          .limit(10);
      }
    }
  } else {
    // Fetch search history if no query is provided
    results = await SearchHistory.find({ userId })
      .sort({ createdAt: -1 }) // Sort by most recent
      .limit(20); // Limit to the latest 20 searches
  }

  if (!results.length) {
    throw new apiError(404, "No search history found.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { results, suggestions },
        "Search history fetched successfully."
      )
    );
});

// Delete a specific search history entry
const deleteSearchHistoryEntry = asyncHandler(async (req, res) => {
  const { historyId } = req.params;

  if (!mongoose.isValidObjectId(historyId)) {
    throw new apiError(400, "Invalid history ID.");
  }

  const deletedHistory = await SearchHistory.findByIdAndDelete(historyId);

  if (!deletedHistory) {
    throw new apiError(404, "Search history entry not found.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        deletedHistory,
        "Search history entry deleted successfully."
      )
    );
});

// Clear all search history for a user
const clearUserSearchHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Assuming authenticated user information is available in `req.user`

  const result = await SearchHistory.deleteMany({ userId });

  return res
    .status(200)
    .json(
      new apiResponse(200, result, "All search history cleared successfully.")
    );
});

export {
  createSearchHistory,
  getUserSearchHistory,
  deleteSearchHistoryEntry,
  clearUserSearchHistory,
};
