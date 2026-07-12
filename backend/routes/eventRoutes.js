import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";
import { eventCreationLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/", getAllEvents);
router.get("/:id", getEventById);

// Rate limit event creation to avoid abusive or accidental mass-creation.
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  eventCreationLimiter,
  createEvent
);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateEvent);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteEvent);

export default router;
