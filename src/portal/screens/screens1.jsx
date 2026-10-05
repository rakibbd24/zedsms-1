import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FlagAvatar, ServiceAvatar } from "../components/ui/Avatars";
import { CodeChip } from "../components/ui/CodeChip";
import { Empty } from "../components/ui/Empty";
import { Modal } from "../components/ui/Modal";
import { Toast } from "../components/ui/Toast";
import { Pagination } from "../components/ui/Pagination";
import { useNumbers, useExtendNumber, useRestoreNumber, useRestoreNumberPrice, useTransferNumber, useRenameNumber, useReleaseNumber, useUpdateAutoRenew, useSendSmsFromNumber, useNumberExtensionPlans } from "../hooks/useNumbers";
import { useMessages, useRecentMessages } from "../hooks/useMessages";
import { useUser } from "../hooks/useUser";
import { useBalance } from "../hooks/useBalance";
import { DashboardAlerts } from "../components/DashboardAlerts";
import { usePrivateCountries, usePrivatePlans, useSharedCountries, useSharedServices, useSharedRentTimes } from "../hooks/useBuy";
import { sharedPriceOf } from "../api/buy";
import { numberKeyOf, numberIdOfKey } from "../lib/numberKey";
import { copyText } from "../lib/clipboard";

// ============ HOME / OVERVIEW ============
// Format expiry date from timestamp
const formatExpiryDate = (expiryTs) => {
  if (!expiryTs) return "Unknown";
  const date = new Date(expiryTs);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Calendar date a number expires, derived from its days-remaining (fallback)
const expiryDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + (days || 0));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ---- reactivation (restore) of lapsed numbers ----
// A number that expires isn't released immediately: it sits in a grace window
// during which POST /user/restore-number brings it back on the same number.
// Past the deadline it's gone and the user has to buy a new one.
const RESTORE_WINDOW_DAYS = 7;
const isLapsed = (status) => status === "expired" || status === "disconnected";
const restoreDeadlineOf = (expiryTs) => {
  if (!expiryTs) return null;
  const d = new Date(expiryTs);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + RESTORE_WINDOW_DAYS);
  return d;
};
const restoreDaysLeftOf = (expiryTs) => {
  const deadline = restoreDeadlineOf(expiryTs);
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)));
};
const termLabelOf = (terms) => {
  const t = (terms || "").toUpperCase();
  if (t === "MONTHLY") return "Monthly";
  if (t === "QUARTERLY") return "Quarterly";
  if (t === "SIX_MONTHLY") return "6 Months";
  if (t === "ANNUALLY") return "Annual";
  return terms;
};
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

// compact quick-buy used on the overview — live catalog, hands the picks to the Buy page
const QuickPicker = ({ open, setOpen, children, value, disabled }) => (
  <div style={{ position: "relative" }}>
    <button onClick={() => !disabled && setOpen(!open)} disabled={disabled} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", height: 46, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", opacity: disabled ? 0.6 : 1 }}>
      {value}
      <span style={{ marginLeft: "auto", color: "var(--text-faint)" }}><Icon name="chevD" size={16} /></span>
    </button>
    {open && (
      <>
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
        <div style={{ position: "absolute", top: 52, left: 0, right: 0, maxHeight: 240, overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-pop)", zIndex: 30, padding: 6, animation: "popIn 0.15s ease both" }}>
          {children}
        </div>
      </>
    )}
  </div>
);

const QuickServiceLogo = ({ service, size }) => (
  service.icon
    ? <img src={service.icon} alt="" style={{ width: size, height: size, borderRadius: size * 0.32, objectFit: "cover", flexShrink: 0, background: "var(--surface-2)" }} />
    : <ServiceAvatar color="var(--accent)" letter={(service.name || "?")[0].toUpperCase()} size={size} />
);

const pickerText = (text) => <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-muted)" }}>{text}</span>;

