import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { TweaksPanel, TweakSection, TweakColor, TweakRadio } from "./components/TweaksPanel";
import { useTweaks } from "./hooks/useTweaks";
import { HomeScreen, NumbersScreen } from "./screens/screens1";
import { numberKeyOf } from "./lib/numberKey";
import { isOwnEcho } from "./lib/ownActions";
import { BuyScreen, TopUpScreen, TransferScreen, TransactionsScreen, SettingsScreen } from "./screens/screens2";
import AlertsDesignPreview from "./screens/AlertsDesignPreview";
import { Icon } from "./components/Icon";
import { LogoMark } from "./components/LogoMark";
import { logout as apiLogout } from "./api/auth";
import { useAuthContext } from "./context/AuthContext";
import { useRealtime } from "./hooks/useRealtime";
import { Toast } from "./components/ui/Toast";

// ============ RESPONSIVE + APP STYLES ============
const appCss = `
html { scrollbar-gutter: stable; }
.mobile-only-flex { display: none !important; }
.layout { display: flex; align-items: flex-start; max-width: 1440px; margin: 0 auto; min-height: 100vh; }
.content-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.content-inner { flex: 1; max-width: 1180px; margin: 0 auto; padding: var(--content-pad); width: 100%; }

main { display: flex; flex-direction: column; min-height: auto; }
.sidebar { overflow-y: auto; }
.sidebar::-webkit-scrollbar { width: 8px; }
.sidebar::-webkit-scrollbar-track { background: transparent; }
.sidebar::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }

/* Loading animations */
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes popIn { from { transform: translateY(-4px) scale(0.98); opacity: 0; } to { transform: none; opacity: 1; } }

/* shared classes used across the portal screens */
.tnum { font-variant-numeric: tabular-nums; }
/* opacity only: a transform here would trap position:fixed children */
.view-enter { animation: fadeIn 0.2s ease both; }
.skel { border-radius: var(--r-card); background: linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 50%, var(--surface-2) 100%); background-size: 1000px 100%; animation: shimmer 2s infinite; }

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-strong);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-shimmer {
  background: linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 50%, var(--surface-2) 100%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

.button-loading {
  pointer-events: none;
  opacity: 0.6;
  animation: pulse 1.5s ease-in-out infinite;
}

.stats-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }

.numbers-back { display: none !important; }
.buy-mobile-bar { display: none; }
.buy-type-mobile-info { display: none; }
.tx-list { display: none; }
/* the bulk-order stepper has its own − / + buttons */
.bulk-qty input::-webkit-outer-spin-button, .bulk-qty input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.bulk-qty input { -moz-appearance: textfield; appearance: textfield; }
@keyframes sheetUp { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }

@media (max-width: 1080px) {
  .home-grid { grid-template-columns: minmax(0, 1fr) !important; }
  /* numbers: list and number detail become separate pages */
  .numbers-layout { grid-template-columns: minmax(0, 1fr) !important; }
  .numbers-layout[data-view="list"] > .numbers-detail { display: none !important; }
  .numbers-layout[data-view="detail"] > .numbers-list { display: none !important; }
  .numbers-list { position: static !important; }
  .numbers-list-scroll { max-height: none !important; }
  .msg-scroll { max-height: none !important; }
  .numbers-back { display: inline-flex !important; }
  .buy-summary { position: static !important; scroll-margin-top: 72px; }
  .buy-layout { grid-template-columns: 1fr !important; }
}
@media (max-width: 880px) {
  .sidebar { position: fixed !important; left: 0; top: 0 !important; height: 100dvh !important; max-width: 85vw; transform: translateX(-100%); transition: transform 0.26s cubic-bezier(0.22,1,0.36,1); box-shadow: var(--shadow-pop); }
  .sidebar[data-open="true"] { transform: translateX(0); }
  .topbar { top: 0 !important; }
  .topbar-inner { height: 56px !important; padding: 0 16px !important; gap: 8px !important; }
  .topbar-title h1 { font-size: 17px !important; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .stat-card { padding: 13px 14px !important; }
  .stat-value { font-size: 21px !important; }
  .mobile-only-flex { display: flex !important; }
  /* a header slot holding only a desktop-only control would leave an empty row */
  .step-title-right:has(> .desktop-only:only-child) { display: none; }
  .desktop-only { display: none !important; }
  .svc-grid { grid-template-columns: repeat(3, 1fr) !important; }
  .settings-layout { grid-template-columns: 1fr !important; }
  .settings-tabs { flex-direction: row !important; overflow-x: auto; position: static !important; }
  .content-inner { padding: 16px; }
  .topbar-search { display: none !important; }
}
@media (max-width: 560px) {
  /* buy number */
  .buy-page, .topup-page, .transfer-page { padding-bottom: 76px; }
  .transfer-recipient { font-size: 16px !important; } /* below 16px iOS zooms in on focus */
  /* below 16px iOS zooms in on focus; the big 6-digit code boxes keep their size */
  .buy-page input, .settings-layout input, .modal-card input:not(.otp-input) { font-size: 16px !important; }
  /* settings */
  .settings-tabs { gap: 4px !important; padding: 3px; border-radius: 11px; background: var(--surface-2); scrollbar-width: none; }
  .settings-tabs::-webkit-scrollbar { display: none; }
  .settings-tabs > button { flex: 1 0 auto; justify-content: center; height: 34px; padding: 0 12px !important; border-radius: 9px !important; white-space: nowrap; border: 1px solid transparent; background: transparent !important; color: var(--text-muted) !important; }
  .settings-tabs > button[data-active="true"] { background: var(--surface) !important; color: var(--text) !important; border-color: var(--border); box-shadow: var(--shadow-sm); }
  .settings-body { max-width: none !important; min-width: 0; }
  .settings-body [style*="padding: 22px"] { padding: 16px !important; } /* the 22px cards */
  /* profile rows: label on its own line, value + action underneath */
  .profile-row { grid-template-columns: minmax(0, 1fr) auto !important; }
  .profile-row > div:first-child { grid-column: 1 / -1; font-size: 12px !important; }
  .settings-danger-row { flex-direction: column; align-items: stretch !important; gap: 12px !important; }
  .settings-danger-row > button { width: 100%; }
  .settings-indent { margin-left: 0 !important; }
  .settings-tfa-actions > button { flex: 1 1 100%; }
  .sec-head { flex-wrap: wrap; }
  .sec-head > button { flex: 1 1 100%; }
  .sec-actions > button { flex: 1; }
  .tfa-setup { flex-direction: column; text-align: center; }
  .tfa-setup > div:last-child { display: flex; flex-direction: column; align-items: center; }
  /* settings → notifications */
  .notif-head { flex-wrap: wrap; padding: 16px !important; gap: 12px !important; }
  .notif-head > div:nth-child(2) { flex: 1 1 calc(100% - 52px) !important; }
  .notif-head > div:last-child { flex: 1 1 100%; }
  .notif-head > div:last-child > button { width: 100%; }
  .notif-channel { padding: 14px 16px !important; }
  .notif-identity { flex-wrap: wrap; row-gap: 10px !important; }
  .notif-confirm { flex: 1 1 100%; justify-content: flex-end; padding: 8px 10px; border-radius: 10px; background: var(--danger-soft); }
  .notif-confirm > button { height: 34px !important; padding: 0 16px !important; }
  .notif-controls { grid-template-columns: 1fr !important; gap: 12px !important; }
  /* menus span their full-width trigger instead of a fixed 260px box */
  .settings-body .menu-pop { left: 0 !important; right: 0 !important; width: auto !important; }
  /* transactions: list instead of the 600px table */
  .tx-table { display: none; }
  .tx-list { display: block; }
  .tx-list > div:last-child { border-bottom: none !important; }
  .tx-head { padding: 12px !important; gap: 8px !important; flex-wrap: nowrap !important; }
  .tx-tabs { flex: 1; min-width: 0; }
  .tx-tabs > button { flex: 1; padding: 0 6px !important; height: 32px !important; }
  .tx-export-label { display: none; }
  .tx-head > button { width: 38px; height: 38px !important; padding: 0 !important; flex-shrink: 0; }
  .tx-foot { flex-direction: column; justify-content: center !important; gap: 10px !important; padding: 13px 16px !important; }
  /* top up */
  .topup-presets { gap: 8px !important; }
  .topup-presets > button { height: 48px !important; font-size: 16px !important; }
  .gw-indent { padding-left: 15px !important; }
  .gw-meta { gap: 6px 14px !important; }
  .gw-meta span { white-space: normal !important; }
  /* number type: a two-tab switch, details for the picked one underneath */
  .buy-type-grid { gap: 4px !important; padding: 3px; border-radius: 11px; background: var(--surface-2); }
  .buy-type-grid > button { padding: 0 !important; height: 38px; border-radius: 9px !important; border: 1px solid transparent !important; background: transparent !important; display: flex; align-items: center; justify-content: center; }
  .buy-type-grid > button[data-sel="true"] { background: var(--surface) !important; border-color: var(--border) !important; box-shadow: var(--shadow-sm); }
  .buy-type-grid > button[data-sel="false"] .buy-type-head { color: var(--text-muted); }
  .buy-type-head { margin: 0 !important; justify-content: center; }
  .buy-type-head > span:first-child { font-size: 13.5px !important; }
  .buy-type-dot, .buy-type-desc, .buy-type-caps { display: none !important; }
  .buy-type-mobile-info { display: flex; flex-direction: column; gap: 9px; margin-top: 12px; font-size: 12px; line-height: 1.5; color: var(--text-muted); }
  /* US state picker: label above a full-width select */
  .buy-state-row { flex-direction: column; align-items: stretch !important; gap: 6px !important; }
  .buy-state-row > div { max-width: none !important; }
  .step-title { flex-wrap: wrap; }
  .step-title > div:first-child { flex: 1 1 200px; min-width: 0; }
  .step-title-right { flex: 1 1 100%; }
  .step-title-right .buy-search { height: 38px !important; }
  .step-title-right .buy-search input { width: 100% !important; }
  .step-title-right > button { width: 100%; justify-content: center; }
  .buy-num-footer { display: grid !important; grid-template-columns: 1fr 1fr; }
  .buy-num-footer > span { grid-column: 1 / -1; }
  .buy-num-footer > button { width: 100%; justify-content: center; }
  /* modals become bottom sheets */
  .modal-overlay { align-items: flex-end !important; padding: 0 !important; }
  .modal-card { width: 100% !important; max-height: 90dvh !important; border-radius: 18px 18px 0 0 !important; border-bottom: none !important; padding-bottom: env(safe-area-inset-bottom); animation: sheetUp 0.24s cubic-bezier(0.22,1,0.36,1) both; }
  /* bulk order: stepper full width, quick picks underneath */
  .bulk-qty { flex-direction: column; }
  .bulk-qty > div:first-child { flex: 0 0 46px !important; height: 46px !important; }
  .bulk-presets > button { height: 36px; }
  .plan-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .buy-processing-card { min-width: 0 !important; width: calc(100vw - 32px); max-width: 360px; padding: 32px 24px !important; }
  .buy-mobile-bar { display: flex; align-items: center; gap: 12px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 35;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--surface); border-top: 1px solid var(--border); box-shadow: 0 -6px 20px rgba(8,9,12,0.06);
    transition: transform 0.24s cubic-bezier(0.22,1,0.36,1), box-shadow 0.24s ease; will-change: transform; }
  .buy-mobile-bar[data-hidden="true"] { transform: translateY(calc(100% + 8px)); box-shadow: none; pointer-events: none; }
  .num-actions { width: 100%; }
  .num-actions > button { flex: 1; justify-content: center; }
  .msg-toolbar-actions { width: 100%; }
  .msg-toolbar-actions > div:first-child { flex: 1; }
  .svc-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .country-grid { grid-template-columns: 1fr !important; }
}
`;


