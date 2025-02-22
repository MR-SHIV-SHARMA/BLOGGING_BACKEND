import { Router } from "express";
import {
  resetPassword,
  changeCurrentPassword,
  forgotPassword,
  resetPasswordWithToken,
} from "../../../controllers/user/auth/password.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";

const router = Router();

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/forgot-password").post(forgotPassword);

router
  .route("/reset-password/:token")
  .get(resetPasswordWithToken)
  .post(resetPasswordWithToken);

export default router;
