import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventAPI, registrationAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { handleEventImageError, resolveMediaUrl } from "../utils/eventImage";
import "../styles/EventDetails.css";

export const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [id, isAuthenticated]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const { data } = await eventAPI.getEventById(id);
      setEvent(data.event);
      checkIfRegistered();
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to fetch event",
        "error"
      );
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const checkIfRegistered = async () => {
    if (!isAuthenticated) {
      setIsRegistered(false);
      setRegistrationId(null);
      return;
    }

    try {
      const { data } = await registrationAPI.getMyRegistrations({ limit: 100 });
      const match = data.registrations.find((r) => {
        const eventId = r.eventId?._id || r.eventId;
        return eventId?.toString() === id && r.status !== "cancelled";
      });
      setIsRegistered(!!match);
      setRegistrationId(match?._id || null);
    } catch (error) {
      console.error("Error checking registration:", error);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      addToast("Please login to register", "info");
      navigate("/login");
      return;
    }

    try {
      setRegistering(true);
      const { data } = await registrationAPI.registerForEvent({
        eventId: id,
        numberOfSeats: 1,
      });
      setRegistrationId(data.registration?._id || null);
      setIsRegistered(true);
      addToast(
        data.ticket
          ? "Registered! Your ticket with QR code is in My Tickets."
          : "Registered for the event!",
        "success"
      );
      fetchEvent();
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to register", "error");
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your registration?")) {
      return;
    }

    if (!registrationId) {
      addToast("Registration not found", "error");
      return;
    }

    try {
      setRegistering(true);
      await registrationAPI.cancelRegistration(registrationId);
      addToast("Registration cancelled successfully", "success");
      setIsRegistered(false);
      setRegistrationId(null);
      fetchEvent();
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to cancel registration",
        "error"
      );
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (!event) {
    return <div className="error">Event not found</div>;
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const spotsRemaining = event.capacity - event.registeredCount;
  const isFull = spotsRemaining <= 0;

  return (
    <div className="event-details-container">
      <button className="btn-back" onClick={() => navigate("/")}>
        ← Back to Events
      </button>

      <div className="event-details-card">
        <div className="event-details-image">
          <img
            src={resolveMediaUrl(event.image) || undefined}
            alt={event.name}
            onError={handleEventImageError}
          />
          {isFull && <div className="event-status-badge">EVENT FULL</div>}
        </div>

        <div className="event-details-content">
          <h1>{event.name}</h1>

          <div className="event-details-info">
            <div className="info-item">
              <span className="info-label">📅 Date & Time</span>
              <p>
                {formattedDate} at {formattedTime}
              </p>
            </div>

            <div className="info-item">
              <span className="info-label">📍 Location</span>
              <p>{event.location}</p>
            </div>

            <div className="info-item">
              <span className="info-label">👤 Organized by</span>
              <p>{event.createdBy.fullName}</p>
            </div>

            <div className="info-item">
              <span className="info-label">📊 Capacity</span>
              <div className="capacity-details">
                <div className="capacity-bar-large">
                  <div
                    className="capacity-filled"
                    style={{
                      width: `${
                        (event.registeredCount / event.capacity) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <p>
                  {event.registeredCount} / {event.capacity} registered (
                  {spotsRemaining} spot{spotsRemaining !== 1 ? "s" : ""}{" "}
                  available)
                </p>
              </div>
            </div>
          </div>

          <div className="event-details-description">
            <h2>About this event</h2>
            <p>{event.description}</p>
          </div>

          <div className="event-details-actions">
            {isAuthenticated && user?.role === "admin" && (
              <>
                <button
                  className="btn-edit"
                  onClick={() =>
                    navigate("/admin", { state: { editEventId: id } })
                  }
                >
                  Edit Event
                </button>
                <button
                  className="btn-delete"
                  onClick={async () => {
                    if (
                      !confirm("Are you sure you want to delete this event?")
                    ) {
                      return;
                    }
                    try {
                      await eventAPI.deleteEvent(id);
                      addToast("Event deleted", "success");
                      navigate("/admin");
                    } catch (error) {
                      addToast(
                        error.response?.data?.message ||
                          "Failed to delete event",
                        "error"
                      );
                    }
                  }}
                >
                  Delete Event
                </button>
              </>
            )}

            {isAuthenticated && user?.role === "user" && (
              <>
                {isRegistered ? (
                  <>
                    <button
                      type="button"
                      className="btn-register"
                      onClick={() => navigate("/my-tickets")}
                    >
                      View ticket & QR code
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={handleCancel}
                      disabled={registering}
                    >
                      {registering ? "Cancelling..." : "Cancel Registration"}
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-register"
                    onClick={handleRegister}
                    disabled={registering || isFull}
                  >
                    {registering
                      ? "Registering..."
                      : isFull
                      ? "Event is Full"
                      : "Register for Event"}
                  </button>
                )}
              </>
            )}

            {!isAuthenticated && (
              <button
                className="btn-register"
                onClick={() => navigate("/login")}
              >
                Login to Register
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