// Initialize CSS variables on load
const initializeCSSVariables = (theme = "light", t = {}) => {
  const r = document.documentElement.style;
  const acc = theme === "dark" ? `color-mix(in srgb, ${t.accent || "#2F54EB"} 68%, white)` : (t.accent || "#2F54EB");
  r.setProperty("--accent", acc);

  // Apply landing page design system for light mode
  if (theme === "light") {
    r.setProperty("--bg", "#FAFAFB");
    r.setProperty("--surface", "#FFFFFF");
    r.setProperty("--surface-2", "#F5F6F8");
    r.setProperty("--surface-3", "#EFF0F3");
    r.setProperty("--border", "#ECEDF0");
    r.setProperty("--border-strong", "#E1E2E7");
    r.setProperty("--text", "#16171A");
    r.setProperty("--text-muted", "#6B6F76");
    r.setProperty("--text-faint", "#9CA1A9");
    r.setProperty("--accent-soft", "color-mix(in srgb, #2155f5 8%, #FFFFFF)");
    r.setProperty("--accent-border", "color-mix(in srgb, #2155f5 22%, #FFFFFF)");
    r.setProperty("--success", "#1B8A5A");
    r.setProperty("--success-soft", "#E9F6EF");
    r.setProperty("--danger", "#D6453A");
    r.setProperty("--danger-soft", "#FCEDEC");

    // Also set the landing page tokens for consistency
    r.setProperty("--color-brand", "#2155f5");
    r.setProperty("--color-ink", "#0f1013");
    r.setProperty("--color-surface", "#f9f9fa");
    r.setProperty("--color-border-soft", "#e1e2e9");
    r.setProperty("--color-ink-muted", "#494c52");
    r.setProperty("--color-surface-alt", "#eef1fb");
  } else {
    // Dark mode - use inverted landing page colors
    r.setProperty("--bg", "#0A0B0E");
    r.setProperty("--surface", "#121319");
    r.setProperty("--surface-2", "#181A21");
    r.setProperty("--surface-3", "#20232B");
    r.setProperty("--border", "rgba(255,255,255,0.07)");
    r.setProperty("--border-strong", "rgba(255,255,255,0.12)");
    r.setProperty("--text", "#F2F3F5");
    r.setProperty("--text-muted", "#9BA0A8");
    r.setProperty("--text-faint", "#686D76");
    r.setProperty("--accent-soft", "color-mix(in srgb, #6A8BFF 15%, #121319)");
    r.setProperty("--accent-border", "color-mix(in srgb, #6A8BFF 30%, #121319)");
    r.setProperty("--success", "#46C68B");
    r.setProperty("--success-soft", "rgba(70,198,139,0.12)");
    r.setProperty("--danger", "#F0726A");
    r.setProperty("--danger-soft", "rgba(240,114,106,0.12)");

    r.setProperty("--color-brand", "#2155f5");
    r.setProperty("--color-ink", "#f9f9fa");
    r.setProperty("--color-surface", "#0f1013");
    r.setProperty("--color-border-soft", "#494c52");
    r.setProperty("--color-ink-muted", "#9CA1A9");
    r.setProperty("--color-surface-alt", "#1a1f2e");
  }
};

