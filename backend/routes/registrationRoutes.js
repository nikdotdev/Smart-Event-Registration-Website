import express from "express";
import {
  registerForEvent,
  getUserEvents,
  cancelRegistration,
  getEventRegistrations,
} from "../controllers/registrationController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/:id/register", authMiddleware, registerForEvent);
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
