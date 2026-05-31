import Attendance from "../models/Attendance.js";
import Registration from "../models/Registration.js";
import Ticket from "../models/Ticket.js";
import Event from "../models/Event.js";

export const checkInWithQR = async (req, res) => {
  try {
    const { qrCode, eventId } = req.body;

    if (!qrCode || !eventId) {
      return res
        .status(400)
        .json({ message: "QR code and event ID are required" });
    }

    const codeInput = qrCode.trim();

    // Match by stored QR payload, ticket number, or ticket's qrCode field
    let registration = await Registration.findOne({ qrCode: codeInput })
      .populate("userId")
      .populate("eventId");

    if (!registration) {
      const ticket = await Ticket.findOne({
        $or: [{ ticketNumber: codeInput }, { qrCode: codeInput }],
      });
      if (ticket) {
        registration = await Registration.findById(ticket.registrationId)
          .populate("userId")
          .populate("eventId");
      }
    }

    if (!registration) {
      return res.status(404).json({
        message:
          "Registration not found. Paste the full QR text, or enter the ticket number (TKT-...).",
      });
    }

    // Verify event matches
    if (registration.eventId._id.toString() !== eventId) {
      return res
        .status(400)
        .json({ message: "QR code does not match this event" });
    }

    // Check if already checked in
    const existingAttendance = await Attendance.findOne({
      registrationId: registration._id,
      status: "checked-in",
    });

    if (existingAttendance) {
      return res
        .status(400)
        .json({ message: "Already checked in for this event" });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      registrationId: registration._id,
      eventId,
      userId: registration.userId._id,
      ticketId: registration.ticketId,
      qrCode,
      verifiedBy: req.userId,
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    // Update registration status
    registration.status = "checked-in";
    registration.attendanceStatus = "attended";
    registration.checkInTime = new Date();
    await registration.save();

    // Update ticket status
    if (registration.ticketId) {
      await Ticket.findByIdAndUpdate(registration.ticketId, {
        status: "used",
        usedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Check-in successful",
      attendance,
      user: {
        name: registration.userId.fullName,
        email: registration.userId.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkOut = async (req, res) => {
  try {
    const { registrationId } = req.body;

    const attendance = await Attendance.findOne({
      registrationId,
      status: "checked-in",
    });

    if (!attendance) {
      return res.status(404).json({ message: "No active check-in found" });
    }

    attendance.status = "checked-out";
    attendance.checkOutTime = new Date();
    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Check-out successful",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const attendances = await Attendance.find({ eventId })
      .populate("userId", "fullName email")
      .populate("registrationId")
      .sort({ checkInTime: -1 });

    const summary = {
      totalAttendances: attendances.length,
      checkedIn: attendances.filter((a) => a.status === "checked-in").length,
      checkedOut: attendances.filter((a) => a.status === "checked-out").length,
      averageStayTime: 0, // Calculate if both times exist
    };

    let totalDuration = 0;
    let countWithDuration = 0;

    attendances.forEach((a) => {
      if (a.checkInTime && a.checkOutTime) {
        totalDuration += (a.checkOutTime - a.checkInTime) / (1000 * 60); // in minutes
        countWithDuration++;
      }
    });

    if (countWithDuration > 0) {
      summary.averageStayTime = (totalDuration / countWithDuration).toFixed(2);
    }

    res.status(200).json({
      success: true,
      attendances,
      summary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const attendances = await Attendance.find({ eventId })
      .populate("userId", "fullName email phone")
      .skip(skip)
      .limit(limitNum)
      .sort({ checkInTime: -1 });

    const total = await Attendance.countDocuments({ eventId });

    res.status(200).json({
      success: true,
      attendances,
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

export const markNoShow = async (req, res) => {
  try {
    const { registrationId } = req.body;

    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    registration.attendanceStatus = "no-show";
    await registration.save();

    res.status(200).json({
      success: true,
      message: "Marked as no-show",
      registration,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
