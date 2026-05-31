import express from "express";
import {
  checkInWithQR,
  checkOut,
  getAttendanceReport,
  getAttendanceByEvent,
  markNoShow,
} from "../controllers/attendanceController.js";
import { protect, checkAdmin } from "../middleware/advancedAuth.js";

const router = express.Router();

// Check-in route (can be public or protected)
router.post("/check-in", protect, checkInWithQR);
router.post("/check-out", protect, checkOut);

// Admin routes
router.get("/event/:eventId", protect, checkAdmin, getAttendanceByEvent);
router.get("/report/:eventId", protect, checkAdmin, getAttendanceReport);
router.put("/mark-no-show", protect, checkAdmin, markNoShow);

export default router;
