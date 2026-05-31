import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import "../styles/Navbar.css";

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🎉 Event Planner
        </Link>

        <ul className="navbar-menu">
          <li className="navbar-theme-toggle">
            <ThemeToggle />
          </li>
          <li>
            <Link to="/">Home</Link>
          </li>

          {isAuthenticated ? (
            <>
              {user?.role === "admin" && (
                <li>
                  <Link to="/admin">Admin Dashboard</Link>
                </li>
              )}
              <li>
                <Link to="/my-events">My Events</Link>
              </li>
              <li>
                <Link to="/my-tickets">My Tickets</Link>
              </li>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <span className="user-name">{user?.fullName}</span>
              </li>
              <li>
                <button className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};
