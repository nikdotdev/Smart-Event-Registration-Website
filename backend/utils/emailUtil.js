import resend, { getFromAddress } from "../config/email.js";
import { generateQRCodeBuffer } from "./qrCodeUtil.js";

const QR_CID = "ticket-qr-code";

const formatEventDate = (date) =>
  new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getSender = () => getFromAddress();

export const sendEmail = async (to, subject, html, attachments = []) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "Email not configured: set RESEND_API_KEY in backend/.env or environment variables."
    );
    return null;
  }

  try {
    const info = await resend.emails.send({
      from: getSender(),
      to,
      subject,
      html,
      attachments,
    });
    console.log("Email sent:", info.id || info.messageId || info);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

export const sendRegistrationEmail = async (
  userEmail,
  userName,
  event,
  registrationNumber
) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Event Registration Confirmation</h2>
        <p>Dear ${userName},</p>
        <p>Thank you for registering. Your spot is confirmed.</p>
        <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3>${event.name}</h3>
          <p><strong>Registration #:</strong> ${registrationNumber}</p>
          <p><strong>Date:</strong> ${formatEventDate(event.date)}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Description:</strong> ${event.description}</p>
        </div>
        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br>Event Planner Team</p>
      </body>
    </html>
  `;

  return sendEmail(userEmail, `Event Confirmation: ${event.name}`, html);
};

export const sendCancellationEmail = async (userEmail, userName, event) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Registration Cancelled</h2>
        <p>Dear ${userName},</p>
        <p>Your registration for the following event has been cancelled:</p>
        <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3>${event.name}</h3>
          <p><strong>Date:</strong> ${formatEventDate(event.date)}</p>
          <p><strong>Location:</strong> ${event.location}</p>
        </div>
        <p>If you have questions, contact our support team.</p>
        <p>Best regards,<br>Event Planner Team</p>
      </body>
    </html>
  `;

  return sendEmail(userEmail, `Registration Cancelled: ${event.name}`, html);
};

export const sendTicketEmail = async (
  userEmail,
  userName,
  eventName,
  ticketNumber,
  qrCodeData
) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "Email not configured: set RESEND_API_KEY in backend/.env or environment variables."
    );
    return null;
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const qrBuffer = await generateQRCodeBuffer(qrCodeData);

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="background: #667eea; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center;">
            <h1 style="margin: 0;">Your Event Ticket</h1>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${userName},</p>
            <p>Thank you for registering! Your ticket is confirmed.</p>
            <div style="background: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Ticket number:</strong> ${ticketNumber}</p>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <p><strong>Your QR code for entry</strong></p>
              <img src="cid:${QR_CID}" alt="Event ticket QR code" width="280" height="280" style="display: block; margin: 12px auto;" />
            </div>
            <p>Present this QR code at the entrance. You can also open <a href="${frontendUrl}/my-tickets">My Tickets</a> in the app.</p>
            <p style="color: #666; font-size: 13px;">If the image does not load, log in and view your ticket under My Tickets.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(userEmail, `Your Ticket for ${eventName}`, html, [
    {
      filename: "ticket-qrcode.png",
      content: qrBuffer,
      content_type: "image/png",
      content_id: QR_CID,
    },
  ]);
};

export const sendReminderEmail = async (
  userEmail,
  userName,
  eventName,
  eventDate
) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .header { background: #667eea; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
          .content { padding: 20px; }
          .reminder-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Event Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            
            <div class="reminder-box">
              <h3>Upcoming Event Reminder</h3>
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Date & Time:</strong> ${new Date(
                eventDate
              ).toLocaleString()}</p>
              <p>Don't forget! Your event is coming up soon.</p>
            </div>

            <p>Make sure to have your ticket ready for check-in.</p>
            <p>See you soon!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Event Booking Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(userEmail, `Reminder: ${eventName} is coming up!`, html);
};

export const sendWelcomeEmail = async (userEmail, userName) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
          .content { padding: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome!</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Welcome to our Event Booking Portal! We're excited to have you on board.</p>
            <p>Start exploring and registering for amazing events today!</p>
            <p style="margin-top: 30px;">Happy exploring!</p>
            <p>The Event Booking Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Event Booking Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(userEmail, "Welcome to Event Booking Portal", html);
};
