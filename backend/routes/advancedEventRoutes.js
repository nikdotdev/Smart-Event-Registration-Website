import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventCategories,
  getEventAnalytics,
} from "../controllers/advancedEventController.js";
import { protect, checkAdmin } from "../middleware/advancedAuth.js";
import { cacheEventDetails, cacheEventsList } from "../middleware/cache.js";
import { eventCreationLimiter } from "../middleware/rateLimiter.js";
import { uploadEventImage } from "../utils/uploadUtil.js";

const router = express.Router();

// Public routes
router.get("/", cacheEventsList, getAllEvents);
router.get("/categories", getEventCategories);
router.get("/:id/analytics", getEventAnalytics);
router.get("/:id", cacheEventDetails, getEventById);

// Protected routes (admin creates events; creator or admin can update/delete)
router.post(
  "/",
  protect,
  checkAdmin,
  eventCreationLimiter,
  uploadEventImage.single("image"),
  createEvent
);
router.put("/:id", protect, uploadEventImage.single("image"), updateEvent);
router.delete("/:id", protect, deleteEvent);

export default router;
