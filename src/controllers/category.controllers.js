import { Category } from "../Models/category.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// Create a Category
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new apiError(422, "Category name is required.");
  }

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    throw new apiError(409, "Category already exists.");
  }

  const category = await Category.create({
    name,
    description,
  });

  return res
    .status(201)
    .json(new apiResponse(201, category, "Category created successfully."));
});

// Get All Categories
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();

  return res
    .status(200)
    .json(
      new apiResponse(200, categories, "Categories retrieved successfully.")
    );
});

// Get Category by ID
const getCategoryById = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  if (!categoryId) {
    throw new apiError(400, "Category ID is required.");
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new apiError(404, "Category not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, category, "Category retrieved successfully."));
});

// Update a Category
const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new apiError(422, "Category name is required.");
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { name, description },
    { new: true }
  );

  if (!updatedCategory) {
    throw new apiError(404, "Category not found.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedCategory, "Category updated successfully.")
    );
});

// Delete a Category
const deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  if (!categoryId) {
    throw new apiError(400, "Category ID is required.");
  }

  const deletedCategory = await Category.findByIdAndDelete(categoryId);

  if (!deletedCategory) {
    throw new apiError(404, "Category not found.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, deletedCategory, "Category deleted successfully.")
    );
});

export {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};