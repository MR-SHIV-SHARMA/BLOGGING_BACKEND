import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  refreshAccessToken,
} from "../../../controllers/user/auth/auth.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").get(refreshAccessToken);

router.route("/verify-email/:token").get(verifyEmail);

export default router;
