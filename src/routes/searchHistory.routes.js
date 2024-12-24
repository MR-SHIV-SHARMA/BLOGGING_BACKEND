import express from "express";
import {
  createSearchHistory,
  getUserSearchHistory,
  deleteSearchHistoryEntry,
  clearUserSearchHistory,
} from "../controllers/searchHistory.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Save a search query
router.route("/").post(createSearchHistory);

// Get search history for the user
router.route("/").get(getUserSearchHistory);

// Delete a specific search history entry
router.route("/:historyId").delete(deleteSearchHistoryEntry);

// Clear all search history for the user
router.route("/clear").delete(clearUserSearchHistory);

export default router;
