import { Profile } from "../Models/profile.models.js";
import { User } from "../Models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";

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

// Update a profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, location, hobbies, bio, link, socialMedia } = req.body;

  // Ensure required fields are provided
  if (
    [fullname, location, hobbies, bio, link, socialMedia].some(
      (field) => !field?.trim()
    )
  ) {
    throw new apiError(422, "Please fill in all the required fields");
  }

  const update = {
    fullname,
    location,
    hobbies,
    bio,
    link,
    socialMedia,
  };

  const profile = await Profile.findOneAndUpdate(
    { username: req.user.username },
    update,
    {
      new: true, // Return the updated document
    }
  );

  if (!profile) {
    throw new apiError(500, "Failed to update the profile");
  }

  return res.status(200).json(
    new apiResponse(
      200,
      {
        fullname: profile.fullname,
        location: profile.location,
        hobbies: profile.hobbies,
        bio: profile.bio,
        link: profile.link,
        socialMedia: profile.socialMedia,
      },
      "Profile updated successfully."
    )
  );
});

// Update User Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError(404, "Avatar file is missing");
  }

  const user = await Profile.findOne({ user: req.user._id });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const oldAvatarUrl = user.avatar;

  const newAvatar = await uploadFileToCloudinary(avatarLocalPath, oldAvatarUrl);

  if (!newAvatar.url) {
    throw new apiError(400, "Error while uploading avatar");
  }

  const updatedUser = await Profile.findOneAndUpdate(
    { user: req.user._id },
    { $set: { avatar: newAvatar.url } },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedUser, "Avatar image updated successfully")
    );
});

// Update User Cover Image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new apiError(404, "Cover image file is missing");
  }

  const user = await Profile.findById(req.profile._id);

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const oldCoverImageUrl = user.coverImage;

  const newCoverImage = await uploadFileToCloudinary(
    coverImageLocalPath,
    oldCoverImageUrl
  );

  if (!newCoverImage.url) {
    throw new apiError(400, "Error while uploading cover image");
  }

  const updatedUser = await Profile.findByIdAndUpdate(
    req.profile._id,
    { $set: { coverImage: newCoverImage.url } },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

export {
  createProfile,
  getProfile,
  updateProfile,
  updateUserAvatar,
  updateUserCoverImage,
};
