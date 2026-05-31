import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../styles/QRCodeDisplay.css";

const QRCodeDisplay = ({
  qrData,
  ticketNumber,
  userEmail,
  userName,
  eventName,
  eventDate,
  downloadable = true,
  size = 200,
}) => {
  const qrRef = React.useRef();

  const handleDownloadQR = async () => {
    const element = qrRef.current;
    const canvas = await html2canvas(element);
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `ticket-${ticketNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    const element = qrRef.current;
    const canvas = await html2canvas(element);
    const image = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    pdf.text(`Ticket: ${ticketNumber}`, 10, 10);
    pdf.text(`Event: ${eventName}`, 10, 20);
    pdf.text(`Attendee: ${userName}`, 10, 30);
    pdf.text(`Email: ${userEmail}`, 10, 40);
    pdf.text(`Date: ${new Date(eventDate).toLocaleDateString()}`, 10, 50);

    const imgWidth = 100;
    const imgHeight = 100;
    pdf.addImage(image, "PNG", 55, 70, imgWidth, imgHeight);

    pdf.save(`ticket-${ticketNumber}.pdf`);
  };

  return (
    <div className="qr-code-display">
      <div ref={qrRef} className="qr-code-container">
        <QRCodeCanvas
          value={qrData || "https://eventbooking.com"}
          size={size}
          level="H"
          includeMargin
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <p>
          <strong>Ticket:</strong> {ticketNumber}
        </p>
        <p>
          <strong>Attendee:</strong> {userName}
        </p>
        <p>
          <strong>Email:</strong> {userEmail}
        </p>
        <p>
          <strong>Event:</strong> {eventName}
        </p>
        <p>
          <strong>Date:</strong> {new Date(eventDate).toLocaleDateString()}
        </p>
      </div>

      {downloadable && (
        <div className="qr-download-row">
          <button type="button" onClick={handleDownloadQR} className="qr-btn-png">
            Download QR (PNG)
          </button>
          <button type="button" onClick={handleDownloadPDF} className="qr-btn-pdf">
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
