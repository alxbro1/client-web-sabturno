import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // Example: VITE_BASE_PATH=/app/ for production subpath deploys.
    base: "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("react") || id.includes("scheduler") || id.includes("react-router")) {
              return "react-vendor";
            }

            if (id.includes("date-fns") || id.includes("date-fns-tz")) {
              return "date-vendor";
            }

            if (id.includes("axios")) {
              return "http-vendor";
            }

            if (id.includes("zustand")) {
              return "state-vendor";
            }
          },
        },
      },
    },
  };
});