const QuickBuy = () => {
  const navigate = useNavigate();
  const [type, setType] = React.useState("Private");
  const isPrivate = type === "Private";
  const [countryByType, setCountryByType] = React.useState({});
  const [svcId, setSvcId] = React.useState(null);
  const [openS, setOpenS] = React.useState(false);
  const [openC, setOpenC] = React.useState(false);

  const privateCountries = usePrivateCountries(isPrivate);
  const sharedCountries = useSharedCountries(!isPrivate);
  const countriesQ = isPrivate ? privateCountries : sharedCountries;
  const countryList = countriesQ.data || [];
  const country = countryByType[type] || countryList[0] || null;

  const servicesQ = useSharedServices(!isPrivate ? country?.id : null);
  const svcList = servicesQ.data || [];
  const svc = svcList.find((s) => s.id === svcId) || svcList[0] || null;

  // "from" price = the shortest plan, priced the same way the Buy page does
  const privatePlans = usePrivatePlans(isPrivate ? country?.id : null);
  const rentTimes = useSharedRentTimes(!isPrivate);
  const cheapest = isPrivate ? (privatePlans.data || [])[0] : (rentTimes.data || [])[0];
  const fromPrice = !cheapest ? null : isPrivate ? cheapest.total : svc ? sharedPriceOf(svc, cheapest.days) : null;
  const fromLabel = cheapest ? (isPrivate ? cheapest.label : cheapest.name) : null;

  const pickCountry = (c) => { setCountryByType((m) => ({ ...m, [type]: c })); setSvcId(null); setOpenC(false); };
  const ready = !!country && (isPrivate || !!svc);
  const goBuy = () => {
    if (!ready) return;
    const qs = new URLSearchParams({ type: isPrivate ? "private" : "shared", country: country.iso });
    if (!isPrivate) qs.set("service", String(svc.id));
    navigate(`/app/buy?${qs}`);
  };

  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 15 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={18} strokeWidth={2} /></div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Quick buy</h3>
      </div>

      <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", borderRadius: 10, marginBottom: 15 }}>
        {["Private", "Shared"].map((tk) => (
          <button key={tk} onClick={() => { setType(tk); setOpenC(false); setOpenS(false); }} style={{ flex: 1, height: 32, borderRadius: 8, fontSize: 12.5, fontWeight: 550,
            background: type === tk ? "var(--surface)" : "transparent", color: type === tk ? "var(--text)" : "var(--text-muted)",
            boxShadow: type === tk ? "var(--shadow-sm)" : "none", border: type === tk ? "1px solid var(--border)" : "1px solid transparent" }}>{tk}</button>
        ))}
      </div>

      {isPrivate && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 11, background: "var(--surface-2)", marginBottom: 2 }}>
          <span style={{ color: "var(--text-faint)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={15} /></span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>A private number works with <strong style={{ color: "var(--text)" }}>any service</strong>. Priced by country.</span>
        </div>
      )}

      <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", margin: "13px 0 6px" }}>Country</label>
      <QuickPicker open={openC} setOpen={setOpenC} disabled={countryList.length === 0}
        value={country
          ? <><FlagAvatar iso={country.iso} size={24} /><span style={{ fontSize: 13.5, fontWeight: 500 }}>{country.name}</span></>
          : pickerText(countriesQ.isLoading ? "Loading countries…" : countriesQ.error ? "Couldn't load countries" : "No countries available")}>
        {countryList.map((c) => (
          <button key={c.id} onClick={() => pickCountry(c)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 9px", borderRadius: 9, background: country?.id === c.id ? "var(--surface-2)" : "transparent" }}>
            <FlagAvatar iso={c.iso} size={26} />
            <span style={{ fontSize: 13.5, fontWeight: 450 }}>{c.name}</span>
            {country?.id === c.id && <span style={{ marginLeft: "auto", color: "var(--accent)", display: "flex" }}><Icon name="check" size={15} strokeWidth={2.4} /></span>}
          </button>
        ))}
      </QuickPicker>

      {!isPrivate && (
        <>
          <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", margin: "13px 0 6px" }}>Service</label>
          <QuickPicker open={openS} setOpen={setOpenS} disabled={svcList.length === 0}
            value={svc
              ? <><QuickServiceLogo service={svc} size={24} /><span style={{ fontSize: 13.5, fontWeight: 500 }}>{svc.name}</span></>
              : pickerText(!country || servicesQ.isLoading ? "Loading services…" : servicesQ.error ? "Couldn't load services" : `No services in ${country.name}`)}>
            {svcList.map((sv) => (
              <button key={sv.id} onClick={() => { setSvcId(sv.id); setOpenS(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 9px", borderRadius: 9, background: svc?.id === sv.id ? "var(--surface-2)" : "transparent" }}>
                <QuickServiceLogo service={sv} size={26} />
                <span style={{ fontSize: 13.5, fontWeight: 450 }}>{sv.name}</span>
                <span className="mono tnum" style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>${sv.pricePerDay.toFixed(2)}/day</span>
              </button>
            ))}
          </QuickPicker>
        </>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 13px", padding: "12px 14px", borderRadius: 11, background: "var(--surface-2)" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>From{fromLabel && <span style={{ color: "var(--text-faint)" }}> · {fromLabel}</span>}</span>
        <span className="mono tnum" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>{fromPrice != null ? `$${fromPrice.toFixed(2)}` : "—"}</span>
      </div>
      <Button full size="lg" onClick={goBuy} disabled={!ready}>Buy number</Button>
    </Card>
  );
};

// how many expiring numbers the overview lists before "+N more"
const EXPIRING_SHOWN = 5;

const HomeScreen = ({ setRoute, openNumber }) => {
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
        country: n.country || "GB",
        // shared numbers are bought for one service; private ones work with any
        service: n.service_name || null,
        number: n.number || n.mobile_number || ""
      };
    });
  }, [rawNumbers]);

  const active = numbers.filter((n) => n.status === "active");
  const expiring = active.filter((n) => n.days <= 50);
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
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Nothing expires in the next 50 days</span>
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
                    <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderTop: "1px solid var(--border)" }}>
                      <button onClick={() => openNumber(n.id)} style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, textAlign: "left" }}>
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

// Placeholder rows shown while a number's messages load, so the panel keeps its
// shape instead of flashing an empty state and then jumping to content.
const MessageSkeleton = ({ rows = 4 }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border)", opacity: 1 - i * 0.18 }}>
        <div className="loading-shimmer" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="loading-shimmer" style={{ height: 11, width: `${38 + (i % 3) * 12}%`, borderRadius: 6, marginBottom: 9 }} />
          <div className="loading-shimmer" style={{ height: 9, width: "92%", borderRadius: 6, marginBottom: 6 }} />
          <div className="loading-shimmer" style={{ height: 9, width: `${55 + (i % 2) * 20}%`, borderRadius: 6 }} />
        </div>
      </div>
    ))}
  </div>
);

// ============ MY NUMBERS (master-detail inbox) ============
const RENT_OPTS = [{ d: 7, label: "1 week" }, { d: 14, label: "2 weeks" }, { d: 30, label: "1 month" }, { d: 90, label: "3 months" }];
// pricing helpers (svcPriceOf / countryRentOf / weeklyPriceOf) come from data.jsx

