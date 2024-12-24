import { Follow } from "../Models/follow.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// Follow a User
const followUser = asyncHandler(async (req, res) => {
  const { followerId, followingId } = req.body;

  if (!followerId || !followingId) {
    throw new apiError(422, "Both follower ID and following ID are required.");
  }

  // Check if the following relationship already exists
  const existingFollow = await Follow.findOne({ followerId, followingId });
  if (existingFollow) {
    throw new apiError(409, "You are already following this user.");
  }

  const follow = await Follow.create({
    followerId,
    followingId,
  });

  return res
    .status(201)
    .json(new apiResponse(201, follow, "You are now following this user."));
});

// Unfollow a User
const unfollowUser = asyncHandler(async (req, res) => {
  const { followerId, followingId } = req.body;

  if (!followerId || !followingId) {
    throw new apiError(422, "Both follower ID and following ID are required.");
  }

  const unfollow = await Follow.findOneAndDelete({ followerId, followingId });

  if (!unfollow) {
    throw new apiError(404, "Follow relationship not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, unfollow, "You have unfollowed this user."));
});

// Get Followers of a User
const getFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "User ID is required.");
  }

  const followers = await Follow.find({ followingId: userId }).populate(
    "followerId"
  );

  return res
    .status(200)
    .json(new apiResponse(200, followers, "Followers retrieved successfully."));
});

// Get Following of a User
const getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "User ID is required.");
  }

  const following = await Follow.find({ followerId: userId }).populate(
    "followingId"
  );

  return res
    .status(200)
    .json(
      new apiResponse(200, following, "Following users retrieved successfully.")
    );
});

export { followUser, unfollowUser, getFollowers, getFollowing };
