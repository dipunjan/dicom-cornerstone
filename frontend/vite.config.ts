import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteCommonjs()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["@cornerstonejs/dicom-image-loader"],
    include: ["dicom-parser", "@cornerstonejs/core", "@cornerstonejs/tools"],
  },
  worker: {
    format: "es",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          cornerstone: ["@cornerstonejs/core", "@cornerstonejs/tools"],
          dicom: ["@cornerstonejs/dicom-image-loader"],
        },
      },
    },
  },
});
