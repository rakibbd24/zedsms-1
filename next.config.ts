import type { NextConfig } from "next";

// Build-time settings read by src/lib/env.ts. Until the stage 6 rename, .env files still use
// the VITE_* names, so each NEXT_PUBLIC_* value falls back to its VITE_* twin.
// (vite.config.ts applies the same mapping, so both builds read identical values.)
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
  // self-contained server for the VPS (node .next/standalone/server.js behind Nginx)
  output: "standalone",
  // Vite keeps tsconfig.json / tsconfig.app.json until the cut-over
  typescript: { tsconfigPath: "tsconfig.next.json" },
  // this folder is the project root (a stray ~/package-lock.json otherwise confuses Turbopack)
  turbopack: { root: process.cwd() },
  env,
};

export default nextConfig;
