import { Router } from "express";
import {
  getProfile,
  getCurrentUser,
  getUserFollowProfile,
} from "../../../controllers/user/profile/view.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";

const router = Router();

// // Get a specific profile
router.route("/:username").get(verifyJWT, getProfile);

router.route("/current-user").post(verifyJWT, getCurrentUser);

router.route("/f/:username").get(verifyJWT, getUserFollowProfile);

export default router;
