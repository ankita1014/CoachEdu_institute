/**
 * resolveFileUrl.js
 *
 * Rewrites stale local file paths to use the correct backend base URL.
 *
 * - Cloudinary URLs (https://res.cloudinary.com/...) → passed through unchanged
 * - Full http/https URLs that are NOT localhost → passed through unchanged
 * - Relative paths (/uploads/...) or localhost URLs → rewritten to VITE_BACKEND_URL
 * - Empty / null / undefined → returns ""
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

export const resolveFileUrl = (url) => {
  if (!url) return "";

  // Already a valid Cloudinary or external HTTPS URL — use as-is
  if (url.startsWith("https://res.cloudinary.com")) return url;
  if (url.startsWith("https://") && !url.includes("localhost")) return url;

  // Relative path like /uploads/homework/file.pdf
  if (url.startsWith("/uploads/")) {
    return BACKEND_URL ? `${BACKEND_URL}${url}` : url;
  }

  // Full localhost URL — swap the origin
  if (url.includes("localhost")) {
    try {
      const parsed = new URL(url);
      return BACKEND_URL
        ? `${BACKEND_URL}${parsed.pathname}`
        : url;
    } catch {
      return url;
    }
  }

  return url;
};
