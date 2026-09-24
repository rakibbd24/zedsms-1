import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { TweaksPanel, TweakSection, TweakColor, TweakRadio } from "./components/TweaksPanel";
import { useTweaks } from "./hooks/useTweaks";
import { HomeScreen, NumbersScreen } from "./screens/screens1";
import { BuyScreen, TopUpScreen, TransferScreen, TransactionsScreen, SettingsScreen } from "./screens/screens2";
import { Icon } from "./components/Icon";
import { LogoMark } from "./components/LogoMark";
import { logout as apiLogout } from "./api/auth";

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

@media (max-width: 1080px) {
  .home-grid { grid-template-columns: 1fr !important; }
  .numbers-layout { grid-template-columns: 1fr !important; }
  .numbers-layout > *:first-child { position: static !important; }
  .buy-layout { grid-template-columns: 1fr !important; }
}
@media (max-width: 880px) {
  .sidebar { position: fixed !important; left: 0; top: 0; transform: translateX(-100%); transition: transform 0.26s cubic-bezier(0.22,1,0.36,1); box-shadow: var(--shadow-pop); }
  .sidebar[data-open="true"] { transform: translateX(0); }
  .mobile-only-flex { display: flex !important; }
  .desktop-only { display: none !important; }
  .svc-grid { grid-template-columns: repeat(3, 1fr) !important; }
  .settings-layout { grid-template-columns: 1fr !important; }
  .settings-tabs { flex-direction: row !important; overflow-x: auto; position: static !important; }
  .content-inner { padding: 16px; }
  .topbar-search { display: none !important; }
}
@media (max-width: 560px) {
  .svc-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .country-grid { grid-template-columns: 1fr !important; }
}
`;

const queryClient = new QueryClient();

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
  const [pendingNumber, setPendingNumber] = React.useState(null);
  const scrollRef = React.useRef(null);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Initialize variables on mount
  React.useEffect(() => {
    initializeCSSVariables(theme, t);
  }, []);

  const handleLogout = () => {
    apiLogout();
    // Redirect directly to signin page
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

  const goNumbers = (id) => {
    setPendingNumber(id);
    navigate("/app/numbers");
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
              <Route path="/numbers" element={<NumbersScreen initialNumberId={pendingNumber} clearInitial={() => setPendingNumber(null)} />} />
              <Route path="/buy" element={<BuyScreen setRoute={setRoute} openNumber={goNumbers} />} />
              <Route path="/topup" element={<TopUpScreen />} />
              <Route path="/transfer" element={<TransferScreen />} />
              <Route path="/transactions" element={<TransactionsScreen />} />
              <Route path="/settings" element={<SettingsScreen theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />} />
              <Route path="/" element={<HomeScreen setRoute={setRoute} openNumber={goNumbers} />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

export default function App(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent {...props} />
    </QueryClientProvider>
  );
}
