import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getUserFollowProfile,
  verifyEmail,
  forgotPassword,
  resetPasswordWithToken,
  deleteUserAccount,
  restoreAccount,
} from "../controllers/user.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").post(verifyJWT, getCurrentUser);

router.route("/update-Account-Details").patch(verifyJWT, updateAccountDetails);

router.route("/f/:username").get(verifyJWT, getUserFollowProfile);

router.route("/verify-email").get(verifyEmail);

router.route("/forgot-password").post(forgotPassword);

router
  .route("/reset-password")
  .get(resetPasswordWithToken)
  .post(resetPasswordWithToken);

router.route("/delete-account").delete(verifyJWT, deleteUserAccount);

router.route("/restore-account/:token").get(restoreAccount);

export default router;
