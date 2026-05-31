import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import {
  exportParticipantsToCSV,
  generateEventReport,
  generateParticipantReport,
} from "../utils/reportUtil.js";

export const getParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, search } = req.query;

    // Verify admin access
    const event = await Event.findById(eventId);
    if (event.createdBy.toString() !== req.userId && req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view participants" });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    let filter = { eventId };

    if (search) {
      filter.$or = [
        { "userId.fullName": { $regex: search, $options: "i" } },
        { "userId.email": { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
      ];
    }

    const participants = await Registration.find(filter)
      .populate("userId", "fullName email phone")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Registration.countDocuments(filter);

    res.status(200).json({
      success: true,
      participants,
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

export const deleteParticipant = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { eventId } = req.query;

    const registration = await Registration.findById(registrationId).populate(
      "eventId"
    );

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Verify admin or event organizer
    if (
      registration.eventId.createdBy.toString() !== req.userId &&
      req.userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this registration" });
    }

    registration.status = "cancelled";
    await registration.save();

    // Decrease event registered count
    registration.eventId.registeredCount -= 1;
    await registration.eventId.save();

    res.status(200).json({
      success: true,
      message: "Participant removed successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportParticipantsCSV = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Verify admin access
    if (event.createdBy.toString() !== req.userId && req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to export participants" });
    }

    const registrations = await Registration.find({ eventId }).populate(
      "userId"
    );

    const { fileName, filePath } = await exportParticipantsToCSV(
      registrations,
      event.name
    );

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateEventReportPDF = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Verify admin access
    if (event.createdBy.toString() !== req.userId && req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to generate report" });
    }

    const registrations = await Registration.find({ eventId }).populate(
      "userId"
    );

    const { fileName, filePath } = await generateEventReport(
      event,
      registrations
    );

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateParticipantReportPDF = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Verify admin access
    if (event.createdBy.toString() !== req.userId && req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to generate report" });
    }

    const registrations = await Registration.find({ eventId }).populate(
      "userId"
    );

    const { fileName, filePath } = await generateParticipantReport(
      registrations
    );

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
