import { useState, useEffect } from "react";
import { EventCard } from "../components/EventCard";
import { eventAPI } from "../services/api";
import { useToast } from "../components/Toast";
import "../styles/Home.css";

export const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const { addToast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [page, search]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data } = await eventAPI.getAllEvents({
        page,
        limit: 9,
        search,
      });
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to fetch events",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Discover Amazing Events</h1>
        <p>Find and register for events that interest you</p>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search events by name, location, or description..."
          value={search}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="no-events">
          <p>No events found</p>
        </div>
      ) : (
        <>
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                ← Previous
              </button>

              <div className="page-info">
                Page {page} of {pagination.pages}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.pages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
