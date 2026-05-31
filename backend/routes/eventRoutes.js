import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllEvents);
router.get("/:id", getEventById);

router.post("/", authMiddleware, roleMiddleware(["admin"]), createEvent);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateEvent);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteEvent);

export default router;
