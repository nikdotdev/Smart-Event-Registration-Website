import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { deleteCachedValue } from "../middleware/cache.js";

export const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      date,
      location,
      capacity,
      tags,
      image,
    } = req.body;

    if (!name || !description || !date || !location || !capacity) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const eventCategory = category || "other";
    let imagePath = req.file ? `/uploads/events/${req.file.filename}` : null;
    if (!imagePath && image && typeof image === "string" && image.trim()) {
      imagePath = image.trim();
    }

    const eventPayload = {
      name,
      description,
      category: eventCategory,
      date,
      location,
      capacity,
      tags: tags ? (Array.isArray(tags) ? tags : String(tags).split(",")) : [],
      createdBy: req.userId,
    };
    if (imagePath) {
      eventPayload.image = imagePath;
    }

    const event = await Event.create(eventPayload);

    // Invalidate the shared list cache whenever a new event is created.
    await deleteCachedValue("events:all");

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      sortBy,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // Search by name or description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sortBy === "upcoming") {
      sortOption = { date: 1 };
    } else if (sortBy === "recent") {
      sortOption = { createdAt: -1 };
    } else if (sortBy === "popular") {
      sortOption = { registeredCount: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const events = await Event.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate("createdBy", "fullName email");

    const total = await Event.countDocuments(filter);

    res.status(200).json({
      success: true,
      events,
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

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "createdBy",
      "fullName email"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get registration count
    const registrationCount = await Registration.countDocuments({
      eventId: event._id,
      status: { $ne: "cancelled" },
    });

    res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        registrationCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      date,
      location,
      capacity,
      tags,
      status,
    } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.createdBy.toString() !== req.userId && req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this event" });
    }

    if (name) event.name = name;
    if (description) event.description = description;
    if (category) event.category = category;
    if (date) event.date = date;
    if (location) event.location = location;
    if (capacity) event.capacity = capacity;
    if (tags) event.tags = tags;
    if (status) event.status = status;

    if (req.file) {
      event.image = `/uploads/events/${req.file.filename}`;
    } else if (
      req.body.image &&
      typeof req.body.image === "string" &&
      req.body.image.trim()
    ) {
      event.image = req.body.image.trim();
    }

    await event.save();

    // Keep the list and this event's detail cache fresh after updates.
    await deleteCachedValue("events:all");
    await deleteCachedValue(`event:${req.params.id}`);

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.createdBy.toString() !== req.userId && req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this event" });
    }

    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ eventId: req.params.id });

    // Remove the cached list and the removed event's detail entry.
    await deleteCachedValue("events:all");
    await deleteCachedValue(`event:${req.params.id}`);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventCategories = async (req, res) => {
  try {
    const categories = [
      "conference",
      "workshop",
      "seminar",
      "webinar",
      "networking",
      "other",
    ];
    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventAnalytics = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registrations = await Registration.find({ eventId }).populate(
      "userId"
    );

    const totalRegistrations = registrations.length;
    const checkedIn = registrations.filter(
      (r) => r.status === "checked-in"
    ).length;
    const attended = registrations.filter(
      (r) => r.attendanceStatus === "attended"
    ).length;
    const noShow = registrations.filter(
      (r) => r.attendanceStatus === "no-show"
    ).length;
    const cancelled = registrations.filter(
      (r) => r.status === "cancelled"
    ).length;

    const occupancyRate = (
      (event.registeredCount / event.capacity) *
      100
    ).toFixed(2);
    const attendanceRate = ((attended / totalRegistrations) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      analytics: {
        totalRegistrations,
        checkedIn,
        attended,
        noShow,
        cancelled,
        occupancyRate,
        attendanceRate,
        availableSeats: event.availableSeats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
