import { Post } from "../../Models/post.models.js";
import { Comment } from "../../Models/comment.models.js";
import { User } from "../../Models/user.models.js";
import { Category } from "../../Models/category.models.js";
import { ActivityLog } from "../models/activityLog.models.js";

// Delete a post by ID
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted post ${req.params.id}`,
    });
    res.status(200).json({
      message: "Post deleted successfully",
      post: {
        id: post._id,
        title: post.title,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a comment by ID
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted comment ${req.params.id}`,
    });
    res.status(200).json({
      message: "Comment deleted successfully",
      comment: {
        id: comment._id,
        content: comment.content,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a user by ID
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted user ${req.params.id}`,
    });
    res.status(200).json({
      message: "User deleted successfully",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new category
const addCategory = async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Added category ${newCategory.name}`,
    });
    res.status(201).json({
      message: "Category added successfully",
      category: {
        id: newCategory._id,
        name: newCategory.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a category by ID
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await ActivityLog.create({
      adminId: req.admin._id,
      action: `Deleted category ${id}`,
    });

    res.status(200).json({
      message: "Category deleted successfully",
      category: {
        id: category._id,
        name: category.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { deletePost, deleteComment, deleteUser, addCategory, deleteCategory };
