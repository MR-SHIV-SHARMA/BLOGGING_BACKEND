import express from "express";
import {
  uploadMedia,
  getAllMedia,
  getMediaById,
  deleteMedia,
  getMediaByPostId,
  getMediaByCommentId,
} from "../controllers/media.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Upload media
router.route("/").post(uploadMedia);

// Get all media
router.route("/").get(getAllMedia);

// Get media by ID
router.route("/:mediaId").get(getMediaById);

// Delete media
router.route("/:mediaId").delete(deleteMedia);

// Get media by post ID
router.route("/post/:postId").get(getMediaByPostId);

// Get media by comment ID
router.route("/comment/:commentId").get(getMediaByCommentId);

export default router;
