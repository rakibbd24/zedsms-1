# ZEDSMS — web app

Marketing site and customer portal for [ZEDSMS](https://zedsms.com): private and shared
phone numbers for receiving SMS in the US, UK, Canada and Australia.

- **Landing site** — `/`, `/features`, `/pricing`, `/about`, legal pages — server-rendered by Next.js (SEO)
- **Auth** — `/auth/signin`, `/auth/signup`, email verification, 2FA, Google / Apple / Telegram
- **Portal** — `/app/*`: dashboard, My Numbers, buy, top up, transfer, transactions, settings — a
  React app (React Router) that Next.js loads in the browser only
- **Payment returns** — `/stripe/*`, `/crypto/*`, `/mixpay/*`

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4 and React Query. The API
is the Laravel backend (`zedsms-backend`, `https://control.zedsms.com/api`). The pre-Next version
lives on the `react-zedsms` branch; `NEXT_MIGRATION.md` records how the move was done.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values — see below
npm run dev                  # http://localhost:5173
npm run dev:mobile           # same, reachable from a phone on your Wi-Fi
```

> **Don't run the dev server on port 3000.** The backend's Sanctum config treats
> `localhost:3000` as its own SPA and rejects API calls from it with **419** (sign-in fails).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (port 5173) |
| `npm run dev:mobile` | Dev server reachable from other devices on the network |
| `npm run build` | Production build (type-check + `.next/`, including the standalone server) |
| `npm run start` | Serve the production build locally (port 4173) |
| `npm run lint` | Lint with oxlint |
| `npm run generate:countries` | Regenerate `src/data/countries.generated.ts` |
| `./scripts/build-standalone.sh` | Production build + copy static files → `.next/standalone/` (what the VPS runs) |

## Environment variables

Put them in `.env.local` for development and `.env.production.local` on the server. All are
**public** and **baked in at build time** — rebuild after changing them, and never put a secret
here (client secrets, bot tokens, payment keys belong in the backend's `.env`).

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API, e.g. `https://control.zedsms.com/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in (button hidden when unset) |
| `NEXT_PUBLIC_APPLE_SERVICE_ID`, `NEXT_PUBLIC_APPLE_REDIRECT_URI` | Apple sign-in |
| `NEXT_PUBLIC_TELEGRAM_OPENID_CLIENT_ID`, `NEXT_PUBLIC_TELEGRAM_OPENID_REDIRECT_URI` | Telegram sign-in (OpenID) |
| `NEXT_PUBLIC_TELEGRAM_BOT` | Telegram bot — login widget fallback and notification channel |
| `NEXT_PUBLIC_REVERB_APP_KEY`, `NEXT_PUBLIC_REVERB_HOST`, `NEXT_PUBLIC_REVERB_PORT`, `NEXT_PUBLIC_REVERB_SCHEME` | Realtime updates (Laravel Reverb) |

The old `VITE_*` names still work as a fallback (see `next.config.ts`).

## Deploy (VPS — AlmaLinux 9 + cPanel/WHM)

The site runs as one small Node.js server (`.next/standalone/server.js`) on `127.0.0.1:3005`;
Apache (cPanel) forwards `zedsms.com` to it. Two ways to run it — pick one.

### 1. One-time server setup (root, via SSH)

```bash
# Node.js 22 (Next.js 16 needs 20.9+)
dnf module install -y nodejs:22        # or: WHM → EasyApache 4 → ea-nodejs22
node -v

# where the site lives — inside the cPanel account that owns zedsms.com
su - CPANELUSER
git clone https://github.com/rakibbd24/zedsms-1.git ~/zedsms-web
cd ~/zedsms-web
cp .env.example .env.production.local && nano .env.production.local   # fill in the values
./scripts/build-standalone.sh
```

### 2a. Option A — cPanel Application Manager (easiest, managed by cPanel)

1. WHM → **EasyApache 4** → install `ea-ruby27-mod_passenger`, `ea-apache24-mod_env` and `ea-nodejs22`.
2. cPanel (account of zedsms.com) → **Application Manager** → **Register Application**:
   - Domain: `zedsms.com` · Base URL: `/`
   - Application path: `zedsms-web/.next/standalone`
   - Deployment environment: Production
   - Environment variable: `HOSTNAME` = `127.0.0.1` (cPanel/Passenger sets the port itself)
3. Startup file is `server.js`. Save — cPanel starts it and keeps it running.

### 2b. Option B — PM2 + Apache reverse proxy (more control)

```bash
npm install -g pm2
cd ~/zedsms-web && pm2 start ecosystem.config.cjs && pm2 save
pm2 startup        # run the command it prints (as root) so the site starts after a reboot
```

Then, as root, install `deploy/apache-proxy.conf` as described at the top of that file
(cPanel userdata include → `/scripts/rebuildhttpdconf && /scripts/restartsrv_httpd`).
Needs `mod_proxy` and `mod_proxy_http` (WHM → EasyApache 4 → Apache Modules).

### 3. Domain, HTTPS and providers

- Point `zedsms.com` (and `www`) DNS to this server; issue the certificate with cPanel **AutoSSL**.
- Google Cloud Console → OAuth client → **Authorised JavaScript origins**: `https://zedsms.com`.
- Apple / Telegram: redirect URIs on `https://zedsms.com/...`.
- Payment gateways (Stripe, NOWPayments/crypto, MixPay): return URLs `https://zedsms.com/<gateway>/success|cancel`.
- Backend CORS already allows any origin (`Access-Control-Allow-Origin: *`).

### Updating the site

```bash
cd ~/zedsms-web && git pull && ./scripts/build-standalone.sh
pm2 restart zedsms-web            # option B
# option A: cPanel → Application Manager → Restart
```

## Project layout

```
src/
  app/          Next.js routes: landing + auth pages, /app/[[...slug]] (portal), /[gateway]/[outcome],
                layout (metadata, providers), sitemap.ts, robots.ts
  views/        page components rendered by the routes; PortalRouter/ClientPortal mount the portal
  components/   landing sections, Navbar, Footer, social sign-in, JSON-LD
  lib/          env.ts (all build-time settings), seo.ts (page metadata), navState.ts (sign-in hand-offs)
  portal/       the logged-in app (JSX, inline styles, React Router)
    api/        one module per backend area; all calls go through api/client.js
    hooks/      React Query hooks around the api modules
    screens/    portal screens
    components/ shell (Sidebar, Topbar) and ui/ primitives
public/
  assets/       images, named by what they show (icon-*, flag-*, badge-*, …)
deploy/         Apache reverse-proxy config for the VPS
```
