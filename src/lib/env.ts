// Every build-time setting the app reads, in one place. Values are baked into the bundle at
// build time and are all public (client ids, the API URL, the Reverb key) — never put a
// secret here. Defaults are applied where each value is used, as before.
//
// Vite exposes VITE_* through import.meta.env; at the Next.js switch only this file changes
// (to literal process.env.NEXT_PUBLIC_* reads) — see NEXT_MIGRATION.md, stage 6.
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  appleServiceId: import.meta.env.VITE_APPLE_SERVICE_ID || "",
  appleRedirectUri: import.meta.env.VITE_APPLE_REDIRECT_URI || "",
  telegramBot: import.meta.env.VITE_TELEGRAM_BOT || "",
  telegramOpenIdClientId: import.meta.env.VITE_TELEGRAM_OPENID_CLIENT_ID || "",
  telegramOpenIdRedirectUri: import.meta.env.VITE_TELEGRAM_OPENID_REDIRECT_URI || "",
  reverbAppKey: import.meta.env.VITE_REVERB_APP_KEY || "",
  reverbHost: import.meta.env.VITE_REVERB_HOST || "",
  reverbPort: import.meta.env.VITE_REVERB_PORT || "",
  reverbScheme: import.meta.env.VITE_REVERB_SCHEME || "",
  isDev: import.meta.env.DEV,
};
