import React from "react";
import { Icon } from "./Icon";
import { Button } from "./ui/Button";
import { PAGE_TITLES } from "./nav";
import { useNotificationFeed, useMarkNotificationRead, useMarkAllNotificationsRead } from "../hooks/useNotificationFeed";

// "3 min ago" / "2d ago" for notification timestamps
const notifWhen = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 60 * 24 * 7) return `${Math.floor(mins / 1440)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

export const Topbar = ({ route, setRoute, theme, toggleTheme, setMobileOpen }) => {
  const [notifOpen, setNotifOpen] = React.useState(false);

  const feed = useNotificationFeed();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const notifications = React.useMemo(
    () => (feed.data?.pages || []).flatMap((p) => p.items),
    [feed.data]
  );
  // counted across the pages loaded so far
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <header style={{ position: "sticky", top: 10, zIndex: 30, background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, height: 64, padding: "0 24px", maxWidth: 1180, margin: "0 auto" }}>
        <button onClick={() => setMobileOpen(true)} className="mobile-only-flex" style={{ color: "var(--text-muted)" }}><Icon name="menu" size={22} /></button>
        <div className="desktop-only">
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>{PAGE_TITLES[route]}</h1>
        </div>

        {/* search */}
        <div className="topbar-search" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 13px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-faint)", minWidth: 220, maxWidth: 320, flex: "0 1 auto" }}>
          <Icon name="search" size={16} />
          <input placeholder="Search numbers, codes…" style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 13.5, width: "100%" }} />
        </div>

        <Button icon="plus" size="md" onClick={() => setRoute("buy")} className="desktop-only">Buy number</Button>

        <button onClick={toggleTheme} title="Toggle theme" style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>

        {/* notifications */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setNotifOpen(!notifOpen)} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", position: "relative" }}>
            <Icon name="bell" size={18} />
            {unread > 0 && (
              <span className="tnum" style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "var(--accent)", color: "#fff", border: "2px solid var(--surface-2)", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div style={{ position: "absolute", right: 0, top: 46, width: 320, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow-pop)", zIndex: 50, overflow: "hidden", animation: "popIn 0.16s ease both" }}>
                <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications{unread > 0 && <span className="tnum" style={{ color: "var(--text-faint)", fontWeight: 500 }}> · {unread} new</span>}</span>
                  <button
                    onClick={() => markAll.mutate()}
                    disabled={unread === 0 || markAll.isPending}
                    style={{ fontSize: 12, color: unread === 0 ? "var(--text-faint)" : "var(--accent)", fontWeight: 500, cursor: unread === 0 ? "default" : "pointer" }}
                  >
                    {markAll.isPending ? "Marking…" : "Mark all read"}
                  </button>
                </div>

                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {feed.isLoading ? (
                    <div style={{ padding: "22px 16px", textAlign: "center", fontSize: 12.5, color: "var(--text-muted)" }}>Loading…</div>
                  ) : feed.error ? (
                    <div style={{ padding: "18px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 8 }}>Could not load notifications</div>
                      <button onClick={() => feed.refetch()} style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>Retry</button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: "26px 16px", textAlign: "center", fontSize: 12.5, color: "var(--text-muted)" }}>
                      You're all caught up — account activity shows up here.
                    </div>
                  ) : notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { if (!n.readAt) markRead.mutate(n.id); }}
                      style={{ display: "flex", gap: 11, width: "100%", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--border)", background: n.readAt ? "transparent" : "var(--accent-soft)", transition: "background 0.14s" }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 99, marginTop: 5, flexShrink: 0, background: n.readAt ? "transparent" : "var(--accent)" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: n.readAt ? 500 : 600 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>{n.message}</div>
                        <div className="tnum" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{notifWhen(n.createdAt)}</div>
                      </div>
                    </button>
                  ))}

                  {feed.hasNextPage && (
                    <button
                      onClick={() => feed.fetchNextPage()}
                      disabled={feed.isFetchingNextPage}
                      style={{ width: "100%", padding: "11px", fontSize: 12.5, fontWeight: 500, color: "var(--accent)" }}
                    >
                      {feed.isFetchingNextPage ? "Loading…" : "Load older"}
                    </button>
                  )}
                </div>
                <button onClick={() => { setRoute("numbers"); setNotifOpen(false); }} style={{ width: "100%", padding: "11px", fontSize: 12.5, fontWeight: 500, color: "var(--accent)", borderTop: "1px solid var(--border)" }}>View all messages</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
