import Ticket from "../models/Ticket.js";
import Registration from "../models/Registration.js";
import { generateQRCode } from "./qrCodeUtil.js";
import { sendTicketEmail } from "./emailUtil.js";

const generateTicketNumber = () =>
  "TKT-" +
  Date.now() +
  "-" +
  Math.random().toString(36).substr(2, 9).toUpperCase();

/**
 * Create a ticket (with QR) for a registration if one does not exist yet.
 * Registration # (REG-...) and ticket # (TKT-...) are different IDs.
 */
export const ensureTicketForRegistration = async (registrationId) => {
  const existing = await Ticket.findOne({ registrationId });
  if (existing && existing.status === "active") {
    return existing;
  }
  if (existing && existing.status === "cancelled") {
    await Ticket.deleteOne({ _id: existing._id });
  }

  const registration = await Registration.findById(registrationId)
    .populate("userId")
    .populate("eventId");

  if (!registration || registration.status === "cancelled") {
    return null;
  }

  const ticketNumber = generateTicketNumber();
  const qrCodeData = JSON.stringify({
    ticketNumber,
    eventId: registration.eventId._id,
    userId: registration.userId._id,
    registrationId: registration._id.toString(),
    registrationNumber: registration.registrationNumber,
    timestamp: Date.now(),
  });

  const qrCodeImage = await generateQRCode(qrCodeData);

  const ticket = await Ticket.create({
    registrationId: registration._id,
    ticketNumber,
    eventId: registration.eventId._id,
    userId: registration.userId._id,
    qrCode: qrCodeData,
    qrCodeImage,
    ticketType: "standard",
    price: 0,
    validFrom: registration.eventId.date,
    validUntil: new Date(
      registration.eventId.date.getTime() + 24 * 60 * 60 * 1000
    ),
  });

  registration.ticketId = ticket._id;
  registration.qrCode = qrCodeData;
  await registration.save();

  try {
    await sendTicketEmail(
      registration.userId.email,
      registration.userId.fullName,
      registration.eventId.name,
      ticketNumber,
      qrCodeData
    );
  } catch (emailError) {
    console.error("Ticket email failed:", emailError.message);
  }

  return ticket;
};
