import Event from "../models/Event.js";

export const createEvent = async (req, res) => {
  try {
    const { name, description, date, location, capacity, image } = req.body;

    // Validation
    if (!name || !description || !date || !location || !capacity) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const event = await Event.create({
      name,
      description,
      date,
      location,
      capacity,
      image: image || undefined,
      createdBy: req.userId,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const events = await Event.find(searchQuery)
      .populate("createdBy", "fullName email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: 1 });

    const total = await Event.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      events,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate(
      "createdBy",
      "fullName email"
    );
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, date, location, capacity, image } = req.body;

    let event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is admin or creator
    if (event.createdBy.toString() !== req.userId && req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this event" });
    }

    event = await Event.findByIdAndUpdate(
      id,
      { name, description, date, location, capacity, image },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is admin or creator
    if (event.createdBy.toString() !== req.userId && req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this event" });
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
