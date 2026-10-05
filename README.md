# ZEDSMS — web app

Marketing site and customer portal for [ZEDSMS](https://zedsms.com): private and shared
phone numbers for receiving SMS in the US, UK, Canada and Australia.

- **Landing site** — `/`, `/features`, `/pricing`, `/about`, legal pages
- **Auth** — `/auth/signin`, `/auth/signup`, email verification, 2FA, Google / Apple / Telegram
- **Portal** — `/app/*`: dashboard, My Numbers, buy, top up, transfer, transactions, settings

Built with React 19, Vite, Tailwind CSS 4 (landing) and React Query. The API is the
Laravel backend (`zedsms-backend`).

## Getting started

```bash
npm install
cp .env.example .env.local   # or create .env.local — see below
npm run dev                  # http://localhost:5173
npm run dev:mobile           # same, exposed on your LAN to test on a phone
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run dev:mobile` | Dev server reachable from other devices on the network |
| `npm run build` | Type-check and build to `dist/` (what Vercel runs) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |
| `npm run generate:countries` | Regenerate `src/data/countries.generated.ts` |

## Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API, e.g. `https://control.zedsms.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google sign-in (button hidden when unset) |
| `VITE_APPLE_SERVICE_ID`, `VITE_APPLE_REDIRECT_URI` | Apple sign-in |
| `VITE_TELEGRAM_OPENID_CLIENT_ID`, `VITE_TELEGRAM_OPENID_REDIRECT_URI` | Telegram sign-in (OpenID) |
| `VITE_TELEGRAM_BOT` | Telegram bot — login widget fallback and notification channel |
| `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME` | Realtime updates (Laravel Reverb) |

On Vercel, set these under **Settings → Environment Variables** and redeploy — Vite bakes
them in at build time.

## Project layout

```
src/
  pages/        landing + auth pages (TypeScript, Tailwind)
  components/   landing sections, Navbar, Footer, social sign-in
  assets/       images, named by what they show (icon-*, flag-*, badge-*, …)
  portal/       the logged-in app (JSX, inline styles)
    api/        one module per backend area; all calls go through api/client.js
    hooks/      React Query hooks around the api modules
    screens/    portal screens
    components/ shell (Sidebar, Topbar) and ui/ primitives
```
