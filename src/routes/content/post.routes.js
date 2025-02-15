import express from "express";
import {
  createPost,
  updatePost,
  getPostsByUser,
  getAllPosts,
  getPostById,
  deletePostById,
  getPostsByUserId,
} from "../../controllers/content/post.controllers.js";
import { upload } from "../../middlewares/multer.middlewares.js";
import verifyJWT from "../../middlewares/auth.middlewares.js";

const router = express.Router();

router
  .route("/")
  .post(verifyJWT, upload.fields([{ name: "media", maxCount: 1 }]), createPost);

router.route("/").get(getAllPosts);
router.route("/user/posts").get(verifyJWT, getPostsByUser);

router
  .route("/:postId")
  .patch(verifyJWT, upload.fields([{ name: "media", maxCount: 1 }]), updatePost)
  .delete(verifyJWT, deletePostById);

router.route("/:postId").get(getPostById);

router.route("/user/:userId/posts").get(getPostsByUserId); // New route added

export default router;
