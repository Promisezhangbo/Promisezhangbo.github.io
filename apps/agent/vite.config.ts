import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import qiankun from "vite-plugin-qiankun";

const isDev = process.env.NODE_ENV === "development";

// https://vite.dev/config/
export default defineConfig({
  base: isDev ? "/" : "/agent/",
  plugins: [
    react(),
    qiankun("agent", {
      useDevMode: true
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    outDir: "../../dist/agent"
  },
  server: {
    host: true,
    hmr: false,
    port: 9001,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  }
});
