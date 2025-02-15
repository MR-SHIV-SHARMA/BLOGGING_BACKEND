import { Router } from "express";
import {
  getProfile,
  getCurrentUser,
  getUserFollowProfile,
  getUserProfileById,
} from "../../../controllers/user/profile/view.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";

const router = Router();

// // Get a specific profile
router.route("/").get(verifyJWT, getProfile);

router.route("/:userId").get(getUserProfileById);

router.route("/current-user").post(verifyJWT, getCurrentUser);

router.route("/f/:userId").get(verifyJWT, getUserFollowProfile);

export default router;
