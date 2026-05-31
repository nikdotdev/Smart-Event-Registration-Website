import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
    },
    registrationNumber: {
      type: String,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["registered", "checked-in", "cancelled"],
      default: "registered",
    },
    attendanceStatus: {
      type: String,
      enum: ["pending", "attended", "no-show"],
      default: "pending",
    },
    numberOfSeats: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    checkInTime: Date,
    notes: String,
  },
  { timestamps: true }
);

registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;
