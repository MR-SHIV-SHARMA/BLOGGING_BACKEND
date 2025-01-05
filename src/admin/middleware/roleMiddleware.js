export const checkRole = (roles) => (req, res, next) => {
  console.log("req.admin:", req.admin); // Add this line to log req.admin
  console.log("Required roles:", roles); // Add this line to log the required roles
  if (!req.admin || !roles.includes(req.admin.role)) {
    console.log("Access denied for role:", req.admin ? req.admin.role : "No admin"); // Add this line to log the denied role
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
