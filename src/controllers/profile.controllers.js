import { Profile } from "../Models/profile.models.js";
import { User } from "../Models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const createProfile = asyncHandler(async (req, res) => {
  const { fullname, location, hobbies, bio, link, socialMedia } = req.body;

  if (!fullname || !location || !hobbies || !bio || !link || !socialMedia) {
    throw new apiError(422, "All fields are required.");
  }

  // Process uploaded files
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  // Upload to Cloudinary
  const avatar = avatarLocalPath
    ? await uploadFileToCloudinary(avatarLocalPath)
    : null;
  const coverImage = coverImageLocalPath
    ? await uploadFileToCloudinary(coverImageLocalPath)
    : null;

  const profile = await Profile.create({
    user: req.user._id, // Reference to User's ObjectId
    username: req.user.username, // Ensure this is a string
    fullname,
    location,
    hobbies,
    bio,
    link,
    socialMedia,
    avatar: avatar?.url || undefined,
    coverImage: coverImage?.url || undefined,
  });

  return res
    .status(201)
    .json(new apiResponse(201, profile, "Profile created successfully."));
});

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

export { createProfile, getProfile };
