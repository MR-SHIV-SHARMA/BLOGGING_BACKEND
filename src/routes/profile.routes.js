import express from "express";
import {
  createOrUpdateProfile,
  getProfile,
  getAllProfiles,
  deleteProfile,
} from "../controllers/profile.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Create or update a profile
router.route("/").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  createOrUpdateProfile
);

// Get all profiles
router.route("/").get(getAllProfiles);

// Get a specific profile
router.route("/:username").get(getProfile);

// Delete a profile
router.route("/").delete(deleteProfile);

export default router;
