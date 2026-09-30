import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TMB 2027 — 걸어야 산다!",
    short_name: "TMB 2027",
    description: "2027 Tour du Mont-Blanc 원정 일정·산장·예산",
    start_url: "/",
    display: "standalone",
    background_color: "#EEF1EC",
    theme_color: "#EEF1EC",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
