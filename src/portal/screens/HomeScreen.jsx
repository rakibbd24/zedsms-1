import React from "react";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FlagAvatar, ServiceAvatar } from "../components/ui/Avatars";
import { CodeChip } from "../components/ui/CodeChip";
import { Toast } from "../components/ui/Toast";
import { useNumbers, useExtendNumber, useNumberExtensionPlans } from "../hooks/useNumbers";
import { useRecentMessages } from "../hooks/useMessages";
import { useUser } from "../hooks/useUser";
import { useBalance } from "../hooks/useBalance";
import { DashboardAlerts } from "../components/DashboardAlerts";
import { copyText } from "../lib/clipboard";
import { ExtendModal } from "./NumberModals";
import { QuickBuy } from "./QuickBuy";

const StatCard = ({ label, value, sub, tone, icon }) => (
  <Card className="stat-card" style={{ padding: "15px 17px", minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      <span style={{ color: tone || "var(--text-faint)", display: "flex" }}><Icon name={icon} size={16} /></span>
    </div>
    <div className="mono tnum stat-value" style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 6 }}>{sub}</div>}
  </Card>
);

// desktop overview: compact "Your ZEDSMS ID" chip, click to copy
// (on phones it's copied from the menu instead — the chip is CSS-hidden there)
const IdChip = ({ zedId }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = () => copyText(zedId).then((ok) => {
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  });
  return (
    <button onClick={copy} disabled={!zedId} title="Copy your ZEDSMS ID"
      style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", textAlign: "left" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")} onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}>
      <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="qr" size={17} /></span>
      <span>
        <span style={{ display: "block", fontSize: 10.5, color: "var(--text-faint)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>Your ZEDSMS ID</span>
        <span className="mono" style={{ display: "block", fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.35 }}>{zedId || "—"}</span>
      </span>
      <span style={{ color: copied ? "var(--success)" : "var(--text-faint)", display: "flex", flexShrink: 0, marginLeft: 2 }}><Icon name={copied ? "check" : "copy"} size={15} strokeWidth={copied ? 2.3 : 1.7} /></span>
    </button>
  );
};

const CodeRow = ({ m, onOpen }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onOpen}
      style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 14px", borderRadius: 12, cursor: "pointer",
        background: hover ? "var(--surface-2)" : "transparent", transition: "background 0.14s ease", position: "relative" }}>
      {m.unread && <span style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", width: 6, height: 6, borderRadius: 99, background: "var(--accent)" }} />}
      <ServiceAvatar color={m.color} letter={m.letter} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 550, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.from}</span>
          <span style={{ fontSize: 11.5, color: "var(--text-faint)", whiteSpace: "nowrap", flexShrink: 0 }}>· {m.time}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "92%" }}>{m.body}</div>
      </div>
      <CodeChip code={m.code} />
    </div>
  );
};

// the overview's "Expiring soon" window (also the "N expiring soon" count on the stats)
const EXPIRING_WITHIN_DAYS = 14;

// how many expiring numbers the overview lists before "+N more"
const EXPIRING_SHOWN = 5;

