import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized to access this route" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;

    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.userId).select("role");
    req.userRole = user?.role || "user";

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Not authorized to access this route" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res
        .status(403)
        .json({ message: "User role not authorized to access this route" });
    }
    next();
  };
};

export const checkAdmin = async (req, res, next) => {
  try {
    // Get user role from database
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.userRole = user.role;
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
};
