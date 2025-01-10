import jwt from "jsonwebtoken";
// import { User } from "../../../Models/user.models.js";
import { apiError } from "../../../utils/apiError.js";
import { apiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Profile } from "../../../Models/profile.models.js";
// import { sendEmail } from "../../../helpers/mailer.js";
import { uploadFileToCloudinary } from "../../../utils/cloudinary.js";

// Update User Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError(404, "Avatar file is missing");
  }

  const user = await Profile.findById(req.profile._id);

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const oldAvatarUrl = user.avatar;

  const newAvatar = await uploadFileToCloudinary(avatarLocalPath, oldAvatarUrl);

  if (!newAvatar.url) {
    throw new apiError(400, "Error while uploading avatar");
  }

  const updatedUser = await Profile.findByIdAndUpdate(
    req.profile._id,
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

// Update a profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, location, hobbies, bio, link, socialMedia } = req.body;

  // सभी फील्ड्स ऑप्शनल हैं, इसलिए वैलिडेशन हटा दिया
  const update = {
    ...(fullname && { fullname }),
    ...(location && { location }),
    ...(hobbies && { hobbies }),
    ...(bio && { bio }),
    ...(link && { link }),
    ...(socialMedia && { socialMedia }),
  };

  const profile = await Profile.findOneAndUpdate(
    { username: req.user.username },
    update,
    {
      new: true,
    }
  );

  if (!profile) {
    throw new apiError(404, "Profile not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, profile, "Profile updated successfully."));
});

export { updateUserAvatar, updateUserCoverImage, updateProfile };
