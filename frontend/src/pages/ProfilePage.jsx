import { useState, useEffect, useRef } from "react";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import { resolveMediaUrl } from "../utils/eventImage";
import "../styles/Profile.css";

export const ProfilePage = () => {
  const { user: authUser, updateUser } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    bio: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data } = await authAPI.getMe();
      setUser(data.user);
      setFormData({
        fullName: data.user.fullName || "",
        phone: data.user.phone || "",
        bio: data.user.bio || "",
      });
    } catch {
      addToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const persistUser = (updated) => {
    const normalized = {
      id: updated.id || updated._id,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      bio: updated.bio,
      avatar: updated.avatar,
      role: updated.role,
      isEmailVerified: updated.isEmailVerified,
      theme: updated.theme,
    };
    setUser(normalized);
    updateUser(normalized);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authAPI.updateProfile(formData);
      persistUser(data.user);
      setEditMode(false);
      addToast("Profile updated successfully", "success");
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to update profile",
        "error"
      );
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast("Please choose an image file", "error");
      return;
    }

    try {
      setUploadingAvatar(true);
      const { data } = await authAPI.uploadAvatar(file);
      persistUser(data.user);
      addToast("Profile photo updated", "success");
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to upload photo",
        "error"
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleThemeToggle = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setThemeMode(nextTheme);
    try {
      const { data } = await authAPI.setTheme(nextTheme);
      persistUser(data.user);
      addToast(`Theme set to ${nextTheme}`, "success");
    } catch (error) {
      setThemeMode(theme);
      addToast(
        error.response?.data?.message || "Failed to update theme",
        "error"
      );
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast("New passwords do not match", "error");
      return;
    }

    try {
      await authAPI.changePassword(passwordData);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      addToast("Password changed successfully", "success");
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to change password",
        "error"
      );
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  const displayUser = user || authUser;
  const src = resolveMediaUrl(displayUser?.avatar);

  return (
    <div className="profile-container">
      <h1>My Profile</h1>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            {src ? (
              <img
                src={src}
                alt={displayUser?.fullName}
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {displayUser?.fullName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="profile-avatar-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
              <p className="profile-hint">
                {uploadingAvatar
                  ? "Uploading..."
                  : "JPEG, PNG, GIF or WebP (max 2MB)"}
              </p>
            </div>
          </div>

          <div className="profile-meta">
            <h2>{displayUser?.fullName}</h2>
            <p>{displayUser?.email}</p>
            <span
              className={`profile-badge ${
                displayUser?.role === "admin" ? "role-admin" : "role-user"
              }`}
            >
              {displayUser?.role === "admin" ? "Admin" : "User"}
            </span>
            <span
              className={`profile-badge ${
                displayUser?.isEmailVerified ? "verified" : "unverified"
              }`}
            >
              {displayUser?.isEmailVerified
                ? "Email verified"
                : "Email not verified"}
            </span>
          </div>
        </div>

        {!displayUser?.isEmailVerified && (
          <p className="profile-hint" style={{ marginBottom: 20 }}>
            Email verification is not enabled yet. Your account works normally;
            this status will update once verification is added.
          </p>
        )}

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Tell others a bit about yourself"
              />
            </div>
            <div className="profile-actions">
              <button type="submit" className="profile-btn profile-btn-primary">
                Save changes
              </button>
              <button
                type="button"
                className="profile-btn profile-btn-secondary"
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    fullName: displayUser?.fullName || "",
                    phone: displayUser?.phone || "",
                    bio: displayUser?.bio || "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-field">
              <label>Phone</label>
              <p>{displayUser?.phone || "Not provided"}</p>
            </div>
            <div className="profile-field">
              <label>Bio</label>
              <p>{displayUser?.bio || "No bio yet"}</p>
            </div>
            <button
              type="button"
              className="profile-btn profile-btn-primary"
              onClick={() => setEditMode(true)}
            >
              Edit profile
            </button>
          </>
        )}
      </div>

      <div className="profile-card">
        <h3 className="profile-section-title">Appearance</h3>
        <div className="profile-theme-row">
          <div>
            <p>
              Theme: <strong>{theme}</strong>
            </p>
            <p className="profile-hint">Saved to your account</p>
          </div>
          <button
            type="button"
            className="profile-btn profile-btn-secondary"
            onClick={handleThemeToggle}
          >
            Switch to {theme === "light" ? "dark" : "light"}
          </button>
        </div>
      </div>

      <div className="profile-card">
        <h3 className="profile-section-title">Security</h3>
        {showPasswordForm ? (
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label>Current password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Confirm new password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                required
                minLength={6}
              />
            </div>
            <div className="profile-actions">
              <button type="submit" className="profile-btn profile-btn-primary">
                Update password
              </button>
              <button
                type="button"
                className="profile-btn profile-btn-secondary"
                onClick={() => setShowPasswordForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="profile-btn profile-btn-warning"
            onClick={() => setShowPasswordForm(true)}
          >
            Change password
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
