import express from "express";
import {
  getDashboardAnalytics,
  getEventStatistics,
  getRegistrationStatistics,
  getSystemMetrics,
} from "../controllers/dashboardController.js";
import { protect, checkAdmin } from "../middleware/advancedAuth.js";

const router = express.Router();

// Admin only routes
router.get("/analytics", protect, checkAdmin, getDashboardAnalytics);
router.get("/events-stats", protect, checkAdmin, getEventStatistics);
router.get(
  "/registrations-stats",
  protect,
  checkAdmin,
  getRegistrationStatistics
);
router.get("/metrics", protect, checkAdmin, getSystemMetrics);

export default router;
