/**
 * Backend URL for server-side proxy routes.
 * Priority: BACKEND_URL env var → hardcoded production URL
 * Never falls back to localhost in production.
 */
export const BACKEND =
  process.env.BACKEND_URL ||
  "https://goodvibes-backend-production.up.railway.app";
