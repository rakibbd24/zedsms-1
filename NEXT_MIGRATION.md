# ZEDSMS — Next.js migration: context & plan

**Goal:** move the landing site to Next.js for SEO, in **one project** that also hosts the
existing portal — **approach A**: the portal is kept as-is (React Router) and mounted inside
a client-only Next.js catch-all route.

**Status:** Stage 5 done (SEO layer) — stage 4 real-account test still with you — next: Stage 6 (cut-over + VPS).
On this branch the Vite build no longer works for landing/auth pages (they use `next/link` / `next/navigation`) —
use `npm run next:build` / `next:start`; `main` keeps the live Vite site until stage 6. Update the progress log at the bottom after every stage.

---

## 1. Golden rules (apply to every stage)

1. **No design or layout changes.** Every landing/auth page must look pixel-identical before
   and after — proven by screenshot comparison (§7), not by eye. The portal is not screenshotted
   (its code isn't changed); it's covered by the manual checklist (§8).
2. **Stack change only.** No feature changes, no refactors beyond what the move requires,
   no "while we're here" fixes. Bugs found along the way go to §9, not into the migration.
3. **The portal (`src/portal/`) is touched only where routing glue requires it.**
   Its screens, API modules, hooks and inline styles stay as they are.
4. **One stage at a time.** Each stage ends with: build passes → screenshots match → manual
   checklist passes → commit. Never start a stage on top of a failing one.
5. **Work on a branch** (`next-migration`); `main` stays deployable throughout.
6. **Backend is not changed** by this migration (`zedsms-backend`, API at `control.zedsms.com/api`).

---

## 2. Current state (the "before" we must match)

### Stack
| | |
|---|---|
| Framework | React 19.2, client-side rendered SPA (`src/main.tsx` → `createRoot`) |
| Build | Vite 8 (`vite.config.ts`, `@vitejs/plugin-react`, `@tailwindcss/vite`) |
| Routing | `react-router-dom` 7 (`BrowserRouter` in `src/App.tsx`) |
| Styling | Landing: Tailwind CSS 4 (`src/index.css`, `@theme` tokens, Google Fonts `@import`). Portal: inline styles + injected `<style>` blocks (`src/portal/App.jsx` `appCss`) |
| Data | `@tanstack/react-query` 5 — **one** `QueryClient` in `src/App.tsx` (portal uses it too) |
| Auth | `AuthProvider` (`src/portal/context/AuthContext.jsx`) wraps the router; session = `localStorage` `zedsms-token` / `zedsms-user` |
| Realtime | `laravel-echo` + `pusher-js` (Laravel Reverb), portal only |
| Language | Landing + auth: TypeScript (`.tsx`). Portal: JavaScript (`.jsx`/`.js`) |
| Hosting today | Vercel (`vercel.json` SPA rewrite) · target: user's VPS with Nginx |

### Routes (`src/App.tsx`)
| Path | Component | Type |
|---|---|---|
| `/` | `pages/Home.tsx` | landing (SEO) |
| `/features` | `pages/Features.tsx` (lazy) | landing (SEO) |
| `/pricing` | `pages/Pricing.tsx` (lazy) | landing (SEO) |
| `/about` | `pages/About.tsx` (lazy) | landing (SEO) |
| `/privacy-policy`, `/terms-of-service` | `pages/PrivacyPolicy.tsx`, `pages/TermsOfService.tsx` (lazy) | landing (SEO) |
| `/auth/signin`, `/auth/signup` | `pages/Auth.tsx` inside `GuestRoute` | auth (no-index) |
| `/auth/verify-email` | `pages/EmailVerification.tsx` | auth |
| `/auth/verify-otp` | `pages/OTPVerification.tsx` | auth |
| `/auth/telegram/callback` | `pages/TelegramCallback.tsx` | auth |
| `/verification-success` | `pages/VerificationSuccess.tsx` | auth |
| `/stripe/success`, `/stripe/cancel`, `/crypto/*`, `/mixpay/*` *(Binance, Payeer, Perfect Money retired in stage 4)* | `portal/screens/PaymentReturn.jsx` inside `ProtectedRoute` | payment gateway return URLs — **paths must not change** (configured at the gateways) |
| `/app/*` | `pages/Portal.tsx` → `portal/App.jsx` (own nested `<Routes>`) inside `ProtectedRoute` | portal (no-index) |
| `*` | `pages/NotFound.tsx` | 404 |

Portal inner routes (`portal/App.jsx`): `/app/home`, `/app/numbers`, `/app/numbers/:numberKey`,
`/app/buy` (reads `?type=&country=&service=` from Quick buy), `/app/topup`, `/app/transfer`,
`/app/transactions`, `/app/settings` (`?tab=`), `/app/*` → redirect to `/app/home`.

### Things that will break under Next.js (found by code scan)
| # | Issue | Where | Count |
|---|---|---|---|
| G1 | **`src/pages/` is a reserved folder** — Next treats it as the Pages Router and would turn every file into a route | `src/pages/` | 13 files |
| G2 | **Image imports** return an object (`{src,width,height}`) in Next, not a URL string — every `<img src={img}>` and CSS `url()` would break | `src/components`, `src/pages` | 95 imports (88 files in `src/assets/`) |
| G3 | **`import.meta.env.VITE_*`** doesn't exist in Next (`process.env.NEXT_PUBLIC_*`) | `SocialAuthButtons.tsx` (6), `api/publicPricing.ts`, `portal/api/client.js`, `portal/api/numbers.js`, `portal/lib/realtime.js` | 10 uses, 11 variables |
| G4 | **Router navigation `state`** (Next's router has none) — carries the 2FA challenge and sign-in notices | `SocialAuthButtons.tsx:108`, `Auth.tsx:169,213`, `OTPVerification.tsx:15,31,61`, `TelegramCallback.tsx:26,36` | 8 |
| G5 | **`react-router-dom` in landing/auth files** (`Link`, `useNavigate`, `useLocation`) | 16 files (list in §3 stage 3) | 25 `<Link>`, 13 `useNavigate`, 12 `useLocation` |
| G6 | **Module-scope `window`** crashes server rendering | `SocialAuthButtons.tsx:22` (`window.location.origin`) | 1 |
| G7 | **`useSearchParams` needs a `<Suspense>` boundary** in Next or static rendering fails | `Auth.tsx` (`?expired=1`) | 1 |
| G8 | **Portal redirects to non-portal paths** (`<Navigate to="/auth/signin">`) change the URL inside React Router but Next won't render the new page — must be full navigations | `portal/components/ProtectedRoute.jsx`, `GuestRoute.jsx` | 2 files |
| G9 | `ScrollToTop`, lazy routes, `Suspense` loader, `main.tsx`, `index.html`, `vercel.json` rewrite — Vite-specific shell, replaced by Next equivalents | `src/App.tsx`, root | — |
| G10 | `index.html` holds title, description, OG/Twitter tags, theme colour, favicon | `index.html` | move to Next `metadata` |
| G11 | Home `#faq` hash scroll is done manually after navigation | `pages/Home.tsx` | 1 |

Browser-only code that is already safe (runs inside effects/handlers): `Collapse.tsx`,
`PricingCalculator.tsx`, `CountrySelect.tsx`, `useReveal.ts`, `EmailVerification.tsx`,
the rest of `SocialAuthButtons.tsx`.

---

## 3. Target architecture

```
src/
  app/                              ← Next.js App Router (new)
    layout.tsx                        <html>, global CSS, metadata defaults, <Providers>
    providers.tsx  ("use client")     QueryClientProvider + AuthProvider (same as today)
    page.tsx                          /            → renders views/Home
    features/page.tsx                 /features
    pricing/page.tsx                  /pricing
    about/page.tsx                    /about
    privacy-policy/page.tsx, terms-of-service/page.tsx
    auth/signin/page.tsx … auth/telegram/callback/page.tsx, verification-success/page.tsx
    app/[[...slug]]/page.tsx          /app/*  → client-only mount of the existing portal (React Router)
    [gateway]/[outcome]/[[...rest]]/page.tsx   payment return URLs → client-only PaymentReturn; 404 for unknown gateways
    not-found.tsx                     404
    sitemap.ts, robots.ts             (SEO stage)
  views/                            ← was src/pages/ (renamed, G1) — same components, routing hooks swapped
  components/                       ← landing components (unchanged visually)
  portal/                           ← unchanged except routing glue (G8)
public/
  assets/                           ← was src/assets/ (G2), same file names
```

- Each `app/**/page.tsx` is a thin **server** file: exports `metadata` (SEO) and renders the
  existing view component. Views/components that use hooks get `"use client"` — they are
  still **server-rendered to HTML**, which is what SEO needs.
- **Portal and payment returns render client-only** (`next/dynamic` with `ssr: false`) inside a
  `BrowserRouter`, exactly as today. They never need SEO.
- **Hosting:** Next.js server (`output: "standalone"`) run by PM2 behind Nginx on the VPS.

---

## 4. Key decisions

| Decision | Choice | Why |
|---|---|---|
| Approach | **A** — portal kept as-is in a client-only catch-all | user-approved; least risk to payments/portal |
| Images (G2) | **Move `src/assets/` → `public/assets/`**, imports become path strings (`"/assets/hero/…"`) | works identically in Vite *and* Next, so it can be done and verified **before** the switch; no bundler-specific config |
| Env vars (G3) | Read through one module `src/lib/env.ts`; rename to `NEXT_PUBLIC_*` at the switch | one file to change at cut-over; `.env.local`, `.env.example`, VPS `.env.production.local` renamed together |
| Navigation state (G4) | Small `sessionStorage` hand-off helper (`setNavState` / `takeNavState`) | works with React Router now and Next later; challenge never put in the URL |
| Portal redirects (G8) | Full navigation (`window.location.replace`) for any target outside `/app` | Next must render the target page |
| Next version | latest stable at Stage 2 (check React 19.2 peer range) | |
| Rendering of landing pages | Static (SSG) at build | fastest; pricing calculator still fetches live prices client-side as today |

---

## 5. Stages

### Stage 0 — Prepare & baseline  *(no code changes)* ✅
- [x] Create branch `next-migration` from `main` (plan committed to `main` first: `78dbce8`).
- [x] Build current app, serve `dist/` (`vite preview --port 4173`), capture **baseline screenshots** of every
      landing/auth page at **390px** (phone) and **1440px** (desktop), full page: `/`, `/features`, `/pricing`,
      `/about`, `/privacy-policy`, `/terms-of-service`, `/auth/signin`, `/auth/signup`, 404 → 18 shots in
      `scratch/baseline/public/` (git-ignored).
- [x] Tooling proven deterministic: a second capture of the unchanged build compares **18/18 identical**.
- [x] Recorded: `dist` 2.3 MB, JS 873 KB total. Only console message: Google sign-in "origin not allowed"
      on `localhost:4173` (expected for a local port — keep using port 4173 for every comparison).
- [ ] Manual checklist (§8) on today's app — **owner: you** (portal flows need a real browser session).
- **Exit:** baseline saved ✅ · comparison tool verified ✅.

### Stage 1 — Make the code framework-neutral  *(still Vite; zero visual change)* ✅
Each step is a pure refactor, verified on Vite before moving on.
- [x] **G1** renamed `src/pages/` → `src/views/` (only `App.tsx` imported it).
- [x] **G2** moved `src/assets/` → `public/assets/`; all 95 image imports are now `const img = "/assets/…"` path strings
      (88 unique paths, every one checked to exist).
- [x] **G3** added `src/lib/env.ts`; all 11 `import.meta.env` reads go through it — it's the only file that touches
      `import.meta.env` (same defaults kept at each use).
- [x] **G4** added `src/lib/navState.ts` (sessionStorage, keyed by destination path, read-once, 10-min TTL); the
      8 router-state hand-offs in `SocialAuthButtons`, `Auth`, `OTPVerification`, `TelegramCallback` use it.
- [x] **G6** Telegram OpenID redirect default is computed on click (`telegramOpenIdRedirectUri()`), not at module load.
- **Exit:** build ✅ · screenshots **18/18 identical** to baseline ✅ · `scratch/flows.mjs` hand-off checks **7/7 pass** ✅ ·
  portal smoke test reaches the API through `env.ts` ✅.

### Stage 2 — Next.js scaffold  *(both stacks build; nothing switched yet)* ✅
- [x] Installed `next@16.3.8` (Turbopack) and `@tailwindcss/postcss`; `next.config.ts` (`reactStrictMode`,
      `output: "standalone"`, `turbopack.root`, own `tsconfig.next.json`), `postcss.config.mjs`.
- [x] Coexistence: Vite ignores `postcss.config.mjs` (inline `css.postcss`); `tsconfig.next.json` excludes the
      Vite-only `src/main.tsx` / `src/App.tsx`; Node types added to `tsconfig.app.json`.
- [x] **Env (changed vs plan, simpler cut-over):** `src/lib/env.ts` now reads literal `process.env.NEXT_PUBLIC_*`;
      `next.config.ts` `env` and `vite.config.ts` `define` both map them from the existing `VITE_*` names, so both
      builds read the same `.env.local`. Stage 6 only renames the keys and drops the Vite `define`.
- [x] `src/app/layout.tsx` (global `index.css`, `metadata` + `viewport` copied from `index.html`),
      `src/app/providers.tsx` (one `QueryClient` + `AuthProvider`), placeholder `src/app/page.tsx`.
- [x] Scripts `next:dev`, `next:build`, `next:start` (port 4174) next to the Vite ones; `.next` ignored.
      **`next:dev` must use port 5173, never 3000:** the backend's Sanctum default stateful list includes
      `localhost:3000`, so API calls from that origin are treated as first-party SPA requests and fail CSRF with
      **419** (sign-in breaks). Verified: same request → 419 from `localhost:3000`, 422 from `localhost:5173`.
- **Exit:** `next build` ✅ (`/` prerendered; head tags, Tailwind + fonts CSS and API URL verified on `next start`) ·
  Vite build ✅ · Vite screenshots **18/18 identical** · hand-off checks **7/7** ✅.

### Stage 3 — Landing & auth pages on Next  *(G5, G7, G9, G11)* ✅
- [x] Routes: `/`, `/features`, `/pricing`, `/about`, `/privacy-policy`, `/terms-of-service`, `/auth/signin`, `/auth/signup`,
      `/auth/verify-email`, `/auth/verify-otp`, `/auth/telegram/callback`, `/verification-success`, `not-found.tsx` —
      thin `src/app/**/page.tsx` files rendering the unchanged views.
- [x] 15 files: `react-router-dom` → `next/link` (`to`→`href`) / `next/navigation` (`navigate(x)`→`router.push`,
      `{replace:true}`→`router.replace`).
- [x] Address-bar reads: sign-in `?expired=1` and verification-success `?status=&token=` via `useSearchParams` with the
      route `dynamic = "force-dynamic"` (server sees the query → no hydration mismatch); Telegram callback and Home
      `#faq` read `window.location` inside effects.
- [x] `src/views/GuestGate.tsx` replaces `GuestRoute` for sign-in/up (renders until the session is known, then
      redirects signed-in users) — server and first client render match.
- [x] `"use client"` on every view (still server-rendered to HTML). `Collapse` (FAQ) renders collapsed in the server
      HTML (initial `max-height` set once) so answers don't flash open before hydration.
- [ ] Per-page `metadata` → moved to stage 5 (layout defaults apply meanwhile).
- **Exit:** `next build` ✅ (landing static, sign-in + verification-success dynamic) · server HTML has real content
  and `<h1>` on every page (home 1,027 words, terms 1,411…) ✅ · unknown URLs return HTTP **404** (Vite returned 200) ·
  **Next screenshots 18/18 identical to the Vite baseline** ✅ · hand-off checks **7/7** on Next ✅ · no hydration errors.
- Notes: `_rsc … ERR_ABORTED` in the shot report = Next link prefetches cancelled when the tool closes the page
  (harmless). The 404 page's "Go to dashboard" prefetch of `/app/home` 404s until stage 4.

### Stage 4 — Portal & payment returns on Next  *(G8)* ✅ (code) · ⏳ real-account test
**Rule for this stage (user):** don't touch the portal — new glue files only. `git diff` of `src/portal/` in this
stage: **none** (the 3 portal files that differ from `main` are stage 1's `env.ts` imports).
- [x] `src/app/app/[[...slug]]/page.tsx` → `views/ClientPortal.tsx` (`next/dynamic`, `ssr: false`, same spinner as
      App.tsx) → `views/PortalRouter.tsx`: the same `BrowserRouter` + `ScrollToTop` + `ProtectedRoute` → `Portal` /
      `PaymentReturn` routes App.tsx had.
- [x] G8 solved **without editing the portal**: a `*` route (`LeaveToNext`) turns any react-router navigation outside
      `/app` (ProtectedRoute's `<Navigate>` to `/auth/signin` / `/auth/verify-email`) into a full page load, so Next
      renders it; never on first render (no reload loops).
- [x] `src/app/[gateway]/[outcome]/page.tsx` → same client portal for payment returns; anything else → real 404.
- [x] **Gateways retired (user decision, option B): Binance, Payeer, Perfect Money.** Live: Stripe, Crypto, MixPay —
      matches `GET /api/payment-gateways`, which only offers those three. Remove the retired return URLs at the
      providers. (`PaymentReturn.jsx` still contains their code paths — harmless, portal not touched.)
- **Exit (automated):** `scratch/portal_checks.mjs` **7/7** — logged-out `/app/home` and `/stripe/success` → sign-in;
  `/stripe/whatever` and the 3 retired gateways → 404; `/crypto/success`, `/mixpay/cancel` accepted; portal shell +
  11 API endpoints with a token; in-portal navigation + Back button without a page reload. Landing **18/18 identical**,
  hand-offs **7/7**.
- [ ] **Exit (you, real account):** §8 portal checklist — sign in, dashboard, buy, a real top-up return (Stripe /
  Crypto / MixPay), transfer, settings, live SMS + toast, logout.

### Stage 5 — SEO layer  *(domain: https://zedsms.com)* ✅
- [x] `src/lib/seo.ts` `pageMetadata()` — per landing page: title (≤60 chars, layout template `%s | ZEDSMS`),
      description (≤160), canonical URL, Open Graph + Twitter with the share image. Copy matches each page's content:
      `/` "Virtual Phone Number for SMS Verification — ZEDSMS", `/features`, `/pricing`, `/about`, legal pages.
- [x] noindex: `/app/*`, payment returns, verify-email/otp, Telegram callback, verification-success (`noindex, nofollow`);
      sign-in/up `noindex, follow` + tab titles "Sign in" / "Create your account".
- [x] `src/app/sitemap.ts` (6 landing URLs) and `src/app/robots.ts` (disallows `/app`, payment paths,
      `/verification-success`; `/auth` left crawlable so its noindex is seen).
- [x] JSON-LD (`components/JsonLd.tsx`): Organization (logo `public/logo.png` 512px, email, app store links) + WebSite
      site-wide; FAQPage (6 Q&A from `components/faqData.ts`, the same source the visible FAQ now renders) + 2 ×
      MobileApplication on `/`.
- [x] Features `<h1>` — already present (the earlier grep missed a multi-line tag); nothing to change.
- **Exit:** every page serves its own title/description/canonical (checked with curl) ✅ · JSON-LD parses ✅ ·
  screenshots **18/18 identical** ✅ · hand-offs **7/7**, portal checks **7/7** ✅.
- [ ] After go-live (you): run https://search.google.com/test/rich-results on `https://zedsms.com/`, submit the sitemap in
  Google Search Console + Bing Webmaster Tools.
- Follow-up idea (not done — changes how data loads): the pricing page's server HTML shows `$ — /mo` placeholders
  because prices load in the browser; fetching them on the server (with hourly revalidation) would put real prices in
  the HTML for Google.

### Stage 6 — Cut-over & cleanup
- [ ] Make Next the default (`dev`, `build`, `start`); remove Vite, `@vitejs/plugin-react`,
      `@tailwindcss/vite`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `vercel.json`.
- [ ] Rename env vars to `NEXT_PUBLIC_*` in `.env.local`, `.env.example`, README.
- [ ] VPS deploy files: Nginx config (proxy to Next, cache `/_next/static/` 1 year), PM2 config, deploy steps in README.
- [ ] Update OAuth/payment settings only if anything changed (paths stay the same).
- **Exit:** production build deployed to a staging subdomain, full §8 checklist + screenshots on
  staging, then DNS switch. **Merge to `main`.**

---

## 6. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Visual drift (fonts, CSS order, Tailwind config) | screenshot diff at every stage; global CSS imported once in `layout.tsx` in the same order as `main.tsx` |
| Hydration mismatches (auth state differs server vs client) | auth-dependent UI renders the signed-out state first (as today), updates after mount |
| Payment return URLs | paths unchanged; tested with a real (small) top-up per gateway used in production |
| 2FA / social sign-in hand-offs | §8 covers email+2FA, Google, Apple, Telegram, OTP expiry notice |
| Realtime / Echo on the server | portal is client-only (`ssr: false`), never imported by server code |
| Asset caching without hashed names (`public/assets`) | Nginx: `/assets/` cached 1 day + `must-revalidate`; `/_next/static/` immutable 1 year |
| Strict Mode double effects | already handled in Buy (Quick buy hand-off) and Telegram setup; recheck in §8 |

---

## 7. Verification protocol (every stage)
1. `npm run build` (and `next build` from Stage 2) — must pass.
2. Landing/auth screenshots at 390px and 1440px compared against `scratch/baseline/public/`:
   serve the build on **port 4173**, then from `scratch/`:
   `node visual.mjs http://localhost:4173 stageN/public && node compare.mjs baseline/public stageN/public`
   (headless Chrome via `puppeteer-core`, fonts awaited, LCD text off; ImageMagick diff with 2% fuzz).
   Any non-zero diff is investigated — red-highlighted diffs land in `stageN/public/diff/`.
3. `curl` each landing page — HTML must contain the page's main heading text (from Stage 3).
4. Manual checklist (§8) on a real browser, desktop + phone.

## 8. Manual regression checklist
**Landing:** home sections & animations · FAQ open/close · `/#faq` from footer · pricing calculator (country select, plan tabs) · use-case carousel · all CTA buttons go to sign-up/pricing · mobile menu · 404 page.
**Auth:** sign in (email) · wrong password → attempts left · server lockout countdown · `?expired=1` notice · 2FA OTP + recovery code · OTP timeout → notice on sign-in · Google · Apple · Telegram (OpenID) · sign up + validation · email verification page + resend · verification-success link · signed-in user visiting `/auth/signin` is redirected.
**Portal:** dashboard (stats, ID chip copy, latest messages, quick buy → Buy page with country + random number, expiring soon + extend) · numbers list/detail/back · message pagination · rename/auto-renew/transfer/release · buy private/shared/US state/bulk order · top up each gateway → return page → balance credited · transfer + confirm · transactions (filters, CSV, pagination, mobile cards, show more, ref copy) · settings (profile copy, password, 2FA enable/disable/recovery codes, sessions sign-out, appearance, notification channels email/Telegram deep link/remove) · top-bar search · notifications bell · realtime SMS toast + no duplicate toasts · logout (spinner, token revoked) · expired session redirect · dark mode · phone layout (drawer, bottom sheets, pay bars).

---

## 9. Context from earlier work (not part of the migration)
- **Backend facts used by the app:** logout = `POST /api/logout` (revokes current token, verified live);
  login is rate-limited server-side (5 tries, `LoginRequest`); every auth payload includes `email_verified_at`.
- **Open bugs (fix separately, before or after migration):**
  0. **Expired sessions never redirect to sign-in** *(found in Stage 1 smoke test)* — the API client sends no
     `Accept: application/json`, so Laravel answers a dead token with **302 → /admin/login** instead of 401; the
     browser blocks that cross-origin redirect, the app sees a network error, and the 401 handler never runs.
     Fix: add `Accept: application/json` in `portal/api/client.js` and the raw fetch in `portal/api/numbers.js`.
  1. Send SMS calls `POST /user/send-sms/{id}` — backend route is `POST /user/sms/send` with `{ virtual_number_id, to, content }`.
  2. Shared numbers can't be extended — `extent-number-price` needs `rent_time_id` for shared numbers (returns one `cost`, not `plans`).
  3. My Numbers badge shows total SMS count labelled as "new".
- **Backend asks:** `/user/all-sms/{id}` should honour `per_page` and `mobile_number_type_id`;
  Telegram bot should handle `/start add_<code>`.
- **Lint:** 33 remaining warnings are React-style suggestions (deliberately not refactored).

## 10. Open questions (answer before the stage that needs them)
- **Production domain** (needed for Stage 5 metadata/sitemap and the OG image URL in `index.html`, currently `https://zedsms.com`).
- **VPS details** (OS, Nginx present?, Node version, domain for staging) — Stage 6.
- **Which payment gateways are live** — to test returns in Stage 4.

---

## Progress log
| Date | Stage | Result | Commit |
|---|---|---|---|
| 2026-10-05 | Plan written | — | `78dbce8` (main) |
| 2026-10-05 | Stage 5 — SEO | per-page meta, sitemap, robots, JSON-LD; 18/18 identical, 7/7 + 7/7 checks | see branch |
| 2026-10-05 | Stage 4 — portal & payments on Next | glue files only, portal untouched; 3 gateways retired; 7/7 portal checks, 18/18 identical | see branch |
| 2026-10-05 | Stage 3 — landing & auth on Next | real HTML per page; 18/18 identical to Vite baseline; 7/7 checks | see branch |
| 2026-10-05 | Stage 2 — Next.js scaffold | Next 16.3.8 builds a placeholder; Vite unchanged (18/18 identical, 7/7 checks) | see branch |
| 2026-10-05 | Stage 1 — framework-neutral | G1, G2, G3, G4, G6 done on Vite; 18/18 screenshots identical; 7/7 hand-off checks | see branch |
| 2026-10-05 | Stage 0 — baseline | 18 landing/auth shots; re-capture 18/18 identical; portal excluded (manual checklist only) | — (no code changes; tooling in git-ignored `scratch/`) |
