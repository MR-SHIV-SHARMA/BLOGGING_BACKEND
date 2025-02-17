import { Category } from "../../../Models/category.models.js";
import { Post } from "../../../Models/post.models.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { apiError } from "../../../utils/apiError.js";
import { apiResponse } from "../../../utils/apiResponse.js";

// Get Posts by Category
const getPostsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  if (!categoryId) {
    throw new apiError(400, "Category ID is required.");
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new apiError(404, "Category not found.");
  }

  const posts = await Post.find({ categories: categoryId }).populate(
    "categories tags"
  );

  return res
    .status(200)
    .json(new apiResponse(200, posts, "Posts retrieved successfully."));
});

export { getPostsByCategory };
