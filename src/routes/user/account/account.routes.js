import { Router } from "express";
import {
  updateAccountDetails,
  deleteUserAccount,
  restoreAccount,
  requestAccountRestoration,
} from "../../../controllers/user/account/account.controllers.js";
import verifyJWT from "../../../middlewares/auth.middlewares.js";

const router = Router();

router.route("/update-Account-Details").patch(verifyJWT, updateAccountDetails);

router.route("/delete-account").delete(verifyJWT, deleteUserAccount);

router.route("/restore-account/:token").get(restoreAccount);

router.route("/request-restoration").post(requestAccountRestoration);

export default router;
