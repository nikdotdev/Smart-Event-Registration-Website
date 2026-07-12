import express from "express";
import {
  registerForEvent,
  getUserEvents,
  cancelRegistration,
  getEventRegistrations,
} from "../controllers/registrationController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";
import { eventRegistrationLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Throttle event registrations per IP to avoid spam and bot registrations.
router.post(
  "/:id/register",
  authMiddleware,
  eventRegistrationLimiter,
  registerForEvent
);
router.delete("/:id/cancel", authMiddleware, cancelRegistration);
router.get(
  "/event/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  getEventRegistrations
);

// This should come after more specific routes to avoid conflicts
router.get("/", authMiddleware, getUserEvents);

export default router;
