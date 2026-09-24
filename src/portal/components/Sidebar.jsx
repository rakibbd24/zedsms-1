import React from "react";
import { Icon } from "./Icon";
import { LogoMark } from "./LogoMark";
import { NAV } from "./nav";
import { useUser } from "../hooks/useUser";
import { useBalance } from "../hooks/useBalance";

const NavItem = ({ item, route, setRoute, setMobileOpen }) => {
  const active = route === item.id;
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={() => { setRoute(item.id); setMobileOpen(false); }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", height: 40, padding: "0 11px", borderRadius: 10,
        background: active ? "#2155f5" : hover ? "var(--surface-2)" : "transparent",
        color: active ? "#ffffff" : "var(--text-muted)", fontWeight: active ? 600 : 450, fontSize: 13.5,
        transition: "all 0.14s ease", position: "relative", letterSpacing: "-0.005em", border: active ? "2px solid #2155f5" : "none" }}>
      <Icon name={item.icon} size={18} strokeWidth={active ? 2 : 1.7} />
      <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
      {item.id === "buy" && <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 600, color: active ? "#ffffff" : "var(--accent)", background: active ? "rgba(255,255,255,0.2)" : "var(--accent-soft)", padding: "2px 6px", borderRadius: 6 }}>⌘B</span>}
    </button>
  );
};

export const Sidebar = ({ route, setRoute, mobileOpen, setMobileOpen, onLogout }) => {
  const { data: user } = useUser();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    pollingInterval: 30000, // Refresh every 30 seconds
  });
  const balance = balanceData?.amount || 0;
  const email = user?.email ?? "";
  const zedId = user?.zedId ?? "";
  const userInitial = (email[0] || "?").toUpperCase();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(8,9,12,0.4)", zIndex: 40, backdropFilter: "blur(2px)" }} className="mobile-only-flex" />}
      <aside className="sidebar" data-open={mobileOpen}
        style={{ width: "var(--sidebar-w)", flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--surface)",
          height: "calc(100vh - 10px)", position: "sticky", top: 10, display: "flex", flexDirection: "column", zIndex: 50 }}>
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 18px 18px" }}>
          <button onClick={() => { setRoute("home"); setMobileOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={30} />
            <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.02em" }}>ZEDSMS</span>
          </button>
          <button onClick={() => setMobileOpen(false)} className="mobile-only-flex" style={{ marginLeft: "auto", color: "var(--text-muted)" }}><Icon name="x" size={20} /></button>
        </div>

        {/* nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((group, gi) => (
            <div key={gi} style={{ marginTop: group.section ? 16 : 0 }}>
              {group.section && <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-faint)", padding: "0 11px 7px" }}>{group.section}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map((item) => <NavItem key={item.id} item={item} route={route} setRoute={setRoute} setMobileOpen={setMobileOpen} />)}
              </div>
            </div>
          ))}

          {/* promo */}
          <div style={{ marginTop: "auto", paddingTop: 16 }}>
            <button onClick={() => setRoute("buy")} style={{ width: "100%", textAlign: "left", padding: "14px 14px 15px", borderRadius: 14, position: "relative", overflow: "hidden",
              background: "linear-gradient(150deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 78%, #7C5CFF) 100%)", color: "#fff" }}>
              <div style={{ position: "absolute", top: -22, right: -22, width: 84, height: 84, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }} />
              <div style={{ position: "absolute", bottom: -30, right: 18, width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
              <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.18)", marginBottom: 10 }}>
                <Icon name="plus" size={15} />
              </span>
              <div style={{ position: "relative", fontSize: 13, fontWeight: 600, marginBottom: 3, letterSpacing: "-0.01em" }}>Need another number?</div>
              <div style={{ position: "relative", fontSize: 11.5, opacity: 0.85, lineHeight: 1.4, marginBottom: 10 }}>3,380+ numbers ready across 20+ countries.</div>
              <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600 }}>
                Buy a number <Icon name="arrowR" size={13} />
              </span>
            </button>
          </div>
        </nav>

        {/* balance + user */}
        <div style={{ padding: "12px 12px 18px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: "12px 13px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 3 }}>Available balance</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              {isBalanceLoading ? (
                <span className="mono" style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", opacity: 0.6 }}>...</span>
              ) : (
                <span className="mono tnum" style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>${balance.toFixed(2)}</span>
              )}
              <button onClick={() => setRoute("topup")} style={{ fontSize: 12, fontWeight: 550, color: "var(--accent)", whiteSpace: "nowrap", flexShrink: 0 }}>Top up</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button onClick={() => setRoute("settings")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 10, flex: 1, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 99, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>{userInitial}</div>
              <div style={{ textAlign: "left", overflow: "hidden", flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
                <div className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>ID {zedId}</div>
              </div>
            </button>
            <button onClick={handleLogoutClick} title="Log out" style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--danger-soft)"; e.currentTarget.style.color = "var(--danger)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-faint)"; }}>
              <Icon name="logout" size={16} />
            </button>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
              <>
                <div onClick={() => setShowLogoutConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(8,9,12,0.4)", zIndex: 999, backdropFilter: "blur(2px)" }} />
                <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow-pop)", zIndex: 1000, maxWidth: 400, width: "90vw", overflow: "hidden" }}>
                  <div style={{ padding: 24 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Sign out?</div>
                    <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.5 }}>
                      Are you sure you want to sign out? You'll need to sign in again to access your account.
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
                        Cancel
                      </button>
                      <button onClick={confirmLogout} style={{ flex: 1, height: 40, borderRadius: 10, background: "var(--danger)", color: "#fff", border: "none", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
