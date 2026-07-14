import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // En mode dev, les appels /api sont relayés vers le serveur Express
    proxy: { "/api": "http://localhost:3000" },
  },
});
