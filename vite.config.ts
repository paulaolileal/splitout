import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "generateSW",
      includeAssets: ["favicon.png"],
      manifest: {
        name: "Splitout! — Divida o rolê",
        short_name: "Splitout",
        description: "Divida o rolê. Acerte as contas.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#faf8f2",
        theme_color: "#faf8f2",
        lang: "pt-BR",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        // Data never comes from the cache: Sheets/Drive/OAuth calls always hit the network.
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.hostname.endsWith("googleapis.com") || url.hostname === "accounts.google.com",
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 8080,
  },
  preview: {
    port: 8080,
  },
});
