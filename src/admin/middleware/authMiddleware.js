import jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.models.js";

const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new apiError(401, "Access token is missing"));
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.admin = await Admin.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!req.admin) {
      return next(new apiError(401, "Invalid token"));
    }

    next();
  } catch (error) {
    return next(new apiError(401, "Invalid token"));
  }
});

export default authenticateAdmin;
