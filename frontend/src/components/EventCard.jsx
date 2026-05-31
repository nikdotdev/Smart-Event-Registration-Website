import { Link } from "react-router-dom";
import { handleEventImageError, resolveMediaUrl } from "../utils/eventImage";
import "../styles/EventCard.css";

export const EventCard = ({ event }) => {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const spotsRemaining = event.capacity - event.registeredCount;
  const isFull = spotsRemaining <= 0;

  return (
    <div className="event-card">
      <div className="event-image">
        <img
          src={resolveMediaUrl(event.image) || undefined}
          alt={event.name}
          onError={handleEventImageError}
        />
        {isFull && <div className="event-badge">FULL</div>}
      </div>
      <div className="event-content">
        <h3 className="event-title">{event.name}</h3>
        <p className="event-date">
          📅 {formattedDate} at {formattedTime}
        </p>
        <p className="event-location">📍 {event.location}</p>
        <p className="event-description">
          {event.description.substring(0, 100)}...
        </p>
        <div className="event-capacity">
          <div className="capacity-bar">
            <div
              className="capacity-filled"
              style={{
                width: `${(event.registeredCount / event.capacity) * 100}%`,
              }}
            ></div>
          </div>
          <p className="capacity-text">
            {event.registeredCount} / {event.capacity} registered
          </p>
        </div>
        <Link to={`/event/${event._id}`} className="btn-view-details">
          View Details
        </Link>
      </div>
    </div>
  );
};
