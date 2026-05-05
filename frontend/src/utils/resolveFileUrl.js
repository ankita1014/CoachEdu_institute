/**
 * resolveFileUrl.js
 *
 * Rewrites stale local file paths to use the correct backend base URL.
 *
 * - Cloudinary URLs (https://res.cloudinary.com/...) → passed through unchanged
 * - Any other https:// URL that isn't localhost → passed through unchanged
 * - Relative /uploads/... paths or localhost URLs → rewritten to backend base URL
 * - Empty / null / undefined → returns ""
 *
 * Backend base URL is resolved from (in priority order):
 *   1. VITE_BACKEND_URL  (e.g. https://coachedu-institute.onrender.com)
 *   2. VITE_API_URL with /api stripped  (e.g. https://coachedu-institute.onrender.com/api → https://coachedu-institute.onrender.com)
 */

const rawApiUrl  = (import.meta.env.VITE_API_URL  || "").replace(/\/+$/, "");
const rawBackend = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

// Derive backend base: prefer explicit VITE_BACKEND_URL, else strip /api from VITE_API_URL
const BACKEND_BASE = rawBackend || rawApiUrl.replace(/\/api$/, "");

export const resolveFileUrl = (url) => {
  if (!url) return "";

  // Already a Cloudinary URL — always valid in production
  if (url.startsWith("https://res.cloudinary.com")) return url;

  // Any other full https URL that isn't localhost — pass through
  if (url.startsWith("https://") && !url.includes("localhost")) return url;

  // Relative path like /uploads/homework/file.pdf
  if (url.startsWith("/uploads/")) {
    return BACKEND_BASE ? `${BACKEND_BASE}${url}` : url;
  }

  // Full localhost URL — swap the origin with the real backend
  if (url.includes("localhost")) {
    try {
      const parsed = new URL(url);
      return BACKEND_BASE ? `${BACKEND_BASE}${parsed.pathname}` : url;
    } catch {
      return url;
    }
  }

  return url;
};
