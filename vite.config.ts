import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // three (incl. three/webgpu + three/tsl) is the heaviest dep —
          // split it out so app-only changes don't bust its cached chunk.
          if (id.includes("/three/")) return "three";
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.test.{ts,tsx}",
      ],
      reporter: ["text", "html"],
    },
  },
});
