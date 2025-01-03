import express from "express";
import {
  createProfile,
  // updateUserAvatar,
  // updateUserCoverImage,
  getProfile,
} from "../controllers/profile.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Create or update a profile
router.route("/").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  createProfile
);

// Get a specific profile
router.route("/:username").get(getProfile);

// router
//   .route("/update-User-Avatar")
//   .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// router
//   .route("/update-User-CoverImage")
//   .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

export default router;
