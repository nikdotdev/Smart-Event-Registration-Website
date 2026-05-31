import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Home } from "./pages/Home";
import { EventDetails } from "./pages/EventDetails";
import { MyEvents } from "./pages/MyEvents";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProfilePage } from "./pages/ProfilePage";
import { lazy, Suspense } from "react";

const MyTicketsPage = lazy(() => import("./pages/MyTicketsPage"));
const ParticipantsManagementPage = lazy(() =>
  import("./pages/ParticipantsManagementPage")
);
const AttendanceVerificationPage = lazy(() =>
  import("./pages/AttendanceVerificationPage")
);
const AdminDashboardAnalytics = lazy(() =>
  import("./pages/AdminDashboardAnalytics")
);
import "./styles/App.css";

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/event/:id" element={<EventDetails />} />
              <Route
                path="/my-events"
                element={
                  <ProtectedRoute>
                    <MyEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<div className="loading">Loading...</div>}>
                      <MyTicketsPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Suspense fallback={<div className="loading">Loading...</div>}>
                      <AdminDashboardAnalytics />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events/:eventId/participants"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Suspense fallback={<div className="loading">Loading...</div>}>
                      <ParticipantsManagementPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events/:eventId/attendance"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Suspense fallback={<div className="loading">Loading...</div>}>
                      <AttendanceVerificationPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
