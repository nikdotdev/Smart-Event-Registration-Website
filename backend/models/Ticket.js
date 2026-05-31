import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
      unique: true,
    },
    ticketNumber: {
      type: String,
      unique: true,
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
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    qrCodeImage: String, // Base64 or URL to QR code image
    ticketType: {
      type: String,
      enum: ["standard", "vip", "student"],
      default: "standard",
    },
    price: Number,
    status: {
      type: String,
      enum: ["active", "used", "cancelled"],
      default: "active",
    },
    usedAt: Date,
    validFrom: Date,
    validUntil: Date,
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
