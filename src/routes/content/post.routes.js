import express from "express";
import {
  createPost,
  updatePost,
  getAllPosts,
  getPostById,
  deletePostById,
} from "../../controllers/content/post.controllers.js";
import { upload } from "../../middlewares/multer.middlewares.js";
import verifyJWT from "../../middlewares/auth.middlewares.js";

const router = express.Router();

router
  .route("/")
  .post(verifyJWT, upload.fields([{ name: "media", maxCount: 1 }]), createPost);

router.route("/").get(getAllPosts);

router
  .route("/:postId")
  .patch(verifyJWT, upload.fields([{ name: "media", maxCount: 1 }]), updatePost)
  .delete(verifyJWT, deletePostById);

router.route("/:postId").get(getPostById);

export default router;
