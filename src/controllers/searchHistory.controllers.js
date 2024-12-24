import { SearchHistory } from "../Models/searchHistory.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new search history entry
const createSearchHistory = asyncHandler(async (req, res) => {
  const { query } = req.body;
  const userId = req.user._id; // Assuming authenticated user information is available in `req.user`

  if (!query || query.trim() === "") {
    throw new apiError(422, "Search query is required.");
  }

  const searchEntry = await SearchHistory.create({
    userId,
    query: query.trim(),
  });

  return res
    .status(201)
    .json(
      new apiResponse(201, searchEntry, "Search history saved successfully.")
    );
});

// Get search history for a user
const getUserSearchHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Assuming authenticated user information is available in `req.user`

  const searchHistory = await SearchHistory.find({ userId })
    .sort({ createdAt: -1 }) // Sort by most recent
    .limit(20); // Limit to the latest 20 searches

  if (!searchHistory.length) {
    throw new apiError(404, "No search history found.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        searchHistory,
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
