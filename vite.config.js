import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  esbuild: false,
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
      protocol: "ws",
      clientPort: 5173,
    },
    proxy: {
      "/api": "http://127.0.0.1:8000"
    }
  },
  build: {
    outDir: "frontend-dist"
  }
}));
