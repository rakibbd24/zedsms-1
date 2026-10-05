import type { NextConfig } from "next";

// Build-time settings read by src/lib/env.ts (NEXT_PUBLIC_*, baked in at build time). Each
// falls back to the pre-migration VITE_* name, so an old .env file still builds correctly.
const ENV_NAMES = [
  "API_BASE_URL",
  "GOOGLE_CLIENT_ID",
  "APPLE_SERVICE_ID",
  "APPLE_REDIRECT_URI",
  "TELEGRAM_BOT",
  "TELEGRAM_OPENID_CLIENT_ID",
  "TELEGRAM_OPENID_REDIRECT_URI",
  "REVERB_APP_KEY",
  "REVERB_HOST",
  "REVERB_PORT",
  "REVERB_SCHEME",
];
const env = Object.fromEntries(
  ENV_NAMES.map((n) => [`NEXT_PUBLIC_${n}`, process.env[`NEXT_PUBLIC_${n}`] ?? process.env[`VITE_${n}`] ?? ""]),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // hide the "N" dev-tools button in `next dev` (it sat over the portal sidebar);
  // build errors still show as an overlay. Never shipped in production builds anyway.
  devIndicators: false,
  // self-contained server for the VPS: node .next/standalone/server.js (see README → Deploy)
  output: "standalone",
  // this folder is the project root (a stray ~/package-lock.json otherwise confuses Turbopack)
  turbopack: { root: process.cwd() },
  env,
};

export default nextConfig;
