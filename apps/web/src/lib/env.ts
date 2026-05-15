/**
 * Front-end runtime configuration.
 *
 * Vite inlines `import.meta.env.*` at build time. `VITE_API_BASE_URL` should
 * already include the `/api/v1` prefix (see `.env.example`).
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api/v1";
