import jwt from "jsonwebtoken";
import { User } from "../../../Models/user.models.js";
import { apiError } from "../../../utils/apiError.js";
import { apiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Profile } from "../../../Models/profile.models.js";
import { sendEmail } from "../../../helpers/mailer.js";
import { uploadFileToCloudinary } from "../../../utils/cloudinary.js";

const getProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  console.log(`Fetching profile for username: ${username}`);
  console.log(`Type of username: ${typeof username}`);
  console.log(`Length of username: ${username.length}`);

  // Fetch profile using the username field
  const profile = await Profile.findOne({ username })
    .populate("user", "username email")
    .populate("savedPost", "name")
    .populate("follower", "name")
    .populate("following");

  if (!profile) {
    console.error(`Profile not found for username: ${username}`);
    throw new apiError(404, "Profile not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, profile, "Profile fetched successfully."));
});

// Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: "fullname",
      select: "fullname",
      model: "Profile",
    })
    .populate({
      path: "avatar",
      select: "avatar",
      model: "Profile",
    })
    .populate({
      path: "coverImage",
      select: "coverImage",
      model: "Profile",
    });

  // Fetch the profile data
  const profile = await Profile.findOne({ user: req.user._id });

  // Extract the URLs from the populated fields
  const userData = {
    ...user.toObject(),
    avatar: profile?.avatar || null,
    coverImage: profile?.coverImage || null,
    fullname: profile?.fullname || null,
  };

  return res
    .status(200)
    .json(new apiResponse(200, userData, "Current user fetched successfully"));
});

// Get User Follow Profile
const getUserFollowProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  // Validate username input
  if (!username?.trim()) {
    throw new apiError(403, "Invalid username");
  }

  // Aggregate user data with followers and following counts
  const followProfile = await User.aggregate([
    { $match: { username: username.toLowerCase() } },
    {
      $lookup: {
        from: "follows",
        localField: "_id",
        foreignField: "followingId",
        as: "followers",
      },
    },
    {
      $lookup: {
        from: "follows",
        localField: "_id",
        foreignField: "followerId",
        as: "following",
      },
    },
    {
      $addFields: {
        followersCount: { $size: "$followers" },
        followingCount: { $size: "$following" },
        // Check if the current user follows this user
        isFollow: {
          $in: [req.user?._id, "$followers.followerId"],
        },
        // Check if this user follows the current user
        isFollowedByCurrentUser: {
          $in: [req.user?._id, "$following.followingId"],
        },
      },
    },
    {
      $project: {
        username: 1,
        followersCount: 1,
        followingCount: 1,
        isFollow: 1,
        isFollowedByCurrentUser: 1,
        email: 1,
      },
    },
  ]);

  // Check if the user exists
  if (!followProfile?.length) {
    throw new apiError(400, "User does not exist");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        followProfile[0],
        "User follow profile fetched successfully"
      )
    );
});

export { getProfile, getCurrentUser, getUserFollowProfile };
