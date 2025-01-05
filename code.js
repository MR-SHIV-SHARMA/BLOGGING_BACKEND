// Delete a post by ID
const deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a comment by ID
const deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a user by ID
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new category
const addCategory = async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




// Delete a post by ID
router.delete(
  "/post/:id",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  deletePost
);

// Delete a comment by ID
router.delete(
  "/comment/:id",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  deleteComment
);

// Delete a user by ID
router.delete(
  "/user/:id",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  deleteUser
);

// Add a new category
router.post(
  "/category",
  adminRateLimiter,
  authenticateAdmin,
  checkRole(["admin", "super-admin"]),
  addCategory
);
