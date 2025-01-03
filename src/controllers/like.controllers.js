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

  const likeData = { userId, postId };

  console.log("Like Data:", likeData);

  const like = await Like.create(likeData);

  // Update the post to include the like reference
  await Post.findByIdAndUpdate(postId, { $push: { likes: like._id } });

  return res
    .status(201)
    .json(new apiResponse(201, like, "Like added successfully."));
});

export { addLike };
