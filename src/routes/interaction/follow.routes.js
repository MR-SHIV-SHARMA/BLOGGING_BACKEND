import express from "express";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../../controllers/interaction/follow.controllers.js";
import verifyJWT from "../../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Follow a user
router.route("/follow/:followUserId").post(followUser);

// Unfollow a user
router.route("/unfollow/:followUserId").post(unfollowUser);

// Get followers of a user
router.route("/followers/:userId").get(getFollowers);

// Get following of a user
router.route("/following/:userId").get(getFollowing);

export default router;
