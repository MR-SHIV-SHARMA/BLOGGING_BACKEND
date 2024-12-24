import { Profile } from "../Models/profile.models.js";
import { User } from "../Models/user.models.js";
import { Post } from "../Models/post.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";

// Create or update a profile
const createOrUpdateProfile = asyncHandler(async (req, res) => {
  const { fullName, location, hobise, bio, link, socialmidiya } = req.body;
  const userId = req.user._id; // Assuming user info is available in req.user

  const avatarPath = req.files?.avatar?.[0]?.path;
  const coverImagePath = req.files?.coverImage?.[0]?.path;

  const avatarUpload = avatarPath
    ? await uploadFileToCloudinary(avatarPath)
    : null;
  const coverImageUpload = coverImagePath
    ? await uploadFileToCloudinary(coverImagePath)
    : null;

  const profileData = {
    fullName,
    location,
    hobise,
    bio,
    link,
    socialmidiya,
    avatar: avatarUpload?.url,
    coverImage: coverImageUpload?.url,
  };

  // Find existing profile or create a new one
  const profile = await Profile.findOneAndUpdate(
    { username: userId },
    { $set: profileData },
    { new: true, upsert: true }
  );

  return res
    .status(201)
    .json(
      new apiResponse(201, profile, "Profile created/updated successfully.")
    );
});

// Get profile by username
const getProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const profile = await Profile.findOne({ username })
    .populate("username", "username email")
    .populate("savedPost", "title")
    .populate("follower", "username")
    .populate("following", "username");

  if (!profile) {
    throw new apiError(404, "Profile not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, profile, "Profile fetched successfully."));
});

// Get all profiles
const getAllProfiles = asyncHandler(async (req, res) => {
  const profiles = await Profile.find()
    .populate("username", "username email")
    .populate("follower", "username")
    .populate("following", "username");

  if (!profiles.length) {
    throw new apiError(404, "No profiles found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, profiles, "All profiles fetched successfully."));
});

// Delete a profile
const deleteProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Assuming user info is available in req.user

  const profile = await Profile.findOneAndDelete({ username: userId });

  if (!profile) {
    throw new apiError(404, "Profile not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, profile, "Profile deleted successfully."));
});

export { createOrUpdateProfile, getProfile, getAllProfiles, deleteProfile };