export const HomeScreen = ({ setRoute, openNumber }) => {
  // Live data via React Query — this screen is the wired-up template; other
  // screens still read mocks/seed.js directly pending the same treatment.
  const { data: rawNumbers = [], isLoading: numbersLoading } = useNumbers();
  const { data: messages = [], isLoading: messagesLoading } = useRecentMessages();
  const { data: user } = useUser();
  const { data: balanceData } = useBalance();
  const extendMutation = useExtendNumber();

  const [extendingNumber, setExtendingNumber] = React.useState(null);
  const { data: extensionPlans = [], isLoading: extensionPlansLoading } = useNumberExtensionPlans(extendingNumber?.id, extendingNumber?.mobile_number_type_id);
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const showToast = (msg, tone = "success") => { clearTimeout(toastTimer.current); setToast({ msg, tone }); toastTimer.current = setTimeout(() => setToast(null), 2600); };

  // Calculate days remaining from expiry timestamp
  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Normalize numbers with days calculation
  const numbers = React.useMemo(() => {
    return rawNumbers.map((n) => {
      const expiryTs = n.expires_at || n.expiry;
      const daysLeft = getDaysRemaining(expiryTs);

      // Determine type ID and other details
      let typeId = n.mobile_number_type_id;
      if (!typeId) {
        const typeStr = (n.type || "").toLowerCase();
        typeId = typeStr.includes("private") ? 2 : 1;
      }
      const isPrivate = typeId === 2;

      return {
        ...n,
        days: daysLeft,
        expiresAt: expiryTs,
        status: n.status || (daysLeft > 0 ? "active" : "expired"),
        mobile_number_type_id: typeId,
        type: isPrivate ? "Private" : "Shared",
        // ids are per table, so a shared and a private number can share one — open by uid
        uid: `${isPrivate ? "private" : "shared"}:${n.id}`,
        country: n.country || "GB",
        // shared numbers are bought for one service; private ones work with any
        service: n.service_name || null,
        number: n.number || n.mobile_number || ""
      };
    });
  }, [rawNumbers]);

  const active = numbers.filter((n) => n.status === "active");
  const expiring = active.filter((n) => n.days <= EXPIRING_WITHIN_DAYS);
  const unreadCodes = messages.filter((m) => m.unread).length;

  const doExtend = (number, rentTimeId) => {
    if (number) {
      extendMutation.mutate({ numberId: number.id, plan: rentTimeId, typeId: number.mobile_number_type_id }, {
        onSuccess: () => {
          setExtendingNumber(null);
          showToast(`${number.number} extended`);
        },
        onError: (err) => showToast(err?.message || "Failed to extend number", "danger")
      });
    }
  };

  if (numbersLoading || messagesLoading || !user) {
    return (
      <div className="view-enter" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="skel" style={{ height: 90 }} />
        <div className="skel" style={{ height: 280 }} />
      </div>
    );
  }

  return (
    <div className="view-enter" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Announcements & User Alerts - Show at top during loading */}
      <DashboardAlerts />

      <div className="desktop-only" style={{ display: "flex", justifyContent: "flex-end" }}>
        <IdChip zedId={user?.zedId ? String(user.zedId) : ""} />
      </div>

      {/* stats */}
      <div className="stats-grid">
        <StatCard label="Balance" value={`$${(balanceData?.amount || 0).toFixed(2)}`} sub="Available to spend" icon="wallet" tone="var(--accent)" />
        <StatCard label="Active numbers" value={active.length} sub={`${expiring.length} expiring soon`} icon="grid" tone="var(--success)" />
      </div>

      {/* main grid */}
      <div className="home-grid" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18, alignItems: "start" }}>
        {/* latest messages */}
        <Card style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Latest Messages</h3>
              {unreadCodes > 0 && <Badge tone="accent">{unreadCodes} new</Badge>}
            </div>
            <button onClick={() => setRoute("numbers")} style={{ fontSize: 12.5, fontWeight: 500, color: "var(--accent)", display: "flex", alignItems: "center", gap: 3 }}>View all <Icon name="chevR" size={14} /></button>
          </div>
          <div style={{ padding: "0 8px 10px" }}>
            {messages.slice(0, 10).map((m) => <CodeRow key={m.id} m={m} onOpen={() => openNumber(m.numberUid)} />)}
          </div>
        </Card>

        {/* right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <QuickBuy />

          <Card style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 18px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Expiring soon</h3>
                {expiring.length > 0 && <Badge tone="neutral" className="tnum">{expiring.length}</Badge>}
              </div>
              <button onClick={() => setRoute("numbers")} style={{ fontSize: 12.5, fontWeight: 500, color: "var(--accent)", display: "flex", alignItems: "center", gap: 3 }}>View all <Icon name="chevR" size={14} /></button>
            </div>
            {expiring.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 18px 24px", textAlign: "center" }}>
                <span style={{ width: 36, height: 36, borderRadius: 11, background: "var(--success-soft)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={18} strokeWidth={2.2} /></span>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Nothing expires in the next {EXPIRING_WITHIN_DAYS} days</span>
              </div>
            ) : (
              <div style={{ padding: "0 18px 6px" }}>
                {/* soonest first; the rest are one tap away on My Numbers */}
                {[...expiring].sort((a, b) => (a.days || 0) - (b.days || 0)).slice(0, EXPIRING_SHOWN).map((n) => {
                  const countryIso = n.country?.iso || n.iso || "GB";
                  const phoneNumber = n.mobile_number || n.phone_number || n.number;
                  // "WhatsApp · Shared" / "Private" — never a placeholder service name
                  const subtitle = [n.type === "Shared" ? n.service : null, n.type].filter(Boolean).join(" · ");
                  // n.days is the time left (from expiry); rent_time.days is the plan length
                  const daysLeft = n.days;
                  const tone = daysLeft <= 3 ? "danger" : daysLeft <= 7 ? "warning" : "neutral";
                  const left = daysLeft <= 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`;
                  const expiresOn = new Date(n.expiresAt || n.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

                  return (
                    <div key={n.uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderTop: "1px solid var(--border)" }}>
                      <button onClick={() => openNumber(n.uid)} style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, textAlign: "left" }}>
                        <FlagAvatar iso={countryIso} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="mono tnum" style={{ fontSize: 13.5, fontWeight: 550, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{phoneNumber}</div>
                          <div style={{ fontSize: 11.5, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</div>
                        </div>
                      </button>
                      <span title={`Expires ${expiresOn}`} style={{ flexShrink: 0 }}><Badge tone={tone} className="tnum">{left}</Badge></span>
                      <Button variant="soft" size="sm" onClick={() => setExtendingNumber(n)} title="Extend this number">Extend</Button>
                    </div>
                  );
                })}
                {expiring.length > EXPIRING_SHOWN && (
                  <button onClick={() => setRoute("numbers")} className="tnum" style={{ width: "100%", padding: "11px 0 8px", borderTop: "1px solid var(--border)", fontSize: 12.5, fontWeight: 500, color: "var(--text-muted)" }}>
                    +{expiring.length - EXPIRING_SHOWN} more expiring
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {extendingNumber && <ExtendModal number={extendingNumber} open={!!extendingNumber} onClose={() => setExtendingNumber(null)} onConfirm={(plan) => doExtend(extendingNumber, plan)} plans={extensionPlans} isLoading={extensionPlansLoading} isSubmitting={extendMutation.isPending} />}
      <Toast toast={toast} />
    </div>
  );
};
