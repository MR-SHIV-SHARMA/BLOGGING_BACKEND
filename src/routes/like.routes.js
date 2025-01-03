import express from "express";
import { addLike } from "../controllers/like.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Add a like for a post
router.route("/post/:postId").post(addLike);

export default router;
