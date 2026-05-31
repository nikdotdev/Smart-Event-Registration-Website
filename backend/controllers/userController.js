import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { sendWelcomeEmail } from "../utils/emailUtil.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

const formatUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || "",
  bio: user.bio || "",
  avatar: user.avatar,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  theme: user.theme,
  createdAt: user.createdAt,
});

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, fullName);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, bio, avatar } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Please provide all password fields" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const user = await User.findById(req.userId).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setTheme = async (req, res) => {
  try {
    const { theme } = req.body;

    if (!["light", "dark"].includes(theme)) {
      return res.status(400).json({ message: "Invalid theme" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { theme },
      { new: true }
    );

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file" });
    }

    const avatar = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
