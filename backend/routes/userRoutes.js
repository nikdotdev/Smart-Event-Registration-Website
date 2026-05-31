import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  setTheme,
  uploadUserAvatar,
} from "../controllers/userController.js";
import { protect } from "../middleware/advancedAuth.js";
import { uploadAvatar } from "../utils/uploadUtil.js";

const router = express.Router();

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post(
  "/avatar",
  protect,
  uploadAvatar.single("avatar"),
  uploadUserAvatar
);
router.put("/change-password", protect, changePassword);
router.put("/theme", protect, setTheme);

export default router;
