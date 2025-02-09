import express from "express";
import {
  updateUserAvatar,
  updateUserCoverImage,
  updateProfile,
} from "../../../controllers/user/profile/media.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";
import { upload } from "../../../middlewares/multer.middlewares.js";

const router = express.Router();

// Protect all routes with JWT verification middleware
router.use(verifyJWT);

// Update User Avatar
router.route("/update-avatar").patch(upload.single("avatar"), updateUserAvatar);

// Update User Cover Image
router
  .route("/update-cover-image")
  .patch(upload.single("coverImage"), updateUserCoverImage);

// Update a specific profile by username
router.route("/").patch(updateProfile);

export default router;
