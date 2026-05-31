import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { eventAPI } from "../services/api";
import { useToast } from "../components/Toast";
import "../styles/AdminDashboard.css";

const CATEGORIES = [
  "conference",
  "workshop",
  "seminar",
  "webinar",
  "networking",
  "other",
];

const emptyForm = () => ({
  name: "",
  description: "",
  category: "other",
  date: "",
  location: "",
  capacity: "",
  image: "",
  imageFile: null,
});

export const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const editId = location.state?.editEventId;
    if (!editId || events.length === 0) return;
    const event = events.find((e) => e._id === editId);
    if (event) {
      openEditForm(event);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, events]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data } = await eventAPI.getAllEvents({ limit: 100 });
      setEvents(data.events);
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to fetch events",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({ ...prev, imageFile: file || null }));
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (event) => {
    const dateValue = new Date(event.date);
    const local = new Date(
      dateValue.getTime() - dateValue.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);

    setFormData({
      name: event.name,
      description: event.description,
      category: event.category || "other",
      date: local,
      location: event.location,
      capacity: String(event.capacity),
      image:
        event.image && !event.image.startsWith("/uploads")
          ? event.image
          : "",
      imageFile: null,
    });
    setEditingId(event._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.description ||
      !formData.date ||
      !formData.location ||
      !formData.capacity
    ) {
      addToast("Please fill all required fields", "error");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      date: formData.date,
      location: formData.location,
      capacity: formData.capacity,
      image: formData.image,
      imageFile: formData.imageFile,
    };

    try {
      if (editingId) {
        await eventAPI.updateEvent(editingId, payload);
        addToast("Event updated successfully", "success");
      } else {
        await eventAPI.createEvent(payload);
        addToast("Event created successfully", "success");
      }
      fetchEvents();
      resetForm();
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to save event",
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await eventAPI.deleteEvent(id);
      addToast("Event deleted successfully", "success");
      fetchEvents();
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to delete event",
        "error"
      );
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-header-actions">
          <Link to="/admin/analytics" className="btn-sm btn-view">
            Analytics
          </Link>
          <button
            type="button"
            className="btn-create"
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
          >
            {showForm ? "Cancel" : "+ Create New Event"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="admin-form-container">
          <h2>{editingId ? "Edit Event" : "Create New Event"}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Capacity *</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Date & Time *</label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Event image (upload)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageFile}
              />
            </div>

            <div className="form-group">
              <label>Or image URL</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <button type="submit" className="btn-submit">
              {editingId ? "Update Event" : "Create Event"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="no-events">
          <p>No events created yet</p>
        </div>
      ) : (
        <div className="admin-events-table">
          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Category</th>
                <th>Date</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const eventDate = new Date(event.date);
                const formattedDate = eventDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <tr key={event._id}>
                    <td>{event.name}</td>
                    <td>{event.category || "—"}</td>
                    <td>{formattedDate}</td>
                    <td>{event.location}</td>
                    <td>{event.capacity}</td>
                    <td>{event.registeredCount}</td>
                    <td className="actions">
                      <button
                        type="button"
                        className="btn-sm btn-edit"
                        onClick={() => openEditForm(event)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-delete"
                        onClick={() => handleDelete(event._id)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-view"
                        onClick={() => navigate(`/event/${event._id}`)}
                      >
                        View
                      </button>
                      <Link
                        to={`/admin/events/${event._id}/participants`}
                        className="btn-sm btn-view"
                      >
                        Participants
                      </Link>
                      <Link
                        to={`/admin/events/${event._id}/attendance`}
                        className="btn-sm btn-view"
                      >
                        Attendance
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
