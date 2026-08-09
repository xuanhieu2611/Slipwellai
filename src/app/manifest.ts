import type { MetadataRoute } from "next";

/**
 * Served at `/manifest.webmanifest`. Kept in code so the install identity,
 * theme colours, and icon set stay in one place with the design tokens.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Slipwell",
    short_name: "Slipwell",
    description: "Capture anything. Nothing important slips through.",
    // An installed launch goes to the daily view; signed-out launches are redirected to sign-in.
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#eef1f6",
    theme_color: "#2348c8",
    categories: ["productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
