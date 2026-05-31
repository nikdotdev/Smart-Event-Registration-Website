import express from "express";
import {
  generateTicket,
  getTicket,
  getMyTickets,
  validateTicket,
  downloadTicket,
} from "../controllers/ticketController.js";
import { protect } from "../middleware/advancedAuth.js";

const router = express.Router();

// Public route for validation
router.post("/validate", validateTicket);

// Protected routes
router.post("/", protect, generateTicket);
router.get("/my-tickets", protect, getMyTickets);
router.get("/:id", protect, getTicket);
router.get("/:id/download", protect, downloadTicket);

export default router;
