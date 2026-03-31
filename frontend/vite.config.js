import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // necessário para funcionar dentro do Docker
    port: 5173,
    watch: {
      usePolling: true, // necessário para hot-reload funcionar no Docker/WSL
    },
    proxy: {
      // Redireciona chamadas /api para o container do backend
      "/api": {
        target: "http://backend:3001",
        changeOrigin: true,
      },
    },
  },
});
