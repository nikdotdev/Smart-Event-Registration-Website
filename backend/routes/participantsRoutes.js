import express from "express";
import {
  getParticipants,
  deleteParticipant,
  exportParticipantsCSV,
  generateEventReportPDF,
  generateParticipantReportPDF,
} from "../controllers/participantsController.js";
import { protect, checkAdmin } from "../middleware/advancedAuth.js";

const router = express.Router();

// Admin routes
router.get("/event/:eventId", protect, checkAdmin, getParticipants);
router.delete("/:registrationId", protect, checkAdmin, deleteParticipant);
router.get("/export/csv/:eventId", protect, checkAdmin, exportParticipantsCSV);
router.get(
  "/report/event/:eventId",
  protect,
  checkAdmin,
  generateEventReportPDF
);
router.get(
  "/report/participants/:eventId",
  protect,
  checkAdmin,
  generateParticipantReportPDF
);

export default router;
