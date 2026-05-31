import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { registrationAPI, ticketAPI } from "../services/api";
import { useToast } from "../components/Toast";
import "../styles/MyEvents.css";

export const MyEvents = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleGetTicket = async (registrationId) => {
    try {
      await ticketAPI.generateTicket({ registrationId });
      addToast("Ticket created — open My Tickets for your QR code", "success");
      fetchMyEvents();
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to create ticket",
        "error"
      );
    }
  };

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const { data } = await registrationAPI.getMyRegistrations({ limit: 100 });
      const active = data.registrations.filter(
        (r) => r.status !== "cancelled" && r.eventId
      );
      setRegistrations(active);
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to fetch your events",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-events-container">
      <h1>My Registered Events</h1>
      <p className="my-events-hint">
        Each registration gets a <strong>registration number</strong> (REG-…) and
        a separate <strong>ticket number</strong> (TKT-…) with a QR code under{" "}
        <Link to="/my-tickets">My Tickets</Link>.
      </p>

      {loading ? (
        <div className="loading">Loading your events...</div>
      ) : registrations.length === 0 ? (
        <div className="no-events">
          <p>You haven&apos;t registered for any events yet</p>
          <Link to="/" className="btn-browse">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="my-events-list">
          {registrations.map((reg) => {
            const event = reg.eventId;
            const eventDate = new Date(event.date);
            return (
              <div key={reg._id} className="my-event-card">
                <h3>{event.name}</h3>
                <p>
                  📅{" "}
                  {eventDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p>📍 {event.location}</p>
                <p className="reg-number">
                  Registration #: <code>{reg.registrationNumber}</code>
                </p>
                <p className="reg-status">Status: {reg.status}</p>
                <div className="my-event-actions">
                  <Link to={`/event/${event._id}`} className="btn-browse">
                    Event details
                  </Link>
                  {reg.ticketId ? (
                    <Link to="/my-tickets" className="btn-browse">
                      View ticket & QR
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn-browse"
                      style={{ border: "none", cursor: "pointer" }}
                      onClick={() => handleGetTicket(reg._id)}
                    >
                      Create ticket & QR
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
