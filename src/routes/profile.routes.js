import express from "express";
import {
  getProfile,
  updateUserAvatar,
  updateUserCoverImage,
  updateProfile,
} from "../controllers/profile.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { Profile } from "../Models/profile.models.js";

const router = express.Router();

router.use(verifyJWT);

// Middleware to set req.profile
const setProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      throw new Error("Profile not found");
    }
    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
};

// // Get a specific profile
router.route("/:username").get(getProfile);

// Update User Avatar
router
  .route("/update-User-Avatar")
  .patch(setProfile, upload.single("avatar"), updateUserAvatar);

// Update User Cover Image
router
  .route("/update-User-CoverImage")
  .patch(setProfile, upload.single("coverImage"), updateUserCoverImage);

// Update a specific profile
router.route("/:username").patch(updateProfile);

export default router;
