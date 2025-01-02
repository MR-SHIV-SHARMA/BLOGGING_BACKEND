import express from "express";
import {
  createPost,
  updatePost,
  getAllPosts,
  getPostById,
  deletePostById,
} from "../controllers/post.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .post(upload.fields([{ name: "media", maxCount: 1 }]), createPost)
  .get(getAllPosts);

router
  .route("/:postId")
  .get(getPostById)
  .patch(upload.fields([{ name: "media", maxCount: 1 }]), updatePost)
  .delete(deletePostById);

export default router;
