import express from "express";
import {
  createSearchHistory,
  getUserSearchHistory,
  deleteSearchHistoryEntry,
  clearUserSearchHistory,
} from "../../../controllers/common/search/searchHistory.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT);

// Create a new search history entry
router.route("/").post(createSearchHistory);

// Get search history for a user
router.route("/").get(getUserSearchHistory);

// Clear all search history for a user
router.route("/clear").delete(clearUserSearchHistory);

// Delete a specific search history entry
router.route("/:historyId").delete(deleteSearchHistoryEntry);

export default router;
