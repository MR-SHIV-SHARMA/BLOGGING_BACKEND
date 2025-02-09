import { apiError } from "../../../utils/apiError.js";
import { apiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Profile } from "../../../Models/profile.models.js";
import { uploadFileToCloudinary } from "../../../utils/cloudinary.js";

// Update User Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError(404, "Avatar file is missing");
  }

  const user = await Profile.findById(req.user.profile._id);

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const oldAvatarUrl = user.avatar;

  try {
    const newAvatar = await uploadFileToCloudinary(
      avatarLocalPath,
      oldAvatarUrl
    );

    // Ensure that newAvatar is valid and has a URL
    if (!newAvatar || !newAvatar.url) {
      throw new apiError(400, "Error while uploading avatar");
    }

    const updatedUser = await Profile.findByIdAndUpdate(
      req.user.profile._id,
      { $set: { avatar: newAvatar.url } },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new apiResponse(200, updatedUser, "Avatar image updated successfully")
      );
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new apiError(500, "Internal server error during avatar upload");
  }
});

// Update User Cover Image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new apiError(400, "Cover image file is missing");
  }

  const user = await Profile.findById(req.user.profile._id);

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
    req.user.profile._id,
    { $set: { coverImage: newCoverImage.url } },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

// Update Profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, location, hobbies, bio, link, socialMedia } = req.body;

  const update = {
    ...(fullname && { fullname }),
    ...(location && { location }),
    ...(hobbies && { hobbies }),
    ...(bio && { bio }),
    ...(link && { link }),
    ...(socialMedia && { socialMedia }),
  };

  const user = await Profile.findById(req.user.profile._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const profile = await Profile.findByIdAndUpdate(
    req.user.profile._id, // Corrected from findOneAndUpdate to findByIdAndUpdate
    update,
    { new: true }
  );

  if (!profile) {
    throw new apiError(404, "Profile not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, profile, "Profile updated successfully."));
});

export { updateUserAvatar, updateUserCoverImage, updateProfile };
