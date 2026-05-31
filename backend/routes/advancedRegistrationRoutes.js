import express from "express";
import {
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
  cancelRegistration,
  getEventRegistrations,
} from "../controllers/advancedRegistrationController.js";
import { protect } from "../middleware/advancedAuth.js";

const router = express.Router();

// Protected routes (specific paths before /:id)
router.post("/", protect, registerForEvent);
router.get("/my-registrations", protect, getMyRegistrations);
router.get("/event/:eventId", protect, getEventRegistrations);
router.get("/:id", protect, getRegistrationById);
router.delete("/:id", protect, cancelRegistration);

export default router;
