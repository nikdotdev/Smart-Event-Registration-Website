import Ticket from "../models/Ticket.js";
import { generateQRCodeBuffer } from "../utils/qrCodeUtil.js";
import { ensureTicketForRegistration } from "../utils/ticketService.js";

export const generateTicket = async (req, res) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: "registrationId is required" });
    }

    const ticket = await ensureTicketForRegistration(registrationId);

    if (!ticket) {
      return res.status(404).json({
        message: "Registration not found or not eligible for a ticket",
      });
    }

    res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("userId", "fullName email")
      .populate("eventId", "name date location");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check authorization
    if (ticket.userId._id.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this ticket" });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.userId })
      .populate("eventId", "name date location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const validateTicket = async (req, res) => {
  try {
    const { ticketNumber, qrCode } = req.body;

    if (!ticketNumber && !qrCode) {
      return res
        .status(400)
        .json({ message: "Please provide ticket number or QR code" });
    }

    let query = {};
    if (ticketNumber) {
      query.ticketNumber = ticketNumber;
    } else if (qrCode) {
      query.qrCode = qrCode;
    }

    const ticket = await Ticket.findOne(query)
      .populate("userId", "fullName email")
      .populate("eventId", "name date location");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if ticket is valid
    const now = new Date();
    if (ticket.validUntil < now) {
      return res.status(400).json({ message: "Ticket has expired" });
    }

    if (ticket.status !== "active") {
      return res.status(400).json({ message: "Ticket is no longer active" });
    }

    res.status(200).json({
      success: true,
      ticket,
      isValid: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("eventId");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to download this ticket" });
    }

    // Generate QR code buffer for download
    const qrCodeBuffer = await generateQRCodeBuffer(ticket.qrCode);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ticket-${ticket.ticketNumber}.png`
    );
    res.send(qrCodeBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
