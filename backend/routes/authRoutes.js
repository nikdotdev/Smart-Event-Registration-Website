import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Apply per-route rate limiters to protect auth endpoints.
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/me", authMiddleware, getMe);

export default router;
