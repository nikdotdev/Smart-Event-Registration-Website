import { API_ORIGIN } from "../services/api";

/**
 * Turn stored paths (/uploads/...) into URLs the browser can load.
 * Uploads are served by the Express backend, not the Vite dev server.
 */
export const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/uploads")) {
    return `${API_ORIGIN}${url}`;
  }
  return url;
};

/** Fallback when remote placeholder URLs fail to load */
export const FALLBACK_EVENT_IMAGE =  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300">
      <rect width="500" height="300" fill="#e5e7eb"/>
      <text x="250" y="155" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="20">Event Image</text>
    </svg>`
  );

export const handleEventImageError = (e) => {
  const fallback = FALLBACK_EVENT_IMAGE;
  if (e.currentTarget.src !== fallback) {
    e.currentTarget.src = fallback;
  }
};