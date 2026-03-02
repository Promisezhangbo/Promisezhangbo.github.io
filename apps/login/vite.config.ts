import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import qiankun from "vite-plugin-qiankun";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    qiankun("login", {
      useDevMode: true
    })
  ],
  build: {
    outDir: "../../dist/login"
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  base: "/login/",
  server: {
    port: 9003,
    hmr: false,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    cors: true
  }
});