function AppContent({ onLogoutRedirect }) {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "#2F54EB",
    "density": "regular",
    "corners": "soft"
  }/*EDITMODE-END*/;
  const navigate = useNavigate();
  const location = useLocation();

  // Extract route from pathname (e.g., /app/home -> home)
  const getCurrentRoute = () => {
    const path = location.pathname;
    const match = path.match(/\/app\/([a-z]+)/);
    return match ? match[1] : "home";
  };

  const route = getCurrentRoute();
  const [theme, setTheme] = React.useState(() => localStorage.getItem("zedsms-theme") || "light");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const scrollRef = React.useRef(null);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Live updates: new SMS, numbers and balance refresh as soon as the backend broadcasts
  const { user } = useAuthContext();
  const [liveToast, setLiveToast] = React.useState(null);
  const liveToastTimer = React.useRef(null);
  useRealtime(user?.id, (event) => {
    // the screen that took this action already toasted it (data still refreshes)
    if (isOwnEcho(event.type)) return;
    const msg = event.sms_content !== undefined
      ? `New SMS${event.sms_from ? ` from ${event.sms_from}` : ""}`
      : event.title;
    if (!msg) return;
    clearTimeout(liveToastTimer.current);
    setLiveToast({ msg, tone: /fail/i.test(msg) ? "danger" : "accent" });
    liveToastTimer.current = setTimeout(() => setLiveToast(null), 4000);
  });
  React.useEffect(() => () => clearTimeout(liveToastTimer.current), []);

  // Initialize variables on mount
  React.useEffect(() => {
    initializeCSSVariables(theme, t);
  }, []);

  // waits for the server to end the session, then leaves (full reload clears all state)
  const handleLogout = async () => {
    await apiLogout();
    window.location.href = "/auth/signin";
  };

  const DENSITY = {
    compact: { sw: "220px", pad: "18px" },
    regular: { sw: "248px", pad: "24px" },
    roomy: { sw: "276px", pad: "32px" },
  };
  const CORNERS = { sharp: ["10px", "8px"], soft: ["16px", "11px"], round: ["22px", "14px"] };

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("zedsms-theme", theme);
    initializeCSSVariables(theme, t);
  }, [theme]);

  React.useEffect(() => {
    const r = document.documentElement.style;
    const d = DENSITY[t.density] || DENSITY.regular;
    r.setProperty("--sidebar-w", d.sw);
    r.setProperty("--content-pad", d.pad);
    const c = CORNERS[t.corners] || CORNERS.soft;
    r.setProperty("--r-card", c[0]);
    r.setProperty("--r-ctrl", c[1]);

    // Update accent color
    const acc = theme === "dark" ? `color-mix(in srgb, ${t.accent} 68%, white)` : t.accent;
    r.setProperty("--accent", acc);
  }, [t.accent, t.density, t.corners, theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // id is a uid ("private:12") or a plain id; each number has its own page
  const goNumbers = (id) => {
    navigate(id != null ? `/app/numbers/${numberKeyOf(id)}` : "/app/numbers");
  };

  const setRoute = (newRoute) => {
    navigate(`/app/${newRoute}`);
  };

  React.useEffect(() => {
    window.scrollTo(0, 0);
    // keyboard shortcut: cmd/ctrl-B -> buy
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); setRoute("buy"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [route]);

  return (
    <>
      <style>{appCss}</style>
      <Toast toast={liveToast} />
      <div className="layout">
        <Sidebar route={route} setRoute={setRoute} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onLogout={handleLogout} />
        <div className="content-wrap">
          <Topbar route={route} setRoute={setRoute} theme={theme} toggleTheme={toggleTheme} setMobileOpen={setMobileOpen} />
          {import.meta.env.DEV && (
            <TweaksPanel>
              <TweakSection label="Brand accent" />
              <TweakColor label="Accent" value={t.accent}
                options={["#2F54EB", "#5B54E8", "#0E9384", "#7C5CE0", "#0B6BCB"]}
                onChange={(v) => setTweak("accent", v)} />
              <TweakSection label="Layout" />
              <TweakRadio label="Density" value={t.density}
                options={["compact", "regular", "roomy"]}
                onChange={(v) => setTweak("density", v)} />
              <TweakRadio label="Corners" value={t.corners}
                options={["sharp", "soft", "round"]}
                onChange={(v) => setTweak("corners", v)} />
              <TweakSection label="Theme" />
              <TweakRadio label="Mode" value={theme}
                options={["light", "dark"]}
                onChange={(v) => setTheme(v)} />
            </TweaksPanel>
          )}
          <main ref={scrollRef} className="content-inner">
            <Routes>
              <Route path="/home" element={<HomeScreen setRoute={setRoute} openNumber={goNumbers} />} />
              <Route path="/numbers" element={<NumbersScreen />} />
              <Route path="/numbers/:numberKey" element={<NumbersScreen />} />
              <Route path="/buy" element={<BuyScreen setRoute={setRoute} openNumber={goNumbers} />} />
              <Route path="/topup" element={<TopUpScreen />} />
              <Route path="/transfer" element={<TransferScreen />} />
              <Route path="/transactions" element={<TransactionsScreen />} />
              <Route path="/settings" element={<SettingsScreen theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />} />
              <Route path="/alerts-preview" element={<AlertsDesignPreview />} />
              <Route path="/" element={<HomeScreen setRoute={setRoute} openNumber={goNumbers} />} />
              {/* unknown /app/... paths land on the overview instead of an empty page */}
              <Route path="*" element={<Navigate to="/app/home" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

// Uses the app-wide QueryClient from src/App.tsx. The portal used to create its own,
// so auth/profile data lived in two caches that fetched twice and drifted apart.
export default function App(props) {
  return <AppContent {...props} />;
}
