import express from "express";
import {
  updateUserAvatar,
  updateUserCoverImage,
  updateProfile,
} from "../../../controllers/user/profile/media.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";
import { upload } from "../../../middlewares/multer.middlewares.js";

const router = express.Router();

router.use(verifyJWT);

// Update User Avatar
router
  .route("/update-User-Avatar")
  .patch(upload.single("avatar"), updateUserAvatar);

// Update User Cover Image
router
  .route("/update-User-CoverImage")
  .patch(upload.single("coverImage"), updateUserCoverImage);

// Update a specific profile
router.route("/:username").patch(updateProfile);

export default router;
