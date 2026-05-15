import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// NutriMate web — Vite dev/build config.
// The dev server runs on :5173; API calls go straight to the API gateway
// using VITE_API_BASE_URL (default http://localhost:4000/api/v1). The API
// enables permissive CORS in dev, so no proxy is required.
export default defineConfig({
  plugins: [react()],
  // Read env vars from the monorepo root .env so VITE_API_BASE_URL is shared
  // with the rest of the stack. Only VITE_-prefixed vars reach the client.
  envDir: "../../",
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
});
