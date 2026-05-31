import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide an event name"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Please provide event description"],
    },
    category: {
      type: String,
      enum: [
        "conference",
        "workshop",
        "seminar",
        "webinar",
        "networking",
        "other",
      ],
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Please provide an event date"],
      index: true,
    },
    location: {
      type: String,
      required: [true, "Please provide a location"],
      trim: true,
    },
    image: {
      type: String,
      default: "https://via.placeholder.com/500x300?text=Event+Image",
    },
    capacity: {
      type: Number,
      required: [true, "Please provide event capacity"],
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    availableSeats: {
      type: Number,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tags: [String],
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate available seats
eventSchema.pre("save", function (next) {
  if (this.isModified("capacity") || this.isModified("registeredCount")) {
    this.availableSeats = this.capacity - this.registeredCount;
  }
  next();
});

const Event = mongoose.model("Event", eventSchema);
export default Event;
