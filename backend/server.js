import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import {
  scheduleEventReminders,
  scheduleEventStatusUpdate,
} from "./utils/cronJobs.js";
import {
  protect,
  checkAdmin,
  errorHandler,
} from "./middleware/advancedAuth.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import advancedEventRoutes from "./routes/advancedEventRoutes.js";
import advancedRegistrationRoutes from "./routes/advancedRegistrationRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import participantsRoutes from "./routes/participantsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();

// Get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
connectDB();

// Initialize cron jobs
scheduleEventReminders();
scheduleEventStatusUpdate();

// Middleware (allow frontend to load uploaded images from this server)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running", timestamp: new Date() });
});

// API Routes
app.use("/api/auth", userRoutes);
app.use("/api/events", advancedEventRoutes);
app.use("/api/registrations", advancedRegistrationRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/participants", participantsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email Service: ${process.env.SMTP_HOST || "Not configured"}`);
  console.log(`📦 Database: ${process.env.MONGODB_URI || "Not configured"}`);
});
