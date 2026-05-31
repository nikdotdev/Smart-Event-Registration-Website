import { createObjectCsvWriter } from "csv-writer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads", "reports");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const exportParticipantsToCSV = async (participants, eventName) => {
  const fileName = `${eventName}-participants-${Date.now()}.csv`;
  const filePath = path.join(uploadsDir, fileName);

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "fullName", title: "Full Name" },
      { id: "email", title: "Email" },
      { id: "registrationNumber", title: "Registration Number" },
      { id: "registeredAt", title: "Registered At" },
      { id: "status", title: "Status" },
      { id: "attendanceStatus", title: "Attendance Status" },
    ],
  });

  const records = participants.map((p) => ({
    fullName: p.userId?.fullName || "N/A",
    email: p.userId?.email || "N/A",
    registrationNumber: p.registrationNumber,
    registeredAt: new Date(p.createdAt).toLocaleDateString(),
    status: p.status,
    attendanceStatus: p.attendanceStatus,
  }));

  await csvWriter.writeRecords(records);
  return { fileName, filePath };
};

export const generateEventReport = async (eventData, registrations) => {
  const fileName = `${eventData.name}-report-${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Title
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Event Report", { align: "center" });
  doc.moveDown();

  // Event Details
  doc.fontSize(12).font("Helvetica-Bold").text("Event Details");
  doc.fontSize(10).font("Helvetica");
  doc.text(`Event Name: ${eventData.name}`);
  doc.text(`Date: ${new Date(eventData.date).toLocaleDateString()}`);
  doc.text(`Location: ${eventData.location}`);
  doc.text(`Category: ${eventData.category}`);
  doc.text(`Total Capacity: ${eventData.capacity}`);
  doc.text(`Registered Participants: ${eventData.registeredCount}`);
  doc.text(`Available Seats: ${eventData.availableSeats}`);
  doc.moveDown();

  // Registration Statistics
  doc.fontSize(12).font("Helvetica-Bold").text("Registration Statistics");
  doc.fontSize(10).font("Helvetica");
  const attendedCount = registrations.filter(
    (r) => r.attendanceStatus === "attended"
  ).length;
  const noShowCount = registrations.filter(
    (r) => r.attendanceStatus === "no-show"
  ).length;
  const pendingCount = registrations.filter(
    (r) => r.attendanceStatus === "pending"
  ).length;

  doc.text(`Total Registrations: ${registrations.length}`);
  doc.text(`Attended: ${attendedCount}`);
  doc.text(`No Show: ${noShowCount}`);
  doc.text(`Pending: ${pendingCount}`);
  doc.text(
    `Attendance Rate: ${((attendedCount / registrations.length) * 100).toFixed(
      2
    )}%`
  );
  doc.moveDown();

  // Participants List (if less than 50)
  if (registrations.length < 50) {
    doc.fontSize(12).font("Helvetica-Bold").text("Participant List");
    doc.fontSize(9).font("Helvetica");
    doc.moveDown(0.5);

    registrations.slice(0, 50).forEach((reg, index) => {
      doc.text(
        `${index + 1}. ${reg.userId?.fullName || "N/A"} - ${
          reg.userId?.email || "N/A"
        }`
      );
    });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      resolve({ fileName, filePath });
    });
    stream.on("error", reject);
  });
};

export const generateParticipantReport = async (registrations) => {
  const fileName = `participants-report-${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Title
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Participant Report", { align: "center" });
  doc.moveDown();

  // Report Date
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Generated on: ${new Date().toLocaleString()}`);
  doc.moveDown();

  // Participant Details Table
  doc.fontSize(10).font("Helvetica-Bold").text("Participant Details");
  doc.moveDown(0.5);

  registrations.forEach((reg, index) => {
    doc.fontSize(9).font("Helvetica");
    doc.text(`${index + 1}. ${reg.userId?.fullName || "N/A"}`);
    doc.text(`   Email: ${reg.userId?.email || "N/A"}`, { indent: 20 });
    doc.text(`   Status: ${reg.status}`, { indent: 20 });
    doc.text(`   Attendance: ${reg.attendanceStatus}`, { indent: 20 });
    if (reg.checkInTime) {
      doc.text(
        `   Check-in Time: ${new Date(reg.checkInTime).toLocaleString()}`,
        { indent: 20 }
      );
    }
    doc.moveDown(0.5);
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      resolve({ fileName, filePath });
    });
    stream.on("error", reject);
  });
};
