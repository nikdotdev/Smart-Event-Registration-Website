import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import {
  sendRegistrationEmail,
  sendCancellationEmail,
} from "../utils/emailUtil.js";
import { ensureTicketForRegistration } from "../utils/ticketService.js";
import Ticket from "../models/Ticket.js";
import Attendance from "../models/Attendance.js";

const generateRegistrationNumber = () => {
  return (
    "REG-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substr(2, 9).toUpperCase()
  );
};

export const registerForEvent = async (req, res) => {
  try {
    const { eventId, numberOfSeats = 1 } = req.body;

    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const seatsLeft =
      event.availableSeats ?? event.capacity - event.registeredCount;
    if (seatsLeft < numberOfSeats) {
      return res.status(400).json({
        message: `Only ${seatsLeft} seats available, but ${numberOfSeats} requested`,
      });
    }

    const activeRegistration = await Registration.findOne({
      userId: req.userId,
      eventId,
      status: { $ne: "cancelled" },
    });

    if (activeRegistration) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event" });
    }

    // Remove old cancelled record so a fresh registration can be created.
    // This keeps participant history consistent with "unregister then register again".
    await Registration.deleteMany({
      userId: req.userId,
      eventId,
      status: "cancelled",
    });

    const registration = await Registration.create({
      userId: req.userId,
      eventId,
      registrationNumber: generateRegistrationNumber(),
      numberOfSeats,
      status: "registered",
      attendanceStatus: "pending",
    });

    event.registeredCount += numberOfSeats;
    await event.save();

    const user = await User.findById(req.userId);
    if (user) {
      try {
        await sendRegistrationEmail(
          user.email,
          user.fullName,
          event,
          registration.registrationNumber
        );
      } catch (emailError) {
        console.error("Registration email failed:", emailError.message);
      }
    }

    let ticket = null;
    try {
      ticket = await ensureTicketForRegistration(registration._id);
    } catch (ticketError) {
      console.error("Ticket generation failed:", ticketError.message);
    }

    res.status(201).json({
      success: true,
      registration: await Registration.findById(registration._id).populate(
        "eventId"
      ),
      ticket,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "You already have a registration record for this event. Please try again.",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getMyRegistrations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    let filter = { userId: req.userId };

    if (status) {
      filter.status = status;
    }

    const registrations = await Registration.find(filter)
      .populate("eventId")
      .populate("ticketId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Registration.countDocuments(filter);

    res.status(200).json({
      success: true,
      registrations,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate("userId")
      .populate("eventId")
      .populate("ticketId");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Check authorization
    if (registration.userId._id.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this registration" });
    }

    res.status(200).json({
      success: true,
      registration,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate(
      "eventId"
    );

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this registration" });
    }

    await Attendance.deleteMany({ registrationId: registration._id });
    await Ticket.deleteMany({ registrationId: registration._id });
    await Registration.deleteOne({ _id: registration._id });

    // Update event registered count
    const event = registration.eventId;
    event.registeredCount = Math.max(
      0,
      event.registeredCount - (registration.numberOfSeats || 1)
    );
    await event.save();

    const user = await User.findById(req.userId);
    if (user) {
      try {
        await sendCancellationEmail(user.email, user.fullName, event);
      } catch (emailError) {
        console.error("Cancellation email failed:", emailError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
      registrationId: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check authorization
    if (event.createdBy.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these registrations" });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const registrations = await Registration.find({
      eventId,
      status: { $ne: "cancelled" },
    })
      .populate("userId", "fullName email phone")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Registration.countDocuments({
      eventId,
      status: { $ne: "cancelled" },
    });

    res.status(200).json({
      success: true,
      registrations,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
