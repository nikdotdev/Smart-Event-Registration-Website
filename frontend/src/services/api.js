import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const buildEventFormData = (data) => {
  const formData = new FormData();
  const { imageFile, image, ...fields } = data;

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });

  if (imageFile instanceof File) {
    formData.append("image", imageFile);
  } else if (image && typeof image === "string" && image.trim()) {
    formData.append("image", image.trim());
  }

  return formData;
};

// Auth APIs
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
  setTheme: (theme) => api.put("/auth/theme", { theme }),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Event APIs
export const eventAPI = {
  getAllEvents: (params) => api.get("/events", { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  getCategories: () => api.get("/events/categories"),
  getAnalytics: (id) => api.get(`/events/${id}/analytics`),
  createEvent: (data) =>
    api.post("/events", buildEventFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateEvent: (id, data) =>
    api.put(`/events/${id}`, buildEventFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteEvent: (id) => api.delete(`/events/${id}`),
};

// Registration APIs
export const registrationAPI = {
  registerForEvent: (data) => api.post("/registrations", data),
  getMyRegistrations: (params) =>
    api.get("/registrations/my-registrations", { params }),
  getRegistrationById: (id) => api.get(`/registrations/${id}`),
  cancelRegistration: (registrationId) =>
    api.delete(`/registrations/${registrationId}`),
  getEventRegistrations: (eventId, params) =>
    api.get(`/registrations/event/${eventId}`, { params }),
};

// Ticket APIs
export const ticketAPI = {
  generateTicket: (data) => api.post("/tickets", data),
  getMyTickets: () => api.get("/tickets/my-tickets"),
  getTicket: (id) => api.get(`/tickets/${id}`),
  validateTicket: (data) => api.post("/tickets/validate", data),
  downloadTicket: (id) =>
    api.get(`/tickets/${id}/download`, { responseType: "blob" }),
};

// Attendance APIs
export const attendanceAPI = {
  checkIn: (data) => api.post("/attendance/check-in", data),
  checkOut: (data) => api.post("/attendance/check-out", data),
  getAttendanceReport: (eventId) => api.get(`/attendance/report/${eventId}`),
  getEventAttendance: (eventId, params) =>
    api.get(`/attendance/event/${eventId}`, { params }),
  markNoShow: (data) => api.put("/attendance/mark-no-show", data),
};

// Participants APIs
export const participantsAPI = {
  getParticipants: (eventId, params) =>
    api.get(`/participants/event/${eventId}`, { params }),
  deleteParticipant: (registrationId, eventId) =>
    api.delete(`/participants/${registrationId}?eventId=${eventId}`),
  exportCSV: (eventId) =>
    api.get(`/participants/export/csv/${eventId}`, { responseType: "blob" }),
  generateEventReport: (eventId) =>
    api.get(`/participants/report/event/${eventId}`, { responseType: "blob" }),
  generateParticipantReport: (eventId) =>
    api.get(`/participants/report/participants/${eventId}`, {
      responseType: "blob",
    }),
};

// Dashboard APIs
export const dashboardAPI = {
  getAnalytics: () => api.get("/dashboard/analytics"),
  getEventStatistics: () => api.get("/dashboard/events-stats"),
  getRegistrationStatistics: () => api.get("/dashboard/registrations-stats"),
  getSystemMetrics: () => api.get("/dashboard/metrics"),
};

export default api;
