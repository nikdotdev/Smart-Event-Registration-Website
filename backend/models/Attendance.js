import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
    },
    qrCode: {
      type: String,
      index: true,
    },
    checkInTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkOutTime: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["checked-in", "checked-out"],
      default: "checked-in",
    },
    deviceInfo: String,
    ipAddress: String,
    notes: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ eventId: 1, userId: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