const modalInput = { width: "100%", height: 44, padding: "0 14px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontSize: 14, outline: "none" };

function ExtendModal({ number, open, onClose, onConfirm, plans = [], isLoading = false, isSubmitting = false }) {
  const [selectedPlan, setSelectedPlan] = React.useState(null);

  React.useEffect(() => {
    if (open && plans.length > 0) {
      setSelectedPlan(plans[0]);
    }
  }, [open, plans]);

  if (!open) return null;

  // Calculate discount based on base monthly price
  const getMonthsForTerm = (terms) => {
    const t = (terms || "").toUpperCase().trim();
    if (t === "ANNUAL" || t.includes("ANNUALLY")) return 12;
    if (t === "SIX_MONTHLY" || t.includes("SIX")) return 6;
    if (t === "QUARTERLY" || t.includes("QUARTER")) return 3;
    if (t === "MONTHLY" || t.includes("MONTH")) return 1;
    return 1;
  };

  const monthlyPlan = plans.find(p => (p.terms || "").toUpperCase().includes("MONTHLY"));
  const baseMonthlyPrice = monthlyPlan ? parseFloat(monthlyPlan.cost) : null;

  const getDiscount = (planCost, planTerms) => {
    if (!baseMonthlyPrice) return null;
    const months = getMonthsForTerm(planTerms);
    if (months === 1) return null; // No discount for monthly

    const cost = parseFloat(planCost);
    const costPerMonth = cost / months;
    const savings = baseMonthlyPrice - costPerMonth;

    // Only show discount if there's meaningful savings (at least 0.1%)
    if (savings > 0.001) {
      const discountPercent = (savings / baseMonthlyPrice) * 100;
      return Math.round(discountPercent);
    }
    return null;
  };

  const plan = selectedPlan || plans[0];
  const cost = plan ? parseFloat(plan.cost) : 0;

  return (
    <Modal open={open} onClose={onClose} title={number.status === "expired" ? "Reactivate number" : "Extend number"} subtitle={number.number}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", borderRadius: 11, background: "var(--surface-2)", marginBottom: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-muted)" }}>
          <Badge tone={number.type === "Private" ? "solid" : "accent"}>{number.type}</Badge>
          {number.type === "Private" ? `Priced for ${number.country}` : `${number.service} · shared rate`}
        </span>
      </div>
      {isLoading ? (
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--accent-soft)", marginBottom: 18 }}>
          <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} /></span>
          <span style={{ fontSize: 12.5, color: "var(--accent)", lineHeight: 1.5 }}>Loading renewal plans...</span>
        </div>
      ) : plans.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 16 }}>
          {plans.map((p) => {
            const sel = plan?.rent_time_id === p.rent_time_id;
            const termLabel = termLabelOf(p.terms);
            const discount = getDiscount(p.cost, p.terms);
            return (
              <button key={p.rent_time_id} onClick={() => setSelectedPlan(p)} style={{ padding: "12px 13px", borderRadius: 12, textAlign: "left", background: sel ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${sel ? "var(--accent-border)" : "var(--border)"}`, position: "relative" }}>
                {discount && (
                  <span style={{ position: "absolute", top: -8, right: 8, background: "var(--success)", color: "white", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                    Save {discount}%
                  </span>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 550 }}>{termLabel}</span>
                  {sel && <span style={{ color: "var(--accent)" }}><Icon name="check" size={15} strokeWidth={2.3} /></span>}
                </div>
                <span className="mono tnum" style={{ fontSize: 12, color: sel ? "var(--accent)" : "var(--text-faint)" }}>${p.cost}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--danger-soft)", marginBottom: 18 }}>
          <span style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} /></span>
          <span style={{ fontSize: 12.5, color: "var(--danger)", lineHeight: 1.5 }}>Renewal plans are not available. Please try again later.</span>
        </div>
      )}
      {plans.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, padding: "0 2px" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Total</span><span className="mono tnum" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>${cost.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button full variant="subtle" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button full icon={isSubmitting ? undefined : "refresh"} onClick={() => plan && onConfirm(plan.rent_time_id)} disabled={!plan || isSubmitting}>
              {isSubmitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                  Processing...
                </span>
              ) : (
                `Pay $${cost.toFixed(2)}`
              )}
            </Button>
          </div>
        </>
      )}
      {plans.length === 0 && (
        <div style={{ display: "flex", gap: 10 }}>
          <Button full variant="subtle" onClick={onClose}>Close</Button>
        </div>
      )}
    </Modal>
  );
}

const PriceRow = ({ label, value, strong }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
    <span style={{ fontSize: strong ? 13.5 : 12.5, fontWeight: strong ? 600 : 400, color: strong ? "var(--text)" : "var(--text-muted)" }}>{label}</span>
    <span className="mono tnum" style={{ fontSize: strong ? 18 : 13, fontWeight: strong ? 600 : 500, letterSpacing: strong ? "-0.02em" : 0 }}>{value}</span>
  </div>
);

// Price comes from /user/restore-number-price; the server is the authority on
// eligibility, so any error it returns (window closed, unsupported carrier, …)
// is shown verbatim and blocks the confirm button.
function RestoreModal({ number, open, onClose, onConfirm, price, isLoading = false, error = null, balance = 0, isSubmitting = false }) {
  if (!open) return null;

  const deadline = restoreDeadlineOf(number.expiresAt);
  const daysLeft = restoreDaysLeftOf(number.expiresAt);
  const wallet = typeof balance === "number" ? balance : 0;
  const total = price ? price.total : 0;
  const shortBy = price ? total - wallet : 0;
  const cantAfford = !!price && shortBy > 0.0001;
  const blocked = !!error;

  return (
    <Modal open={open} onClose={onClose} title="Reactivate number" subtitle={number.number}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", borderRadius: 11, background: "var(--surface-2)", marginBottom: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-muted)" }}>
          <Badge tone={number.type === "Private" ? "solid" : "accent"}>{number.type}</Badge>
          {number.type === "Private" ? `Priced for ${number.country}` : `${number.service} · shared rate`}
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--accent-soft)", marginBottom: 18 }}>
          <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} /></span>
          <span style={{ fontSize: 12.5, color: "var(--accent)", lineHeight: 1.5 }}>Checking restore price...</span>
        </div>
      ) : blocked ? (
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--danger-soft)", marginBottom: 18 }}>
          <span style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} /></span>
          <span style={{ fontSize: 12.5, color: "var(--danger)", lineHeight: 1.5 }}>{error.message || "This number can't be reactivated."}</span>
        </div>
      ) : price && (
        <>
          {deadline && daysLeft > 0 && (
            <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--warning-soft)", marginBottom: 14 }}>
              <span style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} /></span>
              <span style={{ fontSize: 12.5, color: "var(--warning)", lineHeight: 1.5 }}>
                Expired on {formatExpiryDate(number.expiresAt)}. Reactivate on the same number until {formatExpiryDate(deadline)} (<strong className="tnum">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</strong>). After that it's released for good.
              </span>
            </div>
          )}

          <div style={{ borderRadius: 12, border: "1px solid var(--border)", padding: "8px 14px", marginBottom: 14 }}>
            <PriceRow label="1 month of service" value={`$${price.monthlyFee.toFixed(2)}`} />
            {price.restoreFee > 0 && <PriceRow label="Restore fee (one-off)" value={`$${price.restoreFee.toFixed(2)}`} />}
            <div style={{ height: 1, background: "var(--border)", margin: "5px 0" }} />
            <PriceRow label="Total" value={`$${total.toFixed(2)}`} strong />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Wallet balance</span>
              <span className="mono tnum" style={{ fontSize: 13, fontWeight: 550, color: cantAfford ? "var(--danger)" : "var(--text)" }}>${wallet.toFixed(2)}</span>
            </div>
          </div>

          {cantAfford && (
            <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--danger-soft)", marginBottom: 14 }}>
              <span style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }}><Icon name="wallet" size={16} /></span>
              <span style={{ fontSize: 12.5, color: "var(--danger)", lineHeight: 1.5 }}>
                Your balance is <span className="tnum">${shortBy.toFixed(2)}</span> short. Top up your wallet before reactivating.
              </span>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <Button full variant="subtle" onClick={onClose} disabled={isSubmitting}>{blocked ? "Close" : "Cancel"}</Button>
        {!blocked && (
          <Button full icon={isSubmitting ? undefined : "refresh"} onClick={onConfirm} disabled={isLoading || !price || isSubmitting || cantAfford}>
            {isSubmitting ? (
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                Reactivating...
              </span>
            ) : price ? (
              `Pay $${total.toFixed(2)} & reactivate`
            ) : (
              "Reactivate"
            )}
          </Button>
        )}
      </div>
    </Modal>
  );
}

function TransferModal({ number, open, onClose, onConfirm, isSubmitting = false }) {
  const [to, setTo] = React.useState("");
  React.useEffect(() => { if (open) setTo(""); }, [open]);
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Transfer number" subtitle={number.number}>
      <label style={{ fontSize: 12.5, color: "var(--text-muted)", display: "block", marginBottom: 7, fontWeight: 500 }}>Recipient ZEDSMS ID or email</label>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="ZED-0000-0000 or email" style={modalInput} disabled={isSubmitting} autoFocus />
      <div style={{ display: "flex", gap: 10, padding: "11px 13px", borderRadius: 11, background: "var(--warning-soft)", margin: "16px 0 18px" }}>
        <span style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} /></span>
        <span style={{ fontSize: 12.5, color: "var(--warning)", lineHeight: 1.5 }}>The number and its remaining {number.days} days move to the recipient. You'll lose access immediately. This can't be undone.</span>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button full variant="subtle" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button full icon={isSubmitting ? undefined : "transfer"} onClick={() => to.trim() && onConfirm(to.trim())} disabled={!to.trim() || isSubmitting}>
          {isSubmitting ? (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Transferring...
            </span>
          ) : (
            "Transfer"
          )}
        </Button>
      </div>
    </Modal>
  );
}

function RenameModal({ number, open, onClose, onConfirm, isSubmitting = false }) {
  const [label, setLabel] = React.useState(number.label || "");
  React.useEffect(() => { if (open) setLabel(number.label || ""); }, [open]);
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Rename number" subtitle="Give this number a label to find it faster">
      <label style={{ fontSize: 12.5, color: "var(--text-muted)", display: "block", marginBottom: 7, fontWeight: 500 }}>Label</label>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Marketing WhatsApp" maxLength={28} style={modalInput} disabled={isSubmitting} autoFocus />
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <Button full variant="subtle" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button full icon={isSubmitting ? undefined : "check"} onClick={() => onConfirm(label.trim())} disabled={isSubmitting}>
          {isSubmitting ? (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Saving...
            </span>
          ) : (
            "Save label"
          )}
        </Button>
      </div>
    </Modal>
  );
}

function ReleaseModal({ number, open, onClose, onConfirm, isSubmitting = false }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Release this number?" subtitle={number.number}>
      <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--danger-soft)", marginBottom: 18 }}>
        <span style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }}><Icon name="trash" size={16} /></span>
        <span style={{ fontSize: 12.5, color: "var(--danger)", lineHeight: 1.5 }}>Releasing removes the number from your account{number.status === "active" ? ` and forfeits its remaining ${number.days} days` : ""}. Incoming messages will stop. This can't be undone.</span>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button full variant="subtle" onClick={onClose} disabled={isSubmitting}>Keep number</Button>
        <Button full variant="danger" icon={isSubmitting ? undefined : "trash"} onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Releasing...
            </span>
          ) : (
            "Release number"
          )}
        </Button>
      </div>
    </Modal>
  );
}

function ComposeModal({ number, open, onClose, onSend, isSubmitting = false }) {
  const [to, setTo] = React.useState("");
  const [body, setBody] = React.useState("");
  React.useEffect(() => { if (open) { setTo(""); setBody(""); } }, [open]);
  if (!open) return null;
  const segs = Math.max(1, Math.ceil(body.length / 160));
  const ready = to.trim().length >= 6 && body.trim().length > 0;
  const taStyle = { width: "100%", minHeight: 96, padding: "11px 14px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontSize: 14, lineHeight: 1.5, outline: "none", resize: "vertical", fontFamily: "inherit", disabled: isSubmitting };
  return (
    <Modal open={open} onClose={onClose} title="Send SMS" subtitle={`From ${number.number}`}>
      <label style={{ fontSize: 12.5, color: "var(--text-muted)", display: "block", marginBottom: 7, fontWeight: 500 }}>To</label>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+1 415 555 0123" inputMode="tel" className="mono" style={modalInput} disabled={isSubmitting} autoFocus />
      <label style={{ fontSize: 12.5, color: "var(--text-muted)", display: "block", margin: "14px 0 7px", fontWeight: 500 }}>Message</label>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your message…" disabled={isSubmitting} style={taStyle} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7, fontSize: 11.5, color: "var(--text-faint)" }}>
        <span className="tnum">{body.length} characters</span>
        <span className="tnum">{segs} SMS · ${(0.02 * segs).toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <Button full variant="subtle" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button full icon={isSubmitting ? undefined : "send"} onClick={() => ready && onSend({ to: to.trim(), body: body.trim(), segs })} disabled={!ready || isSubmitting}>
          {isSubmitting ? (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Sending...
            </span>
          ) : (
            "Send message"
          )}
        </Button>
      </div>
    </Modal>
  );
}

const NumbersScreen = () => {
  const navigate = useNavigate();
  const { numberKey } = useParams();
  const [filter, setFilter] = React.useState("active");
  const [typeFilter, setTypeFilter] = React.useState("all"); // 'all' | 'Private' | 'Shared'
  const { data: apiNumbers = [], isLoading: numbersLoading } = useNumbers();
  const { data: user } = useUser();
  const { data: balanceData } = useBalance();
  // ?q= comes from the top-bar search
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = React.useState(urlQuery);
  React.useEffect(() => { if (urlQuery) { setQuery(urlQuery); setFilter("all"); } }, [urlQuery]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [modal, setModal] = React.useState(null); // 'renew' | 'restore' | 'transfer' | 'rename' | 'release' | 'compose'
  const [msgTab, setMsgTab] = React.useState("inbox"); // 'inbox' | 'sent'
  const [msgQuery, setMsgQuery] = React.useState("");
  const [msgPage, setMsgPage] = React.useState(1);
  const msgCardRef = React.useRef(null);
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

  // Get formatted time remaining (days, hours, or minutes)
  const getTimeRemaining = (expiryDate) => {
    if (!expiryDate) return "0d";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - today;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMinutes > 0) return `${diffMinutes}m`;
    if (diffMs > 0) return "1m";
    return "expired";
  };

  // Format time as relative (e.g., "2 min ago")
  const getRelativeTime = (dateString) => {
    if (!dateString) return "now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get recent messages to calculate unread counts per number
  const { data: recentMessages = [] } = useRecentMessages();

  // Normalize API numbers to component format
  const numbers = React.useMemo(() => {
    return apiNumbers.map((n) => {
      const expiryTs = n.expires_at || n.expiry;
      const daysLeft = getDaysRemaining(expiryTs);
      // Use total_sms_count from API (new endpoint has this built-in)
      const messageCount = n.total_sms_count || 0;

      // Determine type ID: check multiple possible field names
      let typeId = n.mobile_number_type_id;
      if (!typeId) {
        // Map from type field: "private" → 2, "shared" → 1
        const typeStr = (n.type || "").toLowerCase();
        typeId = typeStr.includes("private") ? 2 : 1;
      }

      const isPrivate = typeId === 2;

      const normalized = {
        id: n.id,
        // ids are per-table, so a shared and a private number can share one — select by uid
        uid: `${isPrivate ? "private" : "shared"}:${n.id}`,
        iso: n.iso || "GB",
        number: n.number || "",
        service: n.service_name || (isPrivate ? "Private" : "SMS"),
        type: isPrivate ? "Private" : "Shared",
        mobile_number_type_id: typeId,
        country: n.country || "Unknown",
        days: daysLeft,
        timeRemaining: getTimeRemaining(expiryTs),
        expiresAt: expiryTs,
        status: n.status || (daysLeft > 0 ? "active" : "expired"),
        label: n.label && n.label.trim() !== "" ? n.label : null,
        autoRenew: n.auto_renew === true || n.auto_renew === 1 || false,
        unread: messageCount
      };

      // lapsed numbers keep a grace window in which they can be reactivated
      const lapsed = isLapsed(normalized.status);
      normalized.restoreDeadline = lapsed ? restoreDeadlineOf(expiryTs) : null;
      normalized.restoreDaysLeft = lapsed ? restoreDaysLeftOf(expiryTs) : 0;
      normalized.canRestore = lapsed && !!normalized.restoreDeadline && normalized.restoreDaysLeft > 0;

      return normalized;
    });
  }, [apiNumbers]);

  // the open number lives in the URL; once one is open, switching numbers replaces
  // the history entry so Back returns to the list instead of every number viewed
  const openNumber = (n) => navigate(`/app/numbers/${numberKeyOf(n.uid)}`, { replace: !!numberKey });
  const backToList = () => navigate("/app/numbers");

  // on small screens the detail is its own page, so start it at the top
  React.useEffect(() => {
    if (numberKey && window.matchMedia("(max-width: 1080px)").matches) window.scrollTo(0, 0);
  }, [numberKey]);

  const list = numbers
    .filter((n) => {
      if (filter === "all") return true;
      if (filter === "expired") return n.status === "expired" || n.status === "disconnected";
      return n.status === filter;
    })
    .filter((n) => (typeFilter === "all" ? true : n.type === typeFilter))
    .filter((n) => n.number.includes(query) || n.country.toLowerCase().includes(query.toLowerCase()) || (n.service || "").toLowerCase().includes(query.toLowerCase()) || (n.label || "").toLowerCase().includes(query.toLowerCase()));
  // keys are uids; plain ids still come in from the home screen shortcuts.
  // With nothing in the URL the desktop split view previews the first number.
  const current = numberKey
    ? numbers.find((n) => n.uid === numberIdOfKey(numberKey)) || numbers.find((n) => String(n.id) === numberKey)
    : list[0];

  // Get messages for current number
  const { data: msgData, isLoading: messagesLoading, isFetching: messagesFetching } = useMessages(current?.id, msgPage, current?.mobile_number_type_id);
  const rawMessages = React.useMemo(() => msgData?.rows || [], [msgData]);
  const msgLastPage = msgData?.lastPage || 1;
  const msgTotal = msgData?.total || 0;
  const goMsgPage = (p) => {
    setMsgPage(p);
    msgCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Normalize messages from API - separate incoming and outgoing
  const { incomingMessages, outgoingMessages } = React.useMemo(() => {
    const incoming = [];
    const outgoing = [];

    const extractCode = (body) => {
      if (!body) return "";
      // Match 4-6 digit codes, or codes with dashes like "729-301"
      const codeMatch = body.match(/(\d{4,6}|\d{3}-\d{3}|\d{2}-\d{4})/);
      return codeMatch ? codeMatch[0] : "";
    };

    rawMessages.forEach((m) => {
      const bodyText = m.sms_content || m.message_body || m.body || "";
      const normalized = {
        id: m.id,
        numberId: current?.id,
        body: bodyText,
        time: getRelativeTime(m.created_at || m.date_time),
        code: m.otp_code || m.code || extractCode(bodyText),
        unread: !m.is_read,
        color: m.color
      };

      // Separate based on direction
      if (m.direction === "outgoing") {
        outgoing.push({
          ...normalized,
          to: m.to_number || "Unknown",
          status: m.status === 1 ? "delivered" : "sending"
        });
      } else {
        // For incoming messages, try to extract service name
        const serviceName = m.service_name ||
                           (bodyText?.toLowerCase().includes("whatsapp") ? "WhatsApp" :
                            bodyText?.toLowerCase().includes("instagram") ? "Instagram" :
                            bodyText?.toLowerCase().includes("uber") ? "Uber" :
                            bodyText?.toLowerCase().includes("code") || bodyText?.toLowerCase().includes("verification") ? "Verification" :
                            (m.from_number || m.sms_from || m.from || "Unknown"));

        incoming.push({
          ...normalized,
          from: serviceName,
          letter: serviceName[0].toUpperCase()
        });
      }
    });

    return { incomingMessages: incoming, outgoingMessages: outgoing };
  }, [rawMessages, current?.id]);

  const thread = incomingMessages;
  const sentThread = outgoingMessages;
  const isPrivate = !!current && current.type === "Private";
  // reset the message view whenever the selected number changes
  React.useEffect(() => { setMsgTab("inbox"); setMsgQuery(""); setMsgPage(1); }, [numberKey]);

  // Initialize mutations and queries
  const extendMutation = useExtendNumber();
  const restoreMutation = useRestoreNumber();
  const transferMutation = useTransferNumber();
  const renameMutation = useRenameNumber();
  const releaseMutation = useReleaseNumber();
  const autoRenewMutation = useUpdateAutoRenew();
  const sendSmsMutation = useSendSmsFromNumber();
  const { data: extensionPlans = [], isLoading: extensionPlansLoading } = useNumberExtensionPlans(modal === "renew" ? current?.id : null, current?.mobile_number_type_id);
  const { data: restorePrice, isLoading: restorePriceLoading, error: restorePriceError } = useRestoreNumberPrice(modal === "restore" ? current?.id : null);

  // ---- actions ----
  const doExtend = (rentTimeId) => {
    if (current) {
      extendMutation.mutate({ numberId: current.id, plan: rentTimeId, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setModal(null);
          showToast(`${current.label || current.number} extended`);
        },
        onError: (err) => showToast(err?.message || "Failed to extend number", "danger")
      });
    }
  };

  const doRestore = () => {
    if (current) {
      const lbl = current.label || current.number;
      restoreMutation.mutate(current.id, {
        onSuccess: () => {
          setModal(null);
          showToast(`${lbl} reactivated`);
        },
        onError: (err) => showToast(err?.message || "Failed to reactivate number", "danger")
      });
    }
  };

  const doTransfer = (to) => {
    if (current && isLapsed(current.status)) {
      showToast("Expired numbers can't be transferred — reactivate it first", "danger");
      return;
    }
    if (current) {
      const lbl = current.number;
      transferMutation.mutate({ numberId: current.id, toZedId: to, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setModal(null);
          showToast(`${lbl} transferred to ${to}`, "accent");
        },
        onError: (err) => showToast(err?.message || "Failed to transfer number", "danger")
      });
    }
  };

  const doRename = (label) => {
    if (current) {
      renameMutation.mutate({ numberId: current.id, label, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setModal(null);
          showToast(label ? `Label saved` : `Label removed`);
        },
        onError: (err) => showToast(err?.message || "Failed to rename number", "danger")
      });
    }
  };

  const doRelease = () => {
    if (current) {
      const lbl = current.number;
      releaseMutation.mutate({ numberId: current.id, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setModal(null);
          showToast(`${lbl} released`, "danger");
          backToList();
        },
        onError: (err) => showToast(err?.message || "Failed to release number", "danger")
      });
    }
  };

  const toggleAuto = () => {
    if (current) {
      const next = !current.autoRenew;
      autoRenewMutation.mutate({ numberId: current.id, enabled: next, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setMenuOpen(false);
          showToast(next ? "Auto-renew turned on" : "Auto-renew turned off", next ? "success" : "danger");
        },
        onError: (err) => showToast(err?.message || "Failed to update auto-renew", "danger")
      });
    }
  };

  const doSend = ({ to, body }) => {
    if (current) {
      sendSmsMutation.mutate({ numberId: current.id, to, body }, {
        onSuccess: () => {
          setModal(null);
          setMsgTab("inbox");
          showToast(`Message sent to ${to}`);
        },
        onError: (err) => showToast("Failed to send SMS", "danger")
      });
    }
  };

  const Tab = ({ id, label, count }) => (
    <button onClick={() => setFilter(id)} style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
      background: filter === id ? "var(--surface)" : "transparent", color: filter === id ? "var(--text)" : "var(--text-muted)", boxShadow: filter === id ? "var(--shadow-sm)" : "none", border: filter === id ? "1px solid var(--border)" : "1px solid transparent" }}>
      {label} <span className="tnum" style={{ fontSize: 11, color: "var(--text-faint)" }}>{count}</span>
    </button>
  );

  const MsgTab = ({ id, label, count, icon }) => (
    <button onClick={() => setMsgTab(id)} style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
      background: msgTab === id ? "var(--surface)" : "transparent", color: msgTab === id ? "var(--text)" : "var(--text-muted)", boxShadow: msgTab === id ? "var(--shadow-sm)" : "none", border: msgTab === id ? "1px solid var(--border)" : "1px solid transparent" }}>
      <Icon name={icon} size={14} /> {label} <span className="tnum" style={{ fontSize: 11, color: "var(--text-faint)" }}>{count}</span>
    </button>
  );

  const TypeChip = ({ id, label, count }) => {
    const sel = typeFilter === id;
    return (
      <button onClick={() => setTypeFilter(id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 11px", borderRadius: 99, fontSize: 12, fontWeight: 500,
        background: sel ? "var(--accent-soft)" : "transparent", color: sel ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${sel ? "var(--accent-border)" : "var(--border)"}`, transition: "all 0.14s" }}
        onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = "var(--surface-2)"; }} onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
        {label}<span className="tnum" style={{ fontSize: 11, fontWeight: 600, opacity: sel ? 0.75 : 0.55 }}>{count}</span>
      </button>
    );
  };

  const MenuRow = ({ icon, label, sub, danger, right, onClick, disabled }) => (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} title={disabled ? sub : undefined}
      style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 11px", borderRadius: 9, textAlign: "left",
        color: disabled ? "var(--text-faint)" : danger ? "var(--danger)" : "var(--text)", cursor: disabled ? "not-allowed" : "pointer" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = danger ? "var(--danger-soft)" : "var(--surface-2)"; }}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      <Icon name={icon} size={16} />
      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 450 }}>{label}</div>{sub && <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{sub}</div>}</div>
      {right}
    </button>
  );

  return (
    <>
    <div className="view-enter numbers-layout" data-view={numberKey ? "detail" : "list"} style={{ display: "grid", gridTemplateColumns: "340px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
      {/* list pane */}
      <Card className="numbers-list" style={{ overflow: "hidden", position: "sticky", top: 82 }}>
        <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 10, color: "var(--text-faint)" }}>
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search numbers" style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 13, width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", borderRadius: 10 }}>
            <Tab id="active" label="Active" count={numbers.filter((n) => n.status === "active").length} />
            <Tab id="expired" label="Expired" count={numbers.filter((n) => n.status === "expired" || n.status === "disconnected").length} />
            <Tab id="all" label="All" count={numbers.length} />
          </div>
          {(() => {
            const inStatus = numbers.filter((n) => {
              if (filter === "all") return true;
              if (filter === "expired") return n.status === "expired" || n.status === "disconnected";
              return n.status === filter;
            });
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-faint)", marginRight: 1 }}>Type</span>
                <TypeChip id="all" label="All" count={inStatus.length} />
                <TypeChip id="Private" label="Private" count={inStatus.filter((n) => n.type === "Private").length} />
                <TypeChip id="Shared" label="Shared" count={inStatus.filter((n) => n.type === "Shared").length} />
              </div>
            );
          })()}
        </div>
        <div className="numbers-list-scroll" style={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto", padding: 8 }}>
          {list.length === 0 && <Empty icon="grid" label="No numbers here" />}
          {list.map((n) => {
            // only mark a number selected when its page is open, not the desktop preview
            const isSel = !!numberKey && current && n.uid === current.uid;
            return (
              <button key={n.uid} onClick={() => openNumber(n)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "11px 11px", borderRadius: 11, textAlign: "left", marginBottom: 2,
                background: isSel ? "var(--accent-soft)" : "transparent", border: isSel ? "1px solid var(--accent-border)" : "1px solid transparent", transition: "background 0.12s" }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--surface-2)"; }} onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                <FlagAvatar iso={n.iso || "GB"} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono tnum" style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: n.status === "expired" ? 0.55 : 1 }}>{n.number}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {n.label ? (
                      <>
                        <span style={{ color: "var(--text-faint)" }}>{n.type || "Shared"}</span>
                        <span style={{ margin: "0 3px", color: "var(--text-faint)" }}>·</span>
                        <Badge tone="accent" style={{ flexShrink: 0 }}>{n.label}</Badge>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "var(--text-faint)" }}>{n.service || "Private"}</span>
                        <span style={{ margin: "0 3px", color: "var(--text-faint)" }}>·</span>
                        <span style={{ color: "var(--text-faint)" }}>{n.country}</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                  {n.unread > 0 && (
                    <span className="tnum" title={`${n.unread} new ${n.unread === 1 ? "message" : "messages"}`} style={{ display: "inline-flex", alignItems: "center", gap: 3, height: 18, padding: "0 6px 0 5px", borderRadius: 99, background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 600 }}>
                      <Icon name="msg" size={11} strokeWidth={2.2} />{n.unread}
                    </span>
                  )}
                  {isLapsed(n.status)
                    ? <>
                        <Badge tone="neutral">Expired</Badge>
                        {n.canRestore && <span className="tnum" style={{ fontSize: 11, color: "var(--warning)" }}>{n.restoreDaysLeft}d to reactivate</span>}
                      </>
                    : <Badge tone={n.days <= 7 ? "warning" : "success"} className="tnum">{n.timeRemaining} left</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* detail pane */}
      <div className="numbers-detail" style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <button onClick={backToList} className="numbers-back" style={{ alignItems: "center", gap: 4, alignSelf: "flex-start", height: 32, padding: "0 10px 0 4px", marginBottom: -4, borderRadius: 9, fontSize: 13.5, fontWeight: 500, color: "var(--text-muted)" }}>
          <Icon name="chevL" size={18} /> All numbers
        </button>
        {numbersLoading ? <div className="skel" style={{ height: 180 }} />
          : !current ? <Card style={{ padding: 18 }}><Empty icon="grid" label={numberKey ? "This number is no longer in your account" : "No number selected"} /></Card> : (
          <>
            <Card style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <FlagAvatar iso={current?.iso || "GB"} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
                    <span className="mono tnum" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", overflowWrap: "anywhere" }}>{current.number}</span>
                    <button onClick={() => copyText(current.number.replace(/\s/g, "")).then((ok) => showToast(ok ? "Number copied" : "Couldn't copy — press and hold to copy instead", ok ? "success" : "danger"))} title="Copy number" style={{ color: "var(--text-faint)", display: "flex", flexShrink: 0 }}><Icon name="copy" size={15} /></button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    {current.service && <Badge tone="neutral">{current.service}</Badge>}
                    <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{current.country}</span>
                  </div>
                  {current.label && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 12.5, fontWeight: 500, color: "var(--accent)", minWidth: 0 }}>
                      <Icon name="user" size={13} strokeWidth={2} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current.label}</span>
                    </div>
                  )}
                </div>
                <div className="num-actions" style={{ display: "flex", gap: 8, position: "relative" }}>
                  {isLapsed(current.status)
                    ? <Button variant="ghost" size="sm" icon="refresh" onClick={() => setModal("restore")} title={current.canRestore ? `Reactivate on the same number — ${current.restoreDaysLeft} day${current.restoreDaysLeft === 1 ? "" : "s"} left` : `The ${RESTORE_WINDOW_DAYS}-day reactivation window has closed`}>Reactivate</Button>
                    : <Button variant="ghost" size="sm" icon="refresh" onClick={() => setModal("renew")}>Extend</Button>}
                  <Button variant="subtle" size="sm" icon="sliders" iconRight="chevD" onClick={() => setMenuOpen((v) => !v)}>Manage</Button>
                  {menuOpen && (
                    <>
                      <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
                      <div style={{ position: "absolute", top: 44, right: 0, width: 252, maxWidth: "calc(100vw - 32px)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 13, boxShadow: "var(--shadow-pop)", zIndex: 70, padding: 6, animation: "popIn 0.15s ease both" }}>
                        <MenuRow icon="user" label="Rename / add label" sub={current.label || "No label set"} onClick={() => { setMenuOpen(false); setModal("rename"); }} />
                        <MenuRow icon="refresh" label="Auto-renew" sub={autoRenewMutation.isPending ? "Updating..." : (current.autoRenew ? "On — renews before expiry" : "Off")} onClick={toggleAuto} disabled={autoRenewMutation.isPending}
                          right={autoRenewMutation.isPending ? (
                            <span style={{ width: 34, height: 20, borderRadius: 99, background: "var(--surface-3)", padding: 2.5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                            </span>
                          ) : (
                            <span style={{ width: 34, height: 20, borderRadius: 99, background: current.autoRenew ? "var(--accent)" : "var(--surface-3)", padding: 2.5, flexShrink: 0, transition: "background 0.18s" }}><span style={{ display: "block", width: 15, height: 15, borderRadius: 99, background: "#fff", transform: current.autoRenew ? "translateX(14px)" : "none", transition: "transform 0.18s" }} /></span>
                          )} />
                        <MenuRow icon="transfer" label="Transfer number"
                          sub={isLapsed(current.status) ? "Expired numbers can't be transferred" : "Move to another user"}
                          disabled={isLapsed(current.status)}
                          onClick={() => { setMenuOpen(false); setModal("transfer"); }} />
                        <div style={{ height: 1, background: "var(--border)", margin: "5px 4px" }} />
                        <MenuRow icon="trash" label="Release number" sub="Cancel & remove" danger onClick={() => { setMenuOpen(false); setModal("release"); }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
              {(() => {
                const lapsed = isLapsed(current.status);
                const cell = (first) => ({ minWidth: 0, padding: first ? "0 12px 0 0" : "0 12px", borderLeft: first ? "none" : "1px solid var(--border)" });
                const label = { fontSize: 11.5, color: "var(--text-faint)", marginBottom: 4, whiteSpace: "nowrap" };
                const value = { fontSize: 15, fontWeight: 600, lineHeight: "20px", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" };
                const sub = { fontSize: 11.5, color: "var(--text-faint)", marginTop: 3, lineHeight: 1.35 };
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: 16, paddingTop: 15, borderTop: "1px solid var(--border)" }}>
                    <div style={cell(true)}>
                      <div style={label}>{lapsed ? "Expired on" : "Expires in"}</div>
                      <div className="mono tnum" style={{ ...value, color: lapsed ? "var(--danger)" : current.days <= 7 ? "var(--warning)" : "var(--text)" }}>
                        {lapsed ? formatExpiryDate(current.expiresAt) : `${current.days} day${current.days === 1 ? "" : "s"}`}
                      </div>
                      {lapsed
                        ? <div className="tnum" style={{ ...sub, color: current.canRestore ? "var(--warning)" : "var(--text-faint)" }}>{current.canRestore ? `Reactivate within ${current.restoreDaysLeft} day${current.restoreDaysLeft === 1 ? "" : "s"}` : "Reactivation window closed"}</div>
                        : <div className="tnum" style={sub}>{formatExpiryDate(current.expiresAt)}</div>}
                    </div>
                    <div style={cell(false)}>
                      <div style={label}>Status</div>
                      <div style={{ ...value, color: lapsed ? "var(--text-muted)" : "var(--success)" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 99, flexShrink: 0, background: lapsed ? "var(--text-faint)" : "var(--success)" }} />
                        {lapsed ? "Inactive" : "Active"}
                      </div>
                    </div>
                    <div style={cell(false)}>
                      <div style={label}>Auto-renew</div>
                      <div style={{ ...value, color: current.autoRenew ? "var(--success)" : "var(--text-muted)" }}>
                        <Icon name="refresh" size={14} strokeWidth={2} />
                        {current.autoRenew ? "On" : "Off"}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>

            <Card ref={msgCardRef} style={{ overflow: "hidden", scrollMarginTop: 76 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", borderRadius: 10 }}>
                  <MsgTab id="inbox" label="Inbox" count={isPrivate ? thread.length : msgTotal} icon="inbox" />
                  {isPrivate && <MsgTab id="sent" label="Sent" count={sentThread.length} icon="send" />}
                </div>
                {/* background refresh, with content already on screen */}
                {messagesFetching && !messagesLoading && (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-faint)", animation: "fadeIn 0.2s ease both" }}>
                    <span style={{ width: 11, height: 11, borderRadius: "50%", border: "2px solid var(--border-strong)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
                    Updating
                  </span>
                )}
                <div className="msg-toolbar-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-faint)" }}>
                    <Icon name="search" size={14} />
                    <input value={msgQuery} onChange={(e) => setMsgQuery(e.target.value)} placeholder={msgTab === "sent" ? "Search sent" : "Search messages"} style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 12.5, width: "100%", minWidth: 80, maxWidth: 160 }} />
                  </div>
                  {isPrivate
                    ? <Button size="sm" icon="send" onClick={() => setModal("compose")} disabled={current.status === "expired"}>Send SMS</Button>
                    : <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-faint)", padding: "0 4px", whiteSpace: "nowrap" }}><Icon name="info" size={13} /> Receive-only</span>}
                </div>
              </div>
              {(() => {
                const q = msgQuery.trim().toLowerCase();
                if (msgTab === "sent") {
                  const all = sentThread;
                  const rows = q ? all.filter((m) => m.body.toLowerCase().includes(q) || m.to.includes(q)) : all;
                  return (
                    <>
                      {q && all.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", fontSize: 11.5, color: "var(--text-faint)", borderBottom: "1px solid var(--border)" }}>
                          <span className="tnum">{rows.length} of {all.length} sent</span>
                          <span>Newest first</span>
                        </div>
                      )}
                      <div className="msg-scroll" style={{ maxHeight: "52vh", overflowY: "auto", padding: "6px 8px 10px" }}>
                        {messagesLoading ? <MessageSkeleton rows={3} />
                          : all.length === 0 ? <Empty icon="send" label="No sent messages yet — tap Send SMS to start a conversation" />
                          : rows.length === 0 ? <Empty icon="search" label={`No sent messages match “${msgQuery}”`} />
                          : rows.map((m, i) => (
                            <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "13px 12px", borderRadius: 12, borderBottom: "1px solid var(--border)", animation: "slideUp 0.26s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${Math.min(i, 6) * 35}ms` }}>
                              <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="send" size={17} /></span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>To</span>
                                  <span className="mono tnum" style={{ fontSize: 13, fontWeight: 550 }}>{m.to}</span>
                                  <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>· {m.time}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>{m.body}</p>
                              </div>
                              <Badge tone="success" dot>{m.status === "delivered" ? "Delivered" : "Sending"}</Badge>
                            </div>
                          ))}
                      </div>
                    </>
                  );
                }
                const all = thread;
                const rows = q ? all.filter((m) => m.body.toLowerCase().includes(q) || (m.from || "").toLowerCase().includes(q) || (m.code || "").includes(q)) : all;
                return (
                  <>
                    {q && all.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", fontSize: 11.5, color: "var(--text-faint)", borderBottom: "1px solid var(--border)" }}>
                        <span className="tnum">{rows.length} of {all.length} message{all.length === 1 ? "" : "s"}</span>
                        <span>Newest first</span>
                      </div>
                    )}
                    <div className="msg-scroll" style={{ maxHeight: "52vh", overflowY: "auto", padding: "6px 8px 10px" }}>
                      {messagesLoading ? <MessageSkeleton />
                        : all.length === 0 ? <Empty icon="msg" label="No messages yet — codes appear here instantly" />
                        : rows.length === 0 ? <Empty icon="search" label={`No messages match “${msgQuery}”`} />
                        : rows.map((m, i) => {
                          const getAvatarColor = (from) => {
                            const lower = from.toLowerCase();
                            if (lower.includes("whatsapp")) return "#25D366";
                            if (lower.includes("instagram")) return "#E4405F";
                            if (lower.includes("uber")) return "#000000";
                            if (lower.includes("verif")) return "#6B7280";
                            return "#3B82F6";
                          };
                          const displayText = m.from.startsWith("+") ? m.from.slice(1, 2) : m.from.substring(0, 1);
                          return (
                            <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border)", animation: "slideUp 0.26s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${Math.min(i, 6) * 35}ms` }}>
                              <div style={{ width: 48, height: 48, borderRadius: 12, background: getAvatarColor(m.from), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: 20, fontWeight: 600, color: "white" }}>{displayText.toUpperCase()}</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", marginBottom: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{m.from}</span>
                                    <span style={{ fontSize: 13, color: "var(--text-faint)" }}>· {m.time}</span>
                                  </div>
                                  {m.unread && <Badge tone="accent" dot>new</Badge>}
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: m.code ? 10 : 0 }}>{m.body}</p>
                                {m.code && <CodeChip code={m.code} size="md" />}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                );
              })()}
              {msgLastPage > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
                  <span className="tnum" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    Page <span style={{ fontWeight: 600, color: "var(--text)" }}>{msgPage}</span> of {msgLastPage} · {msgTotal} messages
                  </span>
                  <Pagination page={msgPage} lastPage={msgLastPage} onChange={goMsgPage} />
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>

    {current && <ExtendModal number={current} open={modal === "renew"} onClose={() => setModal(null)} onConfirm={doExtend} plans={extensionPlans} isLoading={extensionPlansLoading} isSubmitting={extendMutation.isPending} />}
    {current && <RestoreModal number={current} open={modal === "restore"} onClose={() => setModal(null)} onConfirm={doRestore} price={restorePrice} isLoading={restorePriceLoading} error={restorePriceError} balance={balanceData?.amount || 0} isSubmitting={restoreMutation.isPending} />}
    {current && <TransferModal number={current} open={modal === "transfer"} onClose={() => setModal(null)} onConfirm={doTransfer} isSubmitting={transferMutation.isPending} />}
    {current && <RenameModal number={current} open={modal === "rename"} onClose={() => setModal(null)} onConfirm={doRename} isSubmitting={renameMutation.isPending} />}
    {current && <ReleaseModal number={current} open={modal === "release"} onClose={() => setModal(null)} onConfirm={doRelease} isSubmitting={releaseMutation.isPending} />}
    {current && <ComposeModal number={current} open={modal === "compose"} onClose={() => setModal(null)} onSend={doSend} isSubmitting={sendSmsMutation.isPending} />}
    <Toast toast={toast} />
    </>
  );
};

export { HomeScreen, NumbersScreen };
