export const checkRole = (roles) => (req, res, next) => {
  console.log("req.admin:", req.admin); // Add this line to log req.admin
  if (!req.admin || !roles.includes(req.admin.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
