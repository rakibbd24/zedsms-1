// Every build-time setting the app reads, in one place. Values are baked into the bundle at
// build time and are all public (client ids, the API URL, the Reverb key) — never put a
// secret here. Defaults are applied where each value is used, as before.
//
// Each read must stay a literal `process.env.NEXT_PUBLIC_*` expression — Next.js inlines
// exactly that text at build time (next.config.ts `env`).
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  appleServiceId: process.env.NEXT_PUBLIC_APPLE_SERVICE_ID || "",
  appleRedirectUri: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || "",
  telegramBot: process.env.NEXT_PUBLIC_TELEGRAM_BOT || "",
  telegramOpenIdClientId: process.env.NEXT_PUBLIC_TELEGRAM_OPENID_CLIENT_ID || "",
  telegramOpenIdRedirectUri: process.env.NEXT_PUBLIC_TELEGRAM_OPENID_REDIRECT_URI || "",
  reverbAppKey: process.env.NEXT_PUBLIC_REVERB_APP_KEY || "",
  reverbHost: process.env.NEXT_PUBLIC_REVERB_HOST || "",
  reverbPort: process.env.NEXT_PUBLIC_REVERB_PORT || "",
  reverbScheme: process.env.NEXT_PUBLIC_REVERB_SCHEME || "",
  isDev: process.env.NODE_ENV !== "production",
};
