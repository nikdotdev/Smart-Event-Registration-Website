import React, { useState, useEffect } from "react";
import { ticketAPI } from "../services/api";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { useToast } from "../components/Toast";
import { FiDownload } from "react-icons/fi";

const MyTicketsPage = () => {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketAPI.getMyTickets();
      setTickets(response.data.tickets);
    } catch (error) {
      addToast("Failed to fetch tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async (ticketId) => {
    try {
      const response = await ticketAPI.downloadTicket(ticketId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${ticketId}.png`);
      document.body.appendChild(link);
      link.click();
      addToast("Ticket downloaded successfully", "success");
    } catch (error) {
      addToast("Failed to download ticket", "error");
    }
  };

  if (loading)
    return <div className="text-center py-10">Loading tickets...</div>;

  return (
    <div className="advanced-page">
      <div className="advanced-page-inner max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          My Tickets
        </h1>

        {tickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="advanced-empty-hint">
              No tickets yet. Register for an event first — a ticket with QR code
              is created automatically. If you registered before this update,
              cancel and register again, or contact support.
            </p>
          </div>
        ) : selectedTicket ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <button
              onClick={() => setSelectedTicket(null)}
              className="mb-4 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400"
            >
              ← Back to Tickets
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedTicket.eventId?.name}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ticket Number
                    </label>
                    <p className="text-lg font-mono text-gray-900 dark:text-white">
                      {selectedTicket.ticketNumber}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ticket Type
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white capitalize">
                      {selectedTicket.ticketType}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTicket.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Event Date
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {new Date(
                        selectedTicket.eventId?.date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadTicket(selectedTicket._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <FiDownload /> Download QR Code
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <QRCodeDisplay
                  qrData={selectedTicket.qrCode}
                  ticketNumber={selectedTicket.ticketNumber}
                  userEmail={selectedTicket.userId?.email}
                  userName={selectedTicket.userId?.fullName}
                  eventName={selectedTicket.eventId?.name}
                  eventDate={selectedTicket.eventId?.date}
                  downloadable={false}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {ticket.eventId?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {ticket.ticketNumber}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Type:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {ticket.ticketType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Status:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        ticket.status === "active"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Date:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(ticket.eventId?.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadTicket(ticket._id);
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Download QR
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTicketsPage;
