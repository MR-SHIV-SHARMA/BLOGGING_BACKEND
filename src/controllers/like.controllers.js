import { Like } from "../Models/like.models.js";
import { Post } from "../Models/post.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// Add a Like to a Post
const addLike = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  console.log("Request Body:", req.body);
  console.log("Request Params:", req.params);
  console.log("User ID:", userId);

  if (!userId || !postId) {
    console.error("Validation Error: Missing required fields");
    console.log("userId:", userId);
    console.log("postId:", postId);
    throw new apiError(422, "A valid userId and postId are required.");
  }

  // Check if the like already exists
  const existingLike = await Like.findOne({ userId, postId });
  if (existingLike) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "You have already liked this post."));
  }

  const likeData = { userId, postId };

  console.log("Like Data:", likeData);

  const like = await Like.create(likeData);

  // Update the post to include the like reference
  await Post.findByIdAndUpdate(postId, { $push: { likes: like._id } });

  return res
    .status(201)
    .json(new apiResponse(201, like, "Like added successfully."));
});

// Remove a Like
const removeLike = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  console.log("Request Params:", req.params);
  console.log("User ID:", userId);

  if (!userId || !postId) {
    console.error("Validation Error: Missing required fields");
    console.log("userId:", userId);
    console.log("postId:", postId);
    throw new apiError(422, "A valid userId and postId are required.");
  }

  // Find the like to be removed
  const like = await Like.findOneAndDelete({ userId, postId });

  if (!like) {
    throw new apiError(404, "Like not found.");
  }

  // Update the post to remove the like reference
  await Post.findByIdAndUpdate(postId, { $pull: { likes: like._id } });

  return res
    .status(200)
    .json(new apiResponse(200, like, "Like removed successfully."));
});

// Get Likes for a Post
const getLikesForPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    throw new apiError(400, "A valid postId is required.");
  }

  const likes = await Like.find({ postId }).populate("userId", "name");
  const likeCount = await Like.countDocuments({ postId });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { likes, likeCount },
        "Likes retrieved successfully."
      )
    );
});

export { addLike, removeLike, getLikesForPost };
