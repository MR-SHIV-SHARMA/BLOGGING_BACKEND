// production
export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
};

// local development
// export const cookieOptions = {
//   httpOnly: false,
//   secure: false,
//   sameSite: "lax",
//   path: "/",
//   maxAge: 24 * 60 * 60 * 1000, // 24 hours
// };
