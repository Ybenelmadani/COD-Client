import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En local : `npm run dev` (Vite) sur le port 5173, proxy /api vers l'API.
// Soit `vercel dev` (qui sert les deux), soit `node ../api/index.js` (port 3001).
const target = process.env.VITE_API_TARGET || "http://localhost:3001";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target, changeOrigin: true },
    },
  },
  build: { outDir: "dist", sourcemap: false },
});
