import { Tag } from "../Models/tag.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new tag
const createTag = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    throw new apiError(422, "Tag name is required.");
  }

  const existingTag = await Tag.findOne({ name: name.trim() });
  if (existingTag) {
    throw new apiError(409, "Tag already exists.");
  }

  const tag = await Tag.create({ name: name.trim() });

  return res
    .status(201)
    .json(new apiResponse(201, tag, "Tag created successfully."));
});

// Get all tags
const getAllTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find().sort({ name: 1 }); // Sorted alphabetically

  if (!tags.length) {
    throw new apiError(404, "No tags found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, tags, "Tags fetched successfully."));
});

// Get a tag by ID
const getTagById = asyncHandler(async (req, res) => {
  const { tagId } = req.params;

  if (!mongoose.isValidObjectId(tagId)) {
    throw new apiError(400, "Invalid tag ID.");
  }

  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw new apiError(404, "Tag not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, tag, "Tag fetched successfully."));
});

// Update a tag by ID
const updateTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  const { name } = req.body;

  if (!mongoose.isValidObjectId(tagId)) {
    throw new apiError(400, "Invalid tag ID.");
  }

  if (!name || name.trim() === "") {
    throw new apiError(422, "Tag name is required.");
  }

  const existingTag = await Tag.findOne({ name: name.trim() });
  if (existingTag && existingTag._id.toString() !== tagId) {
    throw new apiError(409, "Tag with this name already exists.");
  }

  const updatedTag = await Tag.findByIdAndUpdate(
    tagId,
    { name: name.trim() },
    { new: true }
  );

  if (!updatedTag) {
    throw new apiError(404, "Tag not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedTag, "Tag updated successfully."));
});

// Delete a tag by ID
const deleteTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;

  if (!mongoose.isValidObjectId(tagId)) {
    throw new apiError(400, "Invalid tag ID.");
  }

  const deletedTag = await Tag.findByIdAndDelete(tagId);

  if (!deletedTag) {
    throw new apiError(404, "Tag not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, deletedTag, "Tag deleted successfully."));
});

export { createTag, getAllTags, getTagById, updateTag, deleteTag };
