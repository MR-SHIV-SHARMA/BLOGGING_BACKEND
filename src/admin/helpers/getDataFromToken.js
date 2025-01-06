import jwt from "jsonwebtoken";

export const getDataFromToken = (request) => {
  try {
    // Extract token from cookies
    const token = request.cookies.get("token")?.value || "";
    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    // Return the user ID from decoded token
    return decodedToken.id;
  } catch (error) {
    throw new Error(error.message);
  }
};
