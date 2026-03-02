import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import qiankun from "vite-plugin-qiankun";

const isDev = process.env.NODE_ENV === "development";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    qiankun("blog", {
      useDevMode: true
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    outDir: "../../dist/blog"
  },
  base: isDev ? "/" : "/blog/",
  server: {
    port: 9002,
    cors: true,
    hmr: false,
    headers: {
      "access-control-allow-origin": "*"
    }
  }
});
