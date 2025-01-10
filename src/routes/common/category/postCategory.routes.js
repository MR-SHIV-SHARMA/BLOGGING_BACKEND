import express from "express";
import { getPostsByCategory } from "../../../controllers/common/category/posts.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT);

// Get posts by category
router.route("/:categoryId/posts").get(getPostsByCategory);

export default router;
