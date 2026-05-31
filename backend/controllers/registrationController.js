import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import {
  sendRegistrationEmail,
  sendCancellationEmail,
} from "../utils/emailService.js";

export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if event exists
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user already registered
    const existingRegistration = await Registration.findOne({
      userId,
      eventId: id,
      status: "registered",
    });

    if (existingRegistration) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event" });
    }

    // Check if event has capacity
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ message: "Event is full" });
    }

    // Get user details for email
    const user = await User.findById(userId);

    // Create registration
    const registration = await Registration.create({
      userId,
      eventId: id,
    });

    // Update event registered count
    event.registeredCount += 1;
    await event.save();

    // Send confirmation email
    try {
      await sendRegistrationEmail(user.email, event);
    } catch (emailError) {
      console.warn(
        "Email sending failed but registration succeeded:",
        emailError.message
      );
    }

    res.status(201).json({
      success: true,
      message: "Successfully registered for the event",
      registration,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserEvents = async (req, res) => {
  try {
    const userId = req.userId;

    const registrations = await Registration.find({
      userId,
      status: "registered",
    }).populate("eventId");

    const events = registrations.map((reg) => reg.eventId);

    res.status(200).json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if event exists
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find and update registration
    const registration = await Registration.findOne({
      userId,
      eventId: id,
      status: "registered",
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    registration.status = "cancelled";
    await registration.save();

    // Update event registered count
    event.registeredCount = Math.max(0, event.registeredCount - 1);
    await event.save();

    // Get user for email
    const user = await User.findById(userId);

    // Send cancellation email
    try {
      await sendCancellationEmail(user.email, event);
    } catch (emailError) {
      console.warn(
        "Email sending failed but cancellation succeeded:",
        emailError.message
      );
    }

    res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get all registrations for this event
    const registrations = await Registration.find({
      eventId: id,
      status: "registered",
    }).populate("userId", "fullName email");

    res.status(200).json({
      success: true,
      registrations,
      count: registrations.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
