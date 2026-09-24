import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FlagAvatar, ServiceAvatar } from "../components/ui/Avatars";
import { CodeChip } from "../components/ui/CodeChip";
import { Empty } from "../components/ui/Empty";
import { Modal } from "../components/ui/Modal";
import { Toast } from "../components/ui/Toast";
import { useUser } from "../hooks/useUser";
import { useBalance } from "../hooks/useBalance";
import { useSharedCountries, useSharedServices, useSharedNumbers, useSharedRentTimes, usePrivateCountries, usePrivateAvailableNumbers, usePrivatePlans, usePurchaseNumber } from "../hooks/useBuy";
import { privateUpstreamOf, sharedPriceOf } from "../api/buy";
import { usePaymentGateways, useStartTopUp } from "../hooks/useTopUp";
import { amountError, feeFor, feeLabel } from "../api/topup";
import { useTransactions, useTransferBalance } from "../hooks/useTransactions";
import { TRANSACTION_STATUS } from "../api/transactions";
import { useProfile, useChangePassword, useRequestEmailChange, useVerifyEmailChange, useSessions, useRevokeSession, useRevokeOtherSessions, use2fa, useGenerate2faSecret, useEnable2fa, useDisable2fa, useRegenerateRecoveryCodes, useDeleteAccount } from "../hooks/useSettings";
import { useAuthContext } from "../context/AuthContext";
import { LOGIN_METHODS } from "../mocks/seed";
import { NotificationsSettings } from "./notifications";

// ============ BUY NUMBER ============
const INBOUND_FREE = 50;        // free inbound SMS for US numbers
const INBOUND_RATE = 0.03;      // per inbound SMS after the free quota (US only)

// US states with a representative area code — private US numbers are picked by state.
const US_STATES = [
  ["AL", "Alabama", "205"], ["AK", "Alaska", "907"], ["AZ", "Arizona", "602"], ["AR", "Arkansas", "501"],
  ["CA", "California", "415"], ["CO", "Colorado", "303"], ["CT", "Connecticut", "203"], ["DE", "Delaware", "302"],
  ["FL", "Florida", "305"], ["GA", "Georgia", "404"], ["HI", "Hawaii", "808"], ["ID", "Idaho", "208"],
  ["IL", "Illinois", "312"], ["IN", "Indiana", "317"], ["IA", "Iowa", "515"], ["KS", "Kansas", "316"],
  ["KY", "Kentucky", "502"], ["LA", "Louisiana", "504"], ["ME", "Maine", "207"], ["MD", "Maryland", "410"],
  ["MA", "Massachusetts", "617"], ["MI", "Michigan", "313"], ["MN", "Minnesota", "612"], ["MS", "Mississippi", "601"],
  ["MO", "Missouri", "314"], ["MT", "Montana", "406"], ["NE", "Nebraska", "402"], ["NV", "Nevada", "702"],
  ["NH", "New Hampshire", "603"], ["NJ", "New Jersey", "201"], ["NM", "New Mexico", "505"], ["NY", "New York", "212"],
  ["NC", "North Carolina", "704"], ["ND", "North Dakota", "701"], ["OH", "Ohio", "216"], ["OK", "Oklahoma", "405"],
  ["OR", "Oregon", "503"], ["PA", "Pennsylvania", "215"], ["RI", "Rhode Island", "401"], ["SC", "South Carolina", "803"],
  ["SD", "South Dakota", "605"], ["TN", "Tennessee", "615"], ["TX", "Texas", "214"], ["UT", "Utah", "801"],
  ["VT", "Vermont", "802"], ["VA", "Virginia", "703"], ["WA", "Washington", "206"], ["WV", "West Virginia", "304"],
  ["WI", "Wisconsin", "414"], ["WY", "Wyoming", "307"],
];

// Searchable state dropdown (select2-style): trigger opens a panel with a search box + filtered list.
// value "" means "any state" — Telnyx then searches the whole country.
const StateSelect = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const rootRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const cur = US_STATES.find((s) => s[0] === value);
  const filtered = US_STATES.filter(([code, name, area]) => {
    const t = q.trim().toLowerCase();
    return !t || name.toLowerCase().includes(t) || code.toLowerCase().includes(t) || area.includes(t);
  });
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    setTimeout(() => searchRef.current && searchRef.current.focus(), 10);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const pick = (code) => { onChange(code); setOpen(false); setQ(""); };
  const rowStyle = (sel) => ({ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 8, textAlign: "left",
    background: sel ? "var(--accent-soft)" : "transparent", color: sel ? "var(--accent)" : "var(--text)", fontSize: 13, fontWeight: sel ? 550 : 450 });
  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1, maxWidth: 300 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 42, padding: "0 12px", borderRadius: 11, border: `1px solid ${open ? "var(--accent-border)" : "var(--border-strong)"}`, background: "var(--surface)", color: "var(--text)", fontSize: 13.5, fontWeight: 500, textAlign: "left", transition: "border-color 0.14s" }}>
        <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cur ? cur[1] : "Any state"}</span>
        {cur && <span className="mono tnum" style={{ fontSize: 12, color: "var(--text-faint)", flexShrink: 0 }}>({cur[2]})</span>}
        <span style={{ color: "var(--text-faint)", display: "flex", flexShrink: 0, transform: open ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.15s" }}><Icon name="chevR" size={15} /></span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 60, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, boxShadow: "var(--shadow-pop)", overflow: "hidden", animation: "fadeIn 0.14s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", height: 40, borderBottom: "1px solid var(--border)", color: "var(--text-faint)" }}>
            <Icon name="search" size={14} />
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search state or area code…"
              style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 13, width: "100%" }} />
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto", padding: 5 }}>
            {!q.trim() && (
              <button onClick={() => pick("")} style={rowStyle(!value)}>
                <span style={{ flex: 1 }}>Any state</span>
                {!value && <Icon name="check" size={14} strokeWidth={2.4} />}
              </button>
            )}
            {filtered.length === 0 && <div style={{ padding: "14px 12px", fontSize: 12.5, color: "var(--text-faint)", textAlign: "center" }}>No states match “{q}”</div>}
            {filtered.map(([code, name, area]) => {
              const sel = code === value;
              return (
                <button key={code} onClick={() => pick(code)} style={rowStyle(sel)}>
                  <span style={{ flex: 1 }}>{name}</span>
                  <span className="mono tnum" style={{ fontSize: 11.5, color: sel ? "var(--accent)" : "var(--text-faint)" }}>({area})</span>
                  {sel && <Icon name="check" size={14} strokeWidth={2.4} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline loading / empty / error line used inside the buy-flow cards.
const BuyNotice = ({ tone = "neutral", icon = "info", children, action }) => {
  const c = { neutral: ["var(--surface-2)", "var(--text-muted)"], accent: ["var(--accent-soft)", "var(--accent)"], danger: ["var(--danger-soft)", "var(--danger)"], warning: ["var(--warning-soft)", "var(--warning)"] }[tone];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11, background: c[0] }}>
      <span style={{ color: c[1], flexShrink: 0, display: "flex" }}>{tone === "accent" && icon === "info" ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <Icon name={icon} size={16} />}</span>
      <span style={{ flex: 1, fontSize: 12.5, color: c[1], lineHeight: 1.5 }}>{children}</span>
      {action}
    </div>
  );
};

const SearchBox = ({ value, onChange, placeholder = "Search", width = 110 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, height: 32, padding: "0 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-faint)" }}>
    <Icon name="search" size={14} />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 12.5, width }} />
  </div>
);

const StepTitle = ({ n, children, sub, right }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
    <div>
      <h3 style={{ margin: sub ? "0 0 4px" : 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}><span style={{ color: "var(--accent)" }}>{n}.</span>&nbsp; {children}</h3>
      {sub && <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)" }}>{sub}</p>}
    </div>
    {right}
  </div>
);

const pickCard = (sel) => ({ background: sel ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${sel ? "var(--accent-border)" : "var(--border)"}`, transition: "all 0.14s", textAlign: "left" });
const SelDot = ({ size = 19 }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="check" size={size - 7} strokeWidth={3} style={{ color: "#fff" }} /></span>
);

const NumberGrid = ({ items, pickedKey, onPick }) => (
  <div className="country-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxHeight: 300, overflowY: "auto", paddingRight: 4, marginRight: -4 }}>
    {items.map((n) => {
      const sel = pickedKey === n.key;
      return (
        <button key={n.key} onClick={() => onPick(n)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", borderRadius: 12, ...pickCard(sel) }}>
          <span style={{ width: 19, height: 19, borderRadius: 99, border: `2px solid ${sel ? "var(--accent)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: sel ? "var(--accent)" : "transparent" }}>{sel && <Icon name="check" size={11} strokeWidth={3} style={{ color: "#fff" }} />}</span>
          <span style={{ minWidth: 0 }}>
            <span className="mono tnum" style={{ display: "block", fontSize: 13, fontWeight: 550, color: sel ? "var(--accent)" : "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.number}</span>
            {n.detail && <span style={{ display: "block", fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.detail}</span>}
          </span>
        </button>
      );
    })}
  </div>
);

const ServiceLogo = ({ service, size = 40 }) => (
  service?.icon
    ? <img src={service.icon} alt="" style={{ width: size, height: size, borderRadius: size * 0.32, objectFit: "cover", flexShrink: 0, background: "var(--surface-2)" }} />
    : <ServiceAvatar color="var(--accent)" letter={(service?.name || "?")[0].toUpperCase()} size={size} />
);

const BuyScreen = ({ setRoute, openNumber }) => {
  const [type, setType] = React.useState("Private");
  const isPrivate = type === "Private";
  const [countryByType, setCountryByType] = React.useState({});
  const country = countryByType[type] || null;
  const setCountry = (c) => setCountryByType((m) => ({ ...m, [type]: c }));
  const [countryQuery, setCountryQuery] = React.useState("");
  const [svc, setSvc] = React.useState(null);
  const [svcQuery, setSvcQuery] = React.useState("");
  const [picked, setPicked] = React.useState(null);     // { key, number, payload } (private) | { id, number } (shared)
  const [planId, setPlanId] = React.useState(null);     // private plan id | shared rent_time id — both go out as rent_time_id
  const [usState, setUsState] = React.useState("");
  const [page, setPage] = React.useState(0);            // pivotel paging for "show different numbers"
  const [agreed, setAgreed] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const showToast = (msg, tone = "success") => { clearTimeout(toastTimer.current); setToast({ msg, tone }); toastTimer.current = setTimeout(() => setToast(null), 3200); };

  const { data: balanceData } = useBalance();
  const balance = balanceData?.amount || 0;
  const balanceKnown = balanceData !== undefined;
  const purchase = usePurchaseNumber();
  const processing = purchase.isPending;
  React.useEffect(() => {
    document.querySelector(".layout")?.classList.toggle("page-blur", processing);
    return () => document.querySelector(".layout")?.classList.remove("page-blur");
  }, [processing]);

  // ---- catalogs ----
  const privateCountries = usePrivateCountries(isPrivate);
  const sharedCountries = useSharedCountries(!isPrivate);
  const countries = isPrivate ? privateCountries : sharedCountries;
  const countryList = React.useMemo(() => countries.data || [], [countries.data]);

  const upstream = isPrivate && country ? privateUpstreamOf(country.iso) : null;
  const isUS = isPrivate && country?.iso === "us";
  const privateNumbers = usePrivateAvailableNumbers({ iso: isPrivate ? country?.iso : null, state: isUS ? usState : undefined, page });
  const privatePlans = usePrivatePlans(isPrivate ? country?.id : null);

  const sharedServices = useSharedServices(!isPrivate ? country?.id : null);
  const sharedNumbers = useSharedNumbers(!isPrivate ? country?.id : null, !isPrivate ? svc?.id : null);
  const rentTimes = useSharedRentTimes(!isPrivate);

  // ---- reset downstream picks when an upstream choice changes ----
  React.useEffect(() => { setCountryQuery(""); setSvcQuery(""); }, [type]);
  React.useEffect(() => { setSvc(null); setPicked(null); setPlanId(null); setPage(0); setUsState(""); }, [type, country?.id]);

  // default country: the first one in the list (UK when offered — see COUNTRY_ORDER in api/buy)
  React.useEffect(() => {
    if (country || countryList.length === 0) return;
    setCountry(countryList[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setCountry is keyed by type, covered by isPrivate
  }, [countryList, country, isPrivate]);

  // default number: first available
  const numberItems = React.useMemo(() => (isPrivate
    ? (privateNumbers.data || [])
    : (sharedNumbers.data || []).map((n) => ({ key: n.id, number: n.number, id: n.id }))
  ), [isPrivate, privateNumbers.data, sharedNumbers.data]);
  // keep the pick inside the current list — a refetch can drop the number that was picked
  React.useEffect(() => {
    if (numberItems.length === 0) { if (picked) setPicked(null); return; }
    if (!picked || !numberItems.some((n) => n.key === picked.key)) setPicked(numberItems[0]);
  }, [numberItems, picked]);

  // ---- plans + pricing (same maths as the backend's purchaseNumber) ----
  const plans = React.useMemo(() => isPrivate
    ? (privatePlans.data || []).map((p) => ({ id: p.id, label: p.label, price: p.total, off: p.off, sub: p.months > 1 ? `$${p.monthlyFee.toFixed(2)}/mo` : null }))
    : (rentTimes.data || []).map((r) => {
        const price = svc ? sharedPriceOf(svc, r.days) : null;
        const full = svc ? Math.round(svc.pricePerDay * r.days * 100) / 100 : null;
        return { id: r.id, label: r.name, price, off: full && price < full ? Math.round(((full - price) / full) * 100) : 0, sub: null };
      }), [isPrivate, privatePlans.data, rentTimes.data, svc]);
  React.useEffect(() => {
    if (plans.length > 0 && !plans.some((p) => p.id === planId)) setPlanId(plans[0].id);
  }, [plans, planId]);
  const plan = plans.find((p) => p.id === planId) || null;
  const total = plan?.price || 0;
  const plansLoading = isPrivate ? privatePlans.isLoading : rentTimes.isLoading;
  const plansError = isPrivate ? privatePlans.error : rentTimes.error;

  const insufficient = balanceKnown && !!plan && total > balance + 0.0001;
  const ready = !!country && !!picked && !!plan && (isPrivate || !!svc);
  const blocker = !country ? "Choose a country"
    : !isPrivate && !svc ? "Choose a service"
    : !picked ? "Pick a number"
    : !plan ? "Choose a plan"
    : insufficient ? `Add $${(total - balance).toFixed(2)} to your balance`
    : null;

  const filteredCountries = countryList.filter((c) => c.name.toLowerCase().includes(countryQuery.trim().toLowerCase()));
  const filteredSvc = (sharedServices.data || []).filter((s) => s.name.toLowerCase().includes(svcQuery.trim().toLowerCase()));
  const stateName = (US_STATES.find((s) => s[0] === usState) || [null, "Any state"])[1];
  const step = isPrivate ? { country: 2, number: 3, plan: 4 } : { country: 2, svc: 3, number: 4, plan: 5 };

  const refreshNumbers = () => {
    if (upstream === "pivotel") setPage((p) => p + 1);
    else (isPrivate ? privateNumbers : sharedNumbers).refetch();
  };

  // ---- purchase ----
  const confirmPurchase = () => {
    if (!agreed || processing || !ready || insufficient) return;
    const payload = isPrivate
      ? { mobile_number_type_id: 2, rent_time_id: plan.id, ...picked.payload }
      : { mobile_number_type_id: 1, mobile_number_id: picked.id, rent_time_id: plan.id };
    purchase.mutate(payload, {
      onSuccess: (data) => {
        // open it by uid — a shared and a private number can have the same id
        if (data?.id && openNumber) openNumber(`${isPrivate ? "private" : "shared"}:${data.id}`);
        else setRoute("numbers");
      },
      onError: (err) => {
        // 503 on private = the picked number was taken or the provider is busy — offer fresh numbers
        if (isPrivate && err.status === 503) {
          showToast(err.message || "That number is no longer available — please pick another", "danger");
          refreshNumbers();
        } else {
          showToast(err.message || "Purchase failed", "danger");
          if (!isPrivate) sharedNumbers.refetch();
        }
      },
    });
  };

  return (
    <>
    <div className="view-enter buy-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* type */}
        <Card style={{ padding: 18 }}>
          <StepTitle n={1}>Number type</StepTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { k: "Private", d: "A full private number. Works with any service — priced by country.", caps: [{ icon: "msg", label: "SMS" }, { icon: "phone", label: "Voice" }] },
              { k: "Shared", d: "A number for one specific service. Cheaper, from a shared pool.", caps: [{ icon: "inbox", label: "Receive SMS" }] },
            ].map((t) => {
              const sel = type === t.k;
              return (
                <button key={t.k} onClick={() => setType(t.k)} style={{ padding: "15px 16px", borderRadius: 12, ...pickCard(sel) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t.k}</span>
                    {sel && <span style={{ marginLeft: "auto" }}><SelDot /></span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, minHeight: 36 }}>{t.d}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 11 }}>
                    {t.caps.map((c) => (
                      <span key={c.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 24, padding: "0 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: sel ? "var(--surface)" : "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                        <span style={{ display: "flex", color: "var(--accent)" }}><Icon name={c.icon} size={12} strokeWidth={2} /></span>{c.label}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* country */}
        <Card style={{ padding: 18 }}>
          <StepTitle n={step.country} sub={isPrivate ? "Each country has its own rate — your plan price updates when you pick one." : "Pick where the number is based."}
            right={countryList.length > 8 && <SearchBox value={countryQuery} onChange={setCountryQuery} placeholder="Search country" />}>
            Choose a country
          </StepTitle>
          {countries.isLoading ? <BuyNotice tone="accent">Loading countries…</BuyNotice>
            : countries.error ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => countries.refetch()}>Retry</Button>}>{countries.error.message}</BuyNotice>
            : countryList.length === 0 ? <BuyNotice>No countries are available for {type.toLowerCase()} numbers right now.</BuyNotice>
            : filteredCountries.length === 0 ? <BuyNotice icon="search">No countries match “{countryQuery}”</BuyNotice>
            : (
              <div className="country-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, maxHeight: 316, overflowY: "auto", paddingRight: 4, marginRight: -4 }}>
                {filteredCountries.map((c) => {
                  const sel = country?.id === c.id;
                  return (
                    <button key={c.id} onClick={() => setCountry(c)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 12, ...pickCard(sel) }}>
                      <FlagAvatar iso={c.iso} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                        <div className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", textTransform: "uppercase" }}>{c.iso}</div>
                      </div>
                      {sel && <SelDot />}
                    </button>
                  );
                })}
              </div>
            )}
        </Card>

        {/* service — only for shared numbers */}
        {!isPrivate && country && (
          <Card style={{ padding: 18 }}>
            <StepTitle n={step.svc} right={(sharedServices.data || []).length > 8 && <SearchBox value={svcQuery} onChange={setSvcQuery} />}>Choose a service</StepTitle>
            {sharedServices.isLoading ? <BuyNotice tone="accent">Loading services for {country.name}…</BuyNotice>
              : sharedServices.error ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => sharedServices.refetch()}>Retry</Button>}>{sharedServices.error.message}</BuyNotice>
              : (sharedServices.data || []).length === 0 ? <BuyNotice>No shared services are priced for {country.name} yet. Try another country.</BuyNotice>
              : filteredSvc.length === 0 ? <BuyNotice icon="search">No services match “{svcQuery}”</BuyNotice>
              : (
                <div className="svc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxHeight: 296, overflowY: "auto", paddingRight: 4, marginRight: -4 }}>
                  {filteredSvc.map((s) => {
                    const sel = svc?.id === s.id;
                    return (
                      <button key={s.id} onClick={() => setSvc(s)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: "16px 8px", borderRadius: 13, ...pickCard(sel), textAlign: "center" }}>
                        <ServiceLogo service={s} size={40} />
                        <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s.name}</span>
                        <span className="mono tnum" style={{ fontSize: 11.5, color: sel ? "var(--accent)" : "var(--text-faint)" }}>${s.pricePerDay.toFixed(2)}/day</span>
                      </button>
                    );
                  })}
                </div>
              )}
          </Card>
        )}

        {/* pick a number */}
        {country && (isPrivate || svc) && (() => {
          const q = isPrivate ? privateNumbers : sharedNumbers;
          const where = isUS ? (usState ? stateName : "the United States") : country.name;
          return (
            <Card style={{ padding: 18 }}>
              <StepTitle n={step.number} sub={isPrivate
                ? (isUS ? "Pick a state to get its area codes, or leave it on any state." : "These numbers are available right now. The one you pick is yours.")
                : `Free ${svc.name} numbers in ${country.name}. Digits are partly hidden until the number is yours.`}>
                Pick your number
              </StepTitle>

              {isUS && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <label style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500, flexShrink: 0 }}>State</label>
                  <StateSelect value={usState} onChange={setUsState} />
                  {usState && <span className="mono tnum desktop-only" style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>area code ({(US_STATES.find((s) => s[0] === usState) || [])[2]})</span>}
                </div>
              )}

              {q.isFetching && numberItems.length === 0 ? <BuyNotice tone="accent">Searching available numbers…</BuyNotice>
                : q.error ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => q.refetch()}>Retry</Button>}>{q.error.message}</BuyNotice>
                : numberItems.length === 0 ? <BuyNotice>{isPrivate ? `No numbers available in ${where} right now.${isUS && usState ? " Try another state." : " Try again shortly."}` : `No free ${svc.name} numbers in ${country.name} right now. Try another service or country.`}</BuyNotice>
                : <NumberGrid items={numberItems} pickedKey={picked?.key} onPick={setPicked} />}

              {numberItems.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 13, gap: 10 }}>
                  <span className="tnum" style={{ fontSize: 12, color: "var(--text-faint)" }}>{numberItems.length} available in {where}</span>
                  <Button variant="subtle" size="sm" icon="refresh" onClick={refreshNumbers} disabled={q.isFetching}>{q.isFetching ? "Searching…" : "Show different numbers"}</Button>
                </div>
              )}
            </Card>
          );
        })()}

        {/* plan */}
        {country && (isPrivate || svc) && (
          <Card style={{ padding: 18 }}>
            <StepTitle n={step.plan}>Plan</StepTitle>
            {plansLoading ? <BuyNotice tone="accent">Loading plans…</BuyNotice>
              : plansError ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => (isPrivate ? privatePlans : rentTimes).refetch()}>Retry</Button>}>{plansError.message}</BuyNotice>
              : plans.length === 0 ? <BuyNotice>No plans are set up for {country.name} yet.</BuyNotice>
              : (
                <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(plans.length, 4)}, 1fr)`, gap: 10 }}>
                  {plans.map((p) => {
                    const sel = planId === p.id;
                    return (
                      <button key={p.id} onClick={() => setPlanId(p.id)} style={{ position: "relative", padding: "14px 12px", borderRadius: 12, ...pickCard(sel) }}>
                        {p.off > 0 && (
                          <span className="tnum" style={{ position: "absolute", top: 9, right: 9, fontSize: 10, fontWeight: 700, letterSpacing: "0.02em", color: "var(--success)", background: "var(--success-soft)", padding: "2px 6px", borderRadius: 999 }}>{p.off}% OFF</span>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.label}</span>
                          {sel && p.off === 0 && <span style={{ marginLeft: "auto" }}><SelDot size={17} /></span>}
                        </div>
                        <span className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: sel ? "var(--accent)" : "var(--text-muted)" }}>${(p.price || 0).toFixed(2)}</span>
                        {p.sub && <div className="mono tnum" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{p.sub}</div>}
                      </button>
                    );
                  })}
                </div>
              )}
          </Card>
        )}
      </div>

      {/* summary */}
      <Card style={{ padding: 18, position: "sticky", top: 82 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Order summary</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px", borderRadius: 12, background: "var(--surface-2)", marginBottom: 16 }}>
          {isPrivate || !svc
            ? (country ? <FlagAvatar iso={country.iso} size={42} /> : <span style={{ width: 42, height: 42, borderRadius: 99, background: "var(--surface-3)", flexShrink: 0 }} />)
            : <ServiceLogo service={svc} size={42} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={picked ? "mono tnum" : undefined} style={{ fontSize: 14, fontWeight: 550, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {picked ? picked.number : !isPrivate && svc ? svc.name : "Pick a number"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", overflow: "hidden" }}>
              {country && <FlagAvatar iso={country.iso} size={15} />}
              {country ? (isUS && usState ? `${stateName}, ${country.name}` : country.name) : "No country"}{isPrivate ? " · Private" : svc ? ` · ${svc.name}` : " · Shared"}
            </div>
          </div>
        </div>
        {[
          ["Type", type],
          ["Capabilities", (
            <span style={{ display: "inline-flex", gap: 5 }}>
              {(isPrivate ? [{ i: "msg", l: "SMS" }, { i: "phone", l: "Voice" }] : [{ i: "inbox", l: "Receive SMS" }]).map((c) => (
                <span key={c.l} style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 22, padding: "0 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <span style={{ display: "flex" }}><Icon name={c.i} size={11} strokeWidth={2} /></span>{c.l}
                </span>
              ))}
            </span>
          )],
          ["Plan", plan ? plan.label : "—"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text-muted)" }}>{k}</span>
            <span className="tnum" style={{ fontWeight: 500, whiteSpace: "nowrap" }}>{v}</span>
          </div>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
          <span className="mono tnum" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>${total.toFixed(2)}</span>
        </div>

        {/* policy notices — set expectations before purchase to avoid disputes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "12px 13px", borderRadius: 11, background: "var(--surface-2)", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
            <span style={{ display: "flex", flexShrink: 0, marginTop: 1, color: "var(--text-faint)" }}><Icon name="info" size={14} /></span>
            <span>Deliverability isn't guaranteed for every platform. Some services may not accept this number — we can't promise codes will arrive everywhere.</span>
          </div>
          {isUS && (
            <div style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
              <span style={{ display: "flex", flexShrink: 0, marginTop: 1, color: "var(--text-faint)" }}><Icon name="inbox" size={14} /></span>
              <span>US numbers include <strong style={{ color: "var(--text)" }} className="tnum">{INBOUND_FREE} free inbound SMS</strong>. After that, inbound messages are billed at <span className="tnum">${INBOUND_RATE.toFixed(2)}</span> each.</span>
            </div>
          )}
        </div>

        {insufficient && (
          <div style={{ marginBottom: 14 }}>
            <BuyNotice tone="danger" icon="wallet" action={<Button size="sm" variant="subtle" onClick={() => setRoute("topup")}>Top up</Button>}>
              Your balance is <span className="tnum">${(total - balance).toFixed(2)}</span> short for this plan.
            </BuyNotice>
          </div>
        )}

        {/* terms agreement gate */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 16, height: 16, marginTop: 1, accentColor: "var(--accent)", flexShrink: 0, cursor: "pointer" }} />
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>I agree to the <a href="terms.html#terms" target="_blank" rel="noopener" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline" }}>Terms &amp; Conditions</a> and <a href="terms.html#usage" target="_blank" rel="noopener" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline" }}>Usage Policy</a>.</span>
        </label>

        <Button full size="lg" icon="cart" disabled={!agreed || processing || !!blocker} onClick={confirmPurchase}>
          {processing ? "Processing…" : blocker && agreed ? blocker : `Pay $${total.toFixed(2)}`}
        </Button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, fontSize: 11.5, color: "var(--text-faint)" }}>
          <Icon name="shield" size={13} /> Pays from your <span className="tnum">{balanceKnown ? `$${balance.toFixed(2)}` : "…"}</span> balance
        </div>
      </Card>

      {/* processing overlay → then redirect to My Numbers. Portaled to <body> so it sits outside .layout and stays sharp while the page blurs behind it. */}
      {processing && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(8,9,12,0.48)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, boxShadow: "var(--shadow-pop)", padding: "40px 50px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, minWidth: 320, animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
            <div className="spinner" style={{ width: 48, height: 48 }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Processing your purchase…</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>Assigning your {isPrivate ? country?.name : svc?.name} number</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 12 }}>This may take a moment…</div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    {/* outside .view-enter: its transform would trap position:fixed */}
    <Toast toast={toast} />
    </>
  );
};

// ============ TOP UP ============
// Presentation for each gateway — fee, limits and availability come from /payment-gateways.
const GATEWAY_LOOK = {
  stripe: {
    icon: "wallet", tagline: "Pay with a bank card — no crypto needed", best: "No crypto",
    desc: "Charge a Visa or Mastercard directly. Funds clear into your wallet as soon as the card is approved. The simplest option if you don't hold any cryptocurrency.",
    brand: { label: "via Stripe", color: "#635BFF" }, tagsTitle: "Accepted cards",
    tags: [{ name: "Visa", color: "#1A1F71" }, { name: "Mastercard", color: "#EB001B" }],
  },
  mixpay: {
    icon: "qr", tagline: "Pay from Binance, Gate, KuCoin, Bybit & more", best: "Binance & wallet users",
    desc: "On the MixPay checkout, choose Crypto to pay any coin, or pay in one tap from a wallet app — Binance Pay, Gate Pay, KuCoin Pay or Bybit Pay. MixPay auto-converts to your balance, so you don't have to match the exact coin.",
    brand: { label: "via mixpay.me", color: "#1652F0" },
    tags: [{ name: "Crypto", color: "#F7931A" }, { name: "Binance Pay", color: "#F0B90B" }, { name: "Gate Pay", color: "#2354E6" }, { name: "KuCoin Pay", color: "#23AF91" }, { name: "Bybit Pay", color: "#16171A" }, { name: "USDT", color: "#26A17B" }, { name: "BTC", color: "#F7931A" }],
  },
  crypto: {
    icon: "coins", tagline: "Send any of 300+ coins from any wallet", best: "Any coin · self-custody",
    desc: "A non-custodial gateway: pick a coin, get a deposit address, and send from any self-custody wallet. Ideal for less common tokens where you want full control over the transfer. Credits once the network confirms.",
    brand: { label: "via nowpayments.io", color: "#266EF8" },
    tags: [{ name: "BTC", color: "#F7931A" }, { name: "ETH", color: "#627EEA" }, { name: "USDT", color: "#26A17B" }, { name: "USDC", color: "#2775CA" }, { name: "LTC", color: "#345D9D" }, { name: "+300 coins", color: "#6B6F76" }],
  },
  binance: {
    icon: "qr", tagline: "Pay straight from your Binance account", best: "Binance users",
    brand: { label: "via Binance Pay", color: "#C99400" }, tags: [{ name: "Binance Pay", color: "#F0B90B" }, { name: "USDT", color: "#26A17B" }],
  },
  payeer: { icon: "wallet", tagline: "Pay from your Payeer wallet", best: "Payeer users", brand: { label: "via payeer.com", color: "#2F9AE0" }, tags: [] },
  perfectmoney: { icon: "wallet", tagline: "Pay from your Perfect Money account", best: "Perfect Money users", brand: { label: "via perfectmoney.com", color: "#E5262B" }, tags: [] },
};

const WalletChip = ({ t }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 25, padding: "0 9px 0 8px", borderRadius: 7, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 11.5, fontWeight: 500, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
    <span style={{ width: 7, height: 7, borderRadius: 99, background: t.color, flexShrink: 0 }} />
    {t.name}
  </span>
);
const MetaStat = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
    <span style={{ display: "flex", color: "var(--text-faint)", flexShrink: 0 }}><Icon name={icon} size={14} strokeWidth={1.8} /></span>
    <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}><span style={{ color: "var(--text-faint)" }}>{label} </span><span style={{ fontWeight: 550, color: "var(--text)" }}>{value}</span></span>
  </div>
);
// Gateway logo from the API, falling back to an icon if the image is missing or fails to load.
const GatewayLogo = ({ gateway, icon, sel, size = 40 }) => {
  const [broken, setBroken] = React.useState(false);
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: sel ? "var(--surface)" : "var(--surface-2)", border: `1px solid ${sel ? "var(--accent-border)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: sel ? "var(--accent)" : "var(--text-muted)", flexShrink: 0, overflow: "hidden" }}>
      {gateway.image && !broken
        ? <img src={gateway.image} alt="" onError={() => setBroken(true)} style={{ width: "72%", height: "72%", objectFit: "contain" }} />
        : <Icon name={icon} size={size * 0.5} />}
    </div>
  );
};

const TopUpScreen = () => {
  const presets = [10, 25, 50, 100];
  const [amountText, setAmountText] = React.useState("25");
  const amount = Math.round((parseFloat(amountText) || 0) * 100) / 100;
  const [methodId, setMethodId] = React.useState(null);
  const [error, setError] = React.useState(null);

  const { data: balanceData } = useBalance();
  const balance = balanceData?.amount || 0;
  const balanceKnown = balanceData !== undefined;

  const gatewaysQ = usePaymentGateways();
  const gateways = React.useMemo(() => gatewaysQ.data || [], [gatewaysQ.data]);
  React.useEffect(() => {
    if (gateways.length && !gateways.some((g) => g.id === methodId)) setMethodId(gateways[0].id);
  }, [gateways, methodId]);
  const method = gateways.find((g) => g.id === methodId) || null;
  const look = (method && GATEWAY_LOOK[method.key]) || { icon: "wallet", brand: { label: "", color: "var(--text-muted)" }, tags: [] };

  const start = useStartTopUp();
  // stays on after success too — the browser is on its way to the gateway
  const redirecting = start.isPending || start.isSuccess;
  React.useEffect(() => {
    document.querySelector(".layout")?.classList.toggle("page-blur", redirecting);
    return () => document.querySelector(".layout")?.classList.remove("page-blur");
  }, [redirecting]);

  const fee = feeFor(method, amount);
  const total = Math.round((amount + fee) * 100) / 100;
  const invalid = amountError(method, amount);
  React.useEffect(() => { setError(null); }, [amountText, methodId]);

  const pay = () => {
    if (invalid || redirecting) return;
    setError(null);
    start.mutate({ gateway: method, amount }, { onError: (err) => setError(err.message || "Could not start the payment") });
  };

  const limitsOf = (g) => [g.min > 0 && `min $${g.min.toFixed(g.min % 1 ? 2 : 0)}`, g.max > 0 && `max $${g.max.toLocaleString("en-US", { maximumFractionDigits: 2 })}`].filter(Boolean).join(" · ");

  return (
    <>
    <div className="view-enter buy-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Choose amount</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {presets.map((p) => (
              <button key={p} onClick={() => setAmountText(String(p))} className="mono tnum" style={{ height: 56, borderRadius: 12, fontSize: 17, fontWeight: 600,
                background: amount === p ? "var(--accent-soft)" : "var(--surface)", color: amount === p ? "var(--accent)" : "var(--text)", border: `1px solid ${amount === p ? "var(--accent-border)" : "var(--border)"}` }}>${p}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 15px", height: 54, borderRadius: 12, border: `1px solid ${invalid && amountText !== "" && method ? "var(--danger)" : "var(--border-strong)"}`, background: "var(--surface)" }}>
            <span className="mono" style={{ fontSize: 20, color: "var(--text-faint)" }}>$</span>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={amountText}
              onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmountText(v); }}
              className="mono tnum" style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 20, fontWeight: 600, width: "100%" }} />
            <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>USD</span>
          </div>
          {method && limitsOf(method) && (
            <div className="tnum" style={{ marginTop: 8, fontSize: 12, color: invalid && amount > 0 ? "var(--danger)" : "var(--text-faint)" }}>
              {invalid && amount > 0 ? invalid : `${method.name}: ${limitsOf(method)}`}
            </div>
          )}
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Payment method</h3>
            {gateways.length > 0 && <span className="tnum" style={{ fontSize: 12, color: "var(--text-faint)" }}>{gateways.length} way{gateways.length === 1 ? "" : "s"} to pay</span>}
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--text-muted)" }}>Pick whichever suits you. You'll finish paying on the provider's page, then come straight back here.</p>

          {gatewaysQ.isLoading ? <BuyNotice tone="accent">Loading payment methods…</BuyNotice>
            : gatewaysQ.error ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => gatewaysQ.refetch()}>Retry</Button>}>{gatewaysQ.error.message}</BuyNotice>
            : gateways.length === 0 ? <BuyNotice>Top-ups are unavailable right now. Please try again later.</BuyNotice>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {gateways.map((g) => {
                  const sel = methodId === g.id;
                  const lk = GATEWAY_LOOK[g.key] || { icon: "wallet", brand: { label: "", color: "var(--text-muted)" }, tags: [] };
                  const desc = lk.desc || g.description;
                  return (
                    <button key={g.id} onClick={() => setMethodId(g.id)} style={{ display: "block", width: "100%", padding: 0, borderRadius: 14, textAlign: "left",
                      background: sel ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${sel ? "var(--accent-border)" : "var(--border)"}`,
                      boxShadow: sel ? "0 1px 2px rgba(16,17,26,0.04)" : "none", transition: "background 0.16s ease, border-color 0.16s ease", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "14px 15px 0" }}>
                        <GatewayLogo gateway={g} icon={lk.icon} sel={sel} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{g.name}</span>
                            {lk.brand.label && <span style={{ fontSize: 10.5, fontWeight: 600, color: lk.brand.color, background: "color-mix(in srgb, var(--surface-2) 60%, transparent)", border: "1px solid var(--border)", padding: "1px 7px", borderRadius: 6 }}>{lk.brand.label}</span>}
                          </div>
                          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{lk.tagline || g.description}</div>
                        </div>
                        <span style={{ width: 19, height: 19, borderRadius: 99, border: `2px solid ${sel ? "var(--accent)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, background: sel ? "var(--accent)" : "transparent" }}>{sel && <Icon name="check" size={12} strokeWidth={3} style={{ color: "#fff" }} />}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", padding: "12px 15px 0 68px" }}>
                        <MetaStat icon="bolt" label="Credit" value={g.instant ? "Automatic" : "Manual review"} />
                        <MetaStat icon="receipt" label="Fee" value={feeLabel(g)} />
                        {limitsOf(g) && <MetaStat icon="info" label="Limits" value={limitsOf(g)} />}
                        {lk.best && <MetaStat icon="check" label="Best for" value={lk.best} />}
                      </div>
                      {sel && desc && (
                        <div style={{ padding: "12px 15px 0 68px", animation: "fadeIn 0.2s ease both" }}>
                          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--text-muted)" }}>{desc}</p>
                        </div>
                      )}
                      <div style={{ padding: lk.tags.length ? "12px 15px 15px 68px" : "0 0 15px" }}>
                        {lk.tags.length > 0 && (
                          <>
                            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 8 }}>{lk.tagsTitle || "Accepted via this gateway"}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{lk.tags.map((t) => <WalletChip key={t.name} t={t} />)}</div>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 14, padding: "11px 13px", borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <span style={{ display: "flex", color: "var(--text-faint)", marginTop: 1, flexShrink: 0 }}><Icon name="shield" size={15} /></span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>Payments are processed by the provider — ZEDSMS never sees your card details or wallet keys. Your balance is credited automatically once the provider confirms the payment.</span>
          </div>
        </Card>
      </div>

      <Card style={{ padding: 18, position: "sticky", top: 82 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Summary</h3>
        {method && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 14 }}>
            <GatewayLogo gateway={method} icon={look.icon} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{method.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{method.instant ? "Credited automatically" : "Credited after manual review"}</div>
            </div>
          </div>
        )}
        {[
          ["Current balance", balanceKnown ? `$${balance.toFixed(2)}` : "…"],
          ["Top up", `$${amount.toFixed(2)}`],
          [method?.feeIsPercent && method.fee > 0 ? `Fee (${method.fee}%)` : "Fee", fee > 0 ? `$${fee.toFixed(2)}` : "Free"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>{k}</span><span className="tnum" style={{ fontWeight: 500 }}>{v}</span></div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>You pay</span><span className="mono tnum" style={{ fontWeight: 600 }}>${total.toFixed(2)}</span></div>
        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>New balance</span>
          <span className="mono tnum" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>{balanceKnown ? `$${(balance + amount).toFixed(2)}` : "…"}</span>
        </div>

        {error && <div style={{ marginBottom: 12 }}><BuyNotice tone="danger">{error}</BuyNotice></div>}

        <Button full size="lg" icon={method?.key === "stripe" ? "wallet" : "qr"} disabled={!!invalid || redirecting} onClick={pay}>
          {redirecting ? "Redirecting…" : invalid && amountText !== "" ? invalid : method?.key === "stripe" ? `Pay $${total.toFixed(2)}` : `Continue to ${method?.name || "payment"}`}
        </Button>
        {look.brand.label && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, fontSize: 11.5, color: "var(--text-faint)" }}>
            <Icon name="shield" size={13} /> Secured by {look.brand.label.replace("via ", "")}
          </div>
        )}
      </Card>
    </div>

    {redirecting && createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(8,9,12,0.48)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, boxShadow: "var(--shadow-pop)", padding: "40px 50px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, minWidth: 320, animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
          <div className="spinner" style={{ width: 48, height: 48 }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Taking you to {method?.name}…</div>
            <div className="tnum" style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>Paying ${total.toFixed(2)} to add ${amount.toFixed(2)} to your balance</div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 12 }}>Don't close this tab.</div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

// ============ TRANSFER ============
// Stable colour per recipient so the same person keeps the same avatar tint.
const AVATAR_COLORS = ["#7C5CE0", "#0E9384", "#D6453A", "#2155f5", "#C98A0E", "#1B8A5A"];
const colorFor = (str) => {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
const initialsOf = (str) => String(str || "?").replace(/^\W+/, "").slice(0, 2).toUpperCase();

// People this user has sent balance to before, read out of their own history rows
// ("Transferred 5$ to someone@example.com" — written by the backend on every transfer).
const recentRecipientsFrom = (transactions = []) => {
  const seen = new Map();
  for (const t of transactions) {
    if (t?.action !== "Balance Transfer") continue;
    if (!(t.amount < 0)) continue;                                           // negative = sent, positive = received
    const to = /\bto\s+(\S+)\s*$/.exec(String(t?.desc || ""))?.[1];
    if (to && !seen.has(to)) seen.set(to, { id: to, color: colorFor(to) });
    if (seen.size >= 4) break;
  }
  return [...seen.values()];
};

// Defined at module level on purpose: a component declared inside a screen is a
// new type on every render, so React remounts its children and inputs lose focus
// after the first keystroke.
const TransferField = ({ label, hint, children }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
      <label style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>{label}</label>
      {hint && <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{hint}</span>}
    </div>
    {children}
  </div>
);
const transferInput = { width: "100%", height: 46, padding: "0 14px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontSize: 14, outline: "none" };

const TransferScreen = () => {
  const presets = [5, 10, 25];
  const [recipient, setRecipient] = React.useState("");
  const [amountText, setAmountText] = React.useState("10");
  const amount = Math.round((parseFloat(amountText) || 0) * 100) / 100;
  const [confirming, setConfirming] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const showToast = (msg, tone = "success") => { clearTimeout(toastTimer.current); setToast({ msg, tone }); toastTimer.current = setTimeout(() => setToast(null), 3600); };

  const { data: user } = useUser();
  const { data: balanceData } = useBalance();
  const balance = balanceData?.amount || 0;
  const balanceKnown = balance > 0 || (balanceData !== undefined);
  const { data: txPage } = useTransactions();
  const recents = React.useMemo(() => recentRecipientsFrom(txPage?.rows || []), [txPage]);

  const transfer = useTransferBalance();
  const to = recipient.trim();
  const isSelf = !!to && [user?.email, String(user?.zedId ?? "")].filter(Boolean).some((v) => String(v).toLowerCase() === to.toLowerCase());
  const overBalance = balanceKnown && amount > balance + 0.0001;
  const error = !to ? null
    : isSelf ? "You can't transfer to yourself"
    : overBalance ? "Amount exceeds your available balance"
    : null;
  const valid = !!to && amount > 0 && !isSelf && !overBalance;

  const send = () => {
    transfer.mutate({ recipient: to, amount }, {
      onSuccess: (res) => {
        setConfirming(false);
        showToast(res?.message || `$${amount.toFixed(2)} sent to ${to}`, "accent");
        setRecipient("");
        setAmountText("10");
      },
      // "User not found", "Insufficient balance", "You cannot transfer to yourself"
      onError: (err) => { setConfirming(false); showToast(err?.message || "Transfer failed", "danger"); },
    });
  };

  const maxAmount = Math.floor(balance * 100) / 100;

  return (
    <>
    <div className="view-enter buy-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="transfer" size={20} /></div>
            <div><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>Send balance</h3><p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>Instant &amp; free between ZEDSMS wallets</p></div>
          </div>

          <TransferField label="Recipient" hint="ZEDSMS ID or email">
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. 16565956596 or name@example.com"
              style={{ ...transferInput, borderColor: isSelf ? "var(--danger)" : "var(--border-strong)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: isSelf ? "var(--danger)" : "var(--text-faint)", marginTop: 7 }}>
              <Icon name="info" size={13} />
              {isSelf ? "You can't transfer to yourself" : "Double-check this — transfers are instant and can't be reversed."}
            </div>
          </TransferField>

          {recents.length > 0 && (
            <TransferField label="Recent recipients">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {recents.map((r) => {
                  const on = to.toLowerCase() === r.id.toLowerCase();
                  return (
                    <button key={r.id} onClick={() => setRecipient(r.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 7px", borderRadius: 99, maxWidth: "100%", background: on ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}` }}>
                      <span style={{ width: 24, height: 24, borderRadius: 99, background: r.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 10.5, flexShrink: 0 }}>{initialsOf(r.id)}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: on ? "var(--accent)" : "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.id}</span>
                    </button>
                  );
                })}
              </div>
            </TransferField>
          )}

          <TransferField label="Amount" hint={balanceKnown ? `Available $${balance.toFixed(2)}` : "Loading balance…"}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
              {presets.map((p) => (
                <button key={p} onClick={() => setAmountText(String(p))} className="mono tnum" style={{ height: 42, borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: amount === p ? "var(--accent-soft)" : "var(--surface)", color: amount === p ? "var(--accent)" : "var(--text)", border: `1px solid ${amount === p ? "var(--accent-border)" : "var(--border)"}` }}>${p}</button>
              ))}
              <button onClick={() => setAmountText(String(maxAmount))} disabled={!balanceKnown || maxAmount <= 0} className="tnum" style={{ height: 42, borderRadius: 10, fontSize: 12.5, fontWeight: 600,
                background: amount === maxAmount && maxAmount > 0 ? "var(--accent-soft)" : "var(--surface)", color: amount === maxAmount && maxAmount > 0 ? "var(--accent)" : "var(--text)", border: `1px solid ${amount === maxAmount && maxAmount > 0 ? "var(--accent-border)" : "var(--border)"}`, opacity: !balanceKnown || maxAmount <= 0 ? 0.5 : 1 }}>MAX</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 54, borderRadius: 12, border: `1px solid ${overBalance ? "var(--danger)" : "var(--border-strong)"}` }}>
              <span className="mono" style={{ fontSize: 19, color: "var(--text-faint)" }}>$</span>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={amountText}
                onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmountText(v); }}
                className="mono tnum" style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 19, fontWeight: 600, width: "100%" }} />
              <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>USD</span>
            </div>
            {overBalance && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--danger)", marginTop: 7 }}><Icon name="info" size={13} /> Amount exceeds your available balance</div>}
          </TransferField>
        </Card>
      </div>

      <Card style={{ padding: 18, position: "sticky", top: 82 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Review transfer</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: to ? colorFor(to) : "var(--surface-3)", color: to ? "#fff" : "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11.5, flexShrink: 0 }}>{to ? initialsOf(to) : <Icon name="transfer" size={15} />}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{to ? "Sending to" : "No recipient yet"}</div>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{to || "Enter an ID or email"}</div>
          </div>
        </div>
        {[["Available balance", balanceKnown ? `$${balance.toFixed(2)}` : "…"], ["Sending", `$${amount.toFixed(2)}`], ["Transfer fee", "Free"]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>{k}</span><span className="tnum" style={{ fontWeight: 500, color: v === "Free" ? "var(--success)" : "var(--text)" }}>{v}</span></div>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Balance after</span>
          <span className="mono tnum" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: overBalance ? "var(--danger)" : "var(--text)" }}>{balanceKnown ? `$${Math.max(0, balance - amount).toFixed(2)}` : "…"}</span>
        </div>
        {error && <div style={{ marginBottom: 12 }}><BuyNotice tone="danger">{error}</BuyNotice></div>}
        <Button full size="lg" icon="send" disabled={!valid || transfer.isPending} onClick={() => setConfirming(true)}>
          {transfer.isPending ? "Sending…" : `Send $${amount.toFixed(2)}`}
        </Button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, fontSize: 11.5, color: "var(--text-faint)" }}>
          <Icon name="bolt" size={13} /> Arrives instantly · no fees
        </div>
      </Card>
    </div>

    {/* second step, as in the legacy dashboard — transfers can't be undone */}
    <Modal open={confirming} onClose={() => !transfer.isPending && setConfirming(false)} title="Confirm transfer" subtitle="This can't be undone">
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", borderRadius: 11, background: "var(--surface-2)", marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 99, background: colorFor(to), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12.5, flexShrink: 0 }}>{initialsOf(to)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Recipient</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{to}</div>
        </div>
        <span className="mono tnum" style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>${amount.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--warning-soft)", marginBottom: 18 }}>
        <span style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} /></span>
        <span style={{ fontSize: 12.5, color: "var(--warning)", lineHeight: 1.5 }}>Balance moves to this wallet immediately. Make sure the ID or email is right — we can't reverse a transfer.</span>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button full variant="subtle" onClick={() => setConfirming(false)} disabled={transfer.isPending}>Cancel</Button>
        <Button full icon="send" onClick={send} disabled={transfer.isPending}>{transfer.isPending ? "Sending…" : `Send $${amount.toFixed(2)}`}</Button>
      </div>
    </Modal>
    <Toast toast={toast} />
    </>
  );
};

// ============ TRANSACTIONS ============
const txDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const txTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

// Pagination is server-side, so the filter tabs narrow the page you're looking at.
const TxTab = ({ id, label, filter, onPick }) => (
  <button onClick={() => onPick(id)} style={{ height: 30, padding: "0 13px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
    background: filter === id ? "var(--surface)" : "transparent", color: filter === id ? "var(--text)" : "var(--text-muted)", boxShadow: filter === id ? "var(--shadow-sm)" : "none", border: filter === id ? "1px solid var(--border)" : "1px solid transparent" }}>{label}</button>
);
const PageBtn = ({ children, onClick, disabled, active }) => (
  <button onClick={onClick} disabled={disabled} style={{ minWidth: 32, height: 32, padding: "0 8px", borderRadius: 8, fontSize: 13, fontWeight: 550,
    background: active ? "var(--accent)" : "var(--surface)", color: active ? "#fff" : "var(--text)", border: `1px solid ${active ? "transparent" : "var(--border)"}`,
    display: "inline-flex", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer", pointerEvents: disabled ? "none" : undefined }}>{children}</button>
);

// A window of page numbers around the current one — the history can run to many pages.
const pageWindow = (current, last, span = 2) => {
  const from = Math.max(1, Math.min(current - span, last - span * 2));
  const to = Math.min(last, Math.max(current + span, span * 2 + 1));
  const out = [];
  for (let p = from; p <= to; p++) out.push(p);
  return out;
};

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const TransactionsScreen = () => {
  const [filter, setFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isFetching, error, refetch } = useTransactions(page);

  const allRows = data?.rows || [];
  const rows = allRows.filter((t) => (filter === "all" ? true : filter === "in" ? t.amount > 0 : t.amount < 0));
  const lastPage = data?.lastPage || 1;
  const total = data?.total ?? 0;
  const curPage = data?.page || page;
  const perPage = data?.perPage || allRows.length || 0;
  const rangeStart = total === 0 ? 0 : (curPage - 1) * perPage + 1;
  const rangeEnd = Math.min(rangeStart + allRows.length - 1, total);
  const setFilterReset = (id) => setFilter(id);

  const exportCsv = () => {
    const header = ["Date", "Time", "Action", "Description", "Reference", "Amount", "Status"];
    const lines = [header.map(csvCell).join(",")].concat(
      rows.map((t) => [txDate(t.date), txTime(t.date), t.action, t.desc, t.trxId || "", t.amount.toFixed(2), (TRANSACTION_STATUS[t.status] || {}).label || t.status].map(csvCell).join(","))
    );
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `zedsms-transactions-page-${curPage}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-enter">
      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", borderRadius: 10 }}>
            <TxTab id="all" label="All" filter={filter} onPick={setFilterReset} />
            <TxTab id="in" label="Incoming" filter={filter} onPick={setFilterReset} />
            <TxTab id="out" label="Outgoing" filter={filter} onPick={setFilterReset} />
          </div>
          <Button variant="ghost" size="sm" icon="receipt" onClick={exportCsv} disabled={rows.length === 0}>Export CSV</Button>
        </div>

        {isLoading ? (
          <div style={{ padding: 18 }}><BuyNotice tone="accent">Loading your transactions…</BuyNotice></div>
        ) : error ? (
          <div style={{ padding: 18 }}><BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => refetch()}>Retry</Button>}>{error.message || "Could not load transactions"}</BuyNotice></div>
        ) : allRows.length === 0 ? (
          <Empty icon="receipt" label="No transactions yet — top-ups, purchases and transfers appear here" />
        ) : rows.length === 0 ? (
          <div style={{ padding: 18 }}><BuyNotice icon="search">No {filter === "in" ? "incoming" : "outgoing"} entries on this page.</BuyNotice></div>
        ) : (
          <div style={{ overflowX: "auto", opacity: isFetching ? 0.6 : 1, transition: "opacity 0.15s" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Action", "Description", "Amount", "Status"].map((h, i) => (
                    <th key={h} style={{ textAlign: i >= 3 ? "right" : "left", padding: "11px 18px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-faint)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const s = TRANSACTION_STATUS[t.status] || { label: "—", tone: "neutral" };
                  const incoming = t.amount > 0;
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="mono tnum" style={{ padding: "14px 18px", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {txDate(t.date)}
                        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{txTime(t.date)}</div>
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: incoming ? "var(--success-soft)" : "var(--surface-2)", color: incoming ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon name={incoming ? "arrowDown" : "arrowUp"} size={14} strokeWidth={2} />
                          </span>
                          <span style={{ whiteSpace: "nowrap" }}>{t.action}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 12.5, color: "var(--text-muted)", maxWidth: 420 }}>
                        <div style={{ lineHeight: 1.5 }}>{t.desc}</div>
                        {t.trxId && <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3 }}>Ref {t.trxId}</div>}
                      </td>
                      <td className="mono tnum" style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, textAlign: "right", color: incoming ? "var(--success)" : "var(--text)", whiteSpace: "nowrap" }}>{incoming ? "+" : "−"}${Math.abs(t.amount).toFixed(2)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}><Badge tone={s.tone}>{s.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {allRows.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
            <span className="tnum" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              Showing <span style={{ fontWeight: 600, color: "var(--text)" }}>{rangeStart}–{rangeEnd}</span> of {total}
              {filter !== "all" && <span style={{ color: "var(--text-faint)" }}> · {rows.length} {filter === "in" ? "incoming" : "outgoing"} on this page</span>}
            </span>
            {lastPage > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PageBtn onClick={() => setPage(curPage - 1)} disabled={curPage <= 1}><Icon name="chevR" size={15} style={{ transform: "rotate(180deg)" }} /></PageBtn>
                {pageWindow(curPage, lastPage).map((p) => (
                  <PageBtn key={p} onClick={() => setPage(p)} active={p === curPage}>{p}</PageBtn>
                ))}
                <PageBtn onClick={() => setPage(curPage + 1)} disabled={curPage >= lastPage}><Icon name="chevR" size={15} /></PageBtn>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// ============ SETTINGS ============
// Module level, not inside SettingsScreen: a component redefined on each render
// remounts its children, so inputs lose focus after one keystroke.
const settingsInput = { width: "100%", height: 44, padding: "0 14px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontSize: 14, outline: "none" };
const Field = ({ label, children }) => (<div style={{ marginBottom: 16 }}><label style={{ fontSize: 12.5, color: "var(--text-muted)", display: "block", marginBottom: 7, fontWeight: 500 }}>{label}</label>{children}</div>);
const PasswordField = ({ value, defaultValue, onChange, placeholder, invalid }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input type={show ? "text" : "password"} value={value} defaultValue={defaultValue} onChange={onChange} placeholder={placeholder}
        style={{ ...settingsInput, paddingRight: 46, borderColor: invalid ? "var(--danger)" : "var(--border-strong)" }} />
      <button type="button" onClick={() => setShow((s) => !s)} title={show ? "Hide password" : "Show password"} tabIndex={-1}
        style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: show ? "var(--accent)" : "var(--text-faint)", transition: "color 0.14s" }}>
        <Icon name={show ? "eyeOff" : "eye"} size={17} />
      </button>
    </div>
  );
};

const SettingRow = ({ title, sub, children }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "15px 0", borderBottom: "1px solid var(--border)" }}>
    <div><div style={{ fontSize: 13.5, fontWeight: 500 }}>{title}</div><div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div></div>
    {children}
  </div>
);

const pwScore = (p) => { if (!p) return 0; let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return Math.min(s, 4); };
const PW_LEVELS = [{ l: "Too short", c: "var(--danger)" }, { l: "Weak", c: "var(--danger)" }, { l: "Fair", c: "var(--warning)" }, { l: "Good", c: "var(--accent)" }, { l: "Strong", c: "var(--success)" }];

const sessionWhen = (iso) => {
  if (!iso) return "never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 60 * 24 * 7) return `${Math.floor(mins / 1440)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const SettingsScreen = ({ theme, toggleTheme, onLogout }) => {
  const [tab, setTab] = React.useState("profile");
  const tabs = [{ id: "profile", label: "Profile" }, { id: "security", label: "Security" }, { id: "appearance", label: "Appearance" }, { id: "notifications", label: "Notifications" }];

  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const showToast = (msg, tone = "success") => { clearTimeout(toastTimer.current); setToast({ msg, tone }); toastTimer.current = setTimeout(() => setToast(null), 4000); };
  // password / 2FA changes invalidate the session on the backend, so sign out afterwards
  const signOutAfter = (msg) => { showToast(msg, "success"); setTimeout(() => onLogout?.(), 1800); };

  const { data: user } = useUser();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const account = profile || user || {};
  const provider = (profile?.providers || [])[0]?.provider || "email";
  // social-only accounts re-authenticate with a provider token, which needs the
  // provider's own sign-in flow — the password path below doesn't apply to them
  const socialOnly = (profile?.providers || []).length > 0;
  const loginMethod = LOGIN_METHODS[provider] || LOGIN_METHODS.email;

  // ---- email change (OTP to the new address) ----
  const [emailFlow, setEmailFlow] = React.useState(null); // "request" | "verify"
  const [newEmail, setNewEmail] = React.useState("");
  const [emailOtp, setEmailOtp] = React.useState("");
  const [emailErr, setEmailErr] = React.useState("");
  const requestEmail = useRequestEmailChange();
  const verifyEmail = useVerifyEmailChange();
  const startEmailChange = () => {
    setEmailErr("");
    requestEmail.mutate(newEmail.trim(), {
      onSuccess: (msg) => { setEmailFlow("verify"); setEmailOtp(""); showToast(msg, "accent"); },
      onError: (e) => setEmailErr(e.message),
    });
  };
  const confirmEmailChange = () => {
    setEmailErr("");
    verifyEmail.mutate(emailOtp, {
      onSuccess: (msg) => { setEmailFlow(null); setNewEmail(""); showToast(msg); },
      onError: (e) => setEmailErr(e.message),
    });
  };

  // ---- password ----
  const [curPwd, setCurPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const changePwd = useChangePassword();
  const submitPassword = () => changePwd.mutate({ currentPassword: curPwd, newPassword: newPwd }, {
    onSuccess: () => { setCurPwd(""); setNewPwd(""); setConfirmPwd(""); signOutAfter("Password updated — signing you out"); },
    onError: (e) => showToast(e.message, "danger"),
  });

  // ---- two-factor ----
  const { has2FA } = useAuthContext();
  const [tfaFlow, setTfaFlow] = React.useState(null); // "enable" | "disable"
  const [tfaStep, setTfaStep] = React.useState(0);
  const [tfaCode, setTfaCode] = React.useState("");
  const [tfaPwd, setTfaPwd] = React.useState("");
  const [tfaErr, setTfaErr] = React.useState("");
  const twofa = use2fa(tfaFlow === "enable");
  const genSecret = useGenerate2faSecret();
  const enable2faM = useEnable2fa();
  const disable2faM = useDisable2fa();
  const regenCodes = useRegenerateRecoveryCodes();
  // shown once, right after enabling or regenerating — never retrievable later
  const [recoveryCodes, setRecoveryCodes] = React.useState(null);
  const [recoveryAfter, setRecoveryAfter] = React.useState(null); // "enable" | "regenerate"
  const [regenOpen, setRegenOpen] = React.useState(false);
  const [regenPwd, setRegenPwd] = React.useState("");
  const [regenErr, setRegenErr] = React.useState("");

  const openEnable = () => {
    setTfaFlow("enable"); setTfaStep(0); setTfaCode(""); setTfaErr("");
    // a fresh secret each time, exactly like the legacy dashboard
    genSecret.mutate(undefined, { onError: (e) => setTfaErr(e.message) });
  };
  const openDisable = () => { setTfaFlow("disable"); setTfaPwd(""); setTfaErr(""); };
  const closeTfa = () => setTfaFlow(null);
  const verifyEnable = () => {
    if (tfaCode.length !== 6) { setTfaErr("Enter the 6-digit code from your app."); return; }
    setTfaErr("");
    enable2faM.mutate(tfaCode, {
      // every session is revoked server-side, so show the codes first and sign
      // out only once the user confirms they've saved them
      onSuccess: (res) => { setTfaFlow(null); setRecoveryCodes(res.recoveryCodes || []); setRecoveryAfter("enable"); },
      onError: (e) => setTfaErr(e.message),
    });
  };
  const confirmDisable = () => {
    if (!tfaPwd) { setTfaErr("Enter your account password to confirm."); return; }
    setTfaErr("");
    disable2faM.mutate(tfaPwd, {
      onSuccess: (msg) => { setTfaFlow(null); signOutAfter(msg || "Two-factor disabled — signing you out"); },
      onError: (e) => setTfaErr(e.message),
    });
  };

  const submitRegen = () => {
    setRegenErr("");
    regenCodes.mutate(regenPwd, {
      onSuccess: (codes) => { setRegenOpen(false); setRegenPwd(""); setRecoveryCodes(codes); setRecoveryAfter("regenerate"); },
      onError: (e) => setRegenErr(e.message),
    });
  };
  const closeRecoveryCodes = () => {
    const after = recoveryAfter;
    setRecoveryCodes(null);
    setRecoveryAfter(null);
    if (after === "enable") signOutAfter("Two-factor enabled — sign in again to continue");
  };
  const copyRecoveryCodes = () => {
    navigator.clipboard?.writeText((recoveryCodes || []).join("\n"));
    showToast("Recovery codes copied");
  };
  const downloadRecoveryCodes = () => {
    const body = `ZEDSMS recovery codes for ${email}\nGenerated ${new Date().toLocaleString()}\n\n${(recoveryCodes || []).join("\n")}\n\nEach code works once. Keep them somewhere safe and private.\n`;
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url; a.download = "zedsms-recovery-codes.txt";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // ---- sessions ----
  const sessions = useSessions(tab === "security");
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();

  // ---- delete account ----
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletePwd, setDeletePwd] = React.useState("");
  const [deleteErr, setDeleteErr] = React.useState("");
  const deleteAcc = useDeleteAccount();
  const confirmDelete = () => {
    setDeleteErr("");
    deleteAcc.mutate(deletePwd, {
      onSuccess: () => { setDeleteOpen(false); showToast("Account deleted"); setTimeout(() => onLogout?.(), 1500); },
      onError: (e) => setDeleteErr(e.message),
    });
  };

  const email = account?.email || "";
  const zedId = account?.zedsms_id || account?.zedId || account?.id || "—";

  return (
    <>
    <div className="view-enter settings-layout" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>
      <div className="settings-tabs" style={{ display: "flex", flexDirection: "column", gap: 3, position: "sticky", top: 82 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", padding: "9px 13px", borderRadius: 10, fontSize: 13.5, fontWeight: tab === t.id ? 550 : 450, textAlign: "left",
            background: tab === t.id ? "var(--accent-soft)" : "transparent", color: tab === t.id ? "var(--accent)" : "var(--text-muted)" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 560 }}>
        {tab === "profile" && (
          <>
          <Card style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 22 }}>
              <div style={{ width: 60, height: 60, borderRadius: 99, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 24 }}>{(email[0] || "?").toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, wordBreak: "break-all" }}>{email || (profileLoading ? "Loading…" : "—")}</div>
                <div className="mono" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 1 }}>ID {zedId}</div>
              </div>
            </div>

            <Field label="Email">
              <div style={{ display: "flex", gap: 10 }}>
                <input value={email} readOnly type="email" style={{ ...settingsInput, color: "var(--text-muted)", cursor: "default" }} />
                <Button variant="subtle" onClick={() => { setEmailFlow("request"); setNewEmail(""); setEmailErr(""); }} style={{ flexShrink: 0, height: 44 }}>Change</Button>
              </div>
              {account?.pending_email && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--warning)", marginTop: 7 }}>
                  <Icon name="info" size={13} /> Pending change to {account.pending_email}
                  <button onClick={() => { setEmailFlow("verify"); setEmailOtp(""); setEmailErr(""); }} style={{ color: "var(--accent)", fontWeight: 600 }}>Enter code</button>
                </div>
              )}
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="ZEDSMS ID"><input value={zedId} readOnly className="mono" style={{ ...settingsInput, color: "var(--text-muted)", cursor: "default" }} /></Field>
              <Field label="Signed in with">
                <div style={{ display: "flex", alignItems: "center", gap: 9, height: 44, padding: "0 14px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: loginMethod.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{loginMethod.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: "var(--success)" }}>Connected</span>
                </div>
              </Field>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 18, padding: "11px 13px", borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span style={{ display: "flex", color: "var(--text-faint)", marginTop: 1, flexShrink: 0 }}><Icon name="info" size={15} /></span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>Your email and ZEDSMS ID identify you. Your ID is permanent and used to receive balance transfers.</span>
            </div>
          </Card>

          <Card style={{ padding: 22, marginTop: 18, borderColor: "color-mix(in srgb, var(--danger) 25%, var(--border))" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h3 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 600, color: "var(--danger)" }}>Delete account</h3>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>Permanently deletes your account, numbers and remaining balance. This can't be undone.</p>
              </div>
              <Button variant="danger" icon="trash" onClick={() => { setDeleteOpen(true); setDeletePwd(""); setDeleteErr(""); }} style={{ flexShrink: 0 }}>Delete</Button>
            </div>
          </Card>
          </>
        )}

        {tab === "security" && (
          <>
          <Card style={{ padding: 22 }}>
            <div style={{ marginBottom: 8 }}>
              <h3 style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 600 }}>Password</h3>
              <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--text-muted)" }}>Use at least 8 characters. You'll be signed out on all devices afterwards.</p>
            </div>
            <Field label="Current password"><PasswordField value={curPwd} onChange={(e) => setCurPwd(e.target.value)} placeholder="Your current password" /></Field>
            <Field label="New password">
              <PasswordField value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="At least 8 characters" />
              {newPwd && (() => {
                const score = pwScore(newPwd); const lvl = PW_LEVELS[score];
                return (
                  <div style={{ marginTop: 9 }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 4, flex: 1, borderRadius: 99, background: i < score ? lvl.c : "var(--surface-3)", transition: "background 0.2s" }} />)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 11.5, color: lvl.c, fontWeight: 500 }}>
                      <span>{lvl.l}</span>
                      <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>· mix upper/lowercase, numbers &amp; symbols</span>
                    </div>
                  </div>
                );
              })()}
            </Field>
            <Field label="Confirm new password">
              <PasswordField value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Re-enter new password" invalid={confirmPwd && confirmPwd !== newPwd} />
              {confirmPwd && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 11.5, fontWeight: 500, color: confirmPwd === newPwd ? "var(--success)" : "var(--danger)" }}>
                  <Icon name={confirmPwd === newPwd ? "check" : "info"} size={13} strokeWidth={2.2} />
                  {confirmPwd === newPwd ? "Passwords match" : "Passwords don't match"}
                </div>
              )}
            </Field>
            <div style={{ marginTop: 6, marginBottom: 22 }}>
              <Button onClick={submitPassword} disabled={!(curPwd && newPwd.length >= 8 && newPwd === confirmPwd) || changePwd.isPending}>
                {changePwd.isPending ? "Updating…" : "Update password"}
              </Button>
            </div>

            <div style={{ height: 1, background: "var(--border)", margin: "0 0 20px" }} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: has2FA ? "var(--success-soft)" : "var(--surface-2)", color: has2FA ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}><Icon name="shield" size={20} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 600 }}>Two-factor authentication</h3>
                  <Badge tone={has2FA ? "success" : "neutral"} dot>{has2FA ? "On" : "Off"}</Badge>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>Add a second step at sign-in using an authenticator app like Google Authenticator, Authy or 1Password. Even if your password leaks, your account stays protected.</p>
              </div>
            </div>
            <div style={{ marginTop: 14, marginLeft: 53, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {has2FA
                ? <>
                    <Button variant="danger" size="md" onClick={openDisable}>Disable</Button>
                    <Button variant="subtle" size="md" onClick={() => { setRegenOpen(true); setRegenPwd(""); setRegenErr(""); }}>Regenerate recovery codes</Button>
                  </>
                : <Button variant="primary" size="md" icon="shield" onClick={openEnable}>Enable two-factor</Button>}
            </div>
            {has2FA && (
              <p style={{ margin: "10px 0 0 53px", fontSize: 11.5, color: "var(--text-faint)", lineHeight: 1.5 }}>
                Recovery codes let you sign in if you lose your phone. Each one works once.
              </p>
            )}
          </Card>

          <Card style={{ padding: 22, marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 6 }}>
              <div>
                <h3 style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 600 }}>Signed-in devices</h3>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>Every device with an active session. Sign out anything you don't recognise.</p>
              </div>
              <Button variant="subtle" size="sm" disabled={revokeOthers.isPending || (sessions.data || []).length < 2}
                onClick={() => revokeOthers.mutate(undefined, { onSuccess: (m) => showToast(m || "Other sessions signed out"), onError: (e) => showToast(e.message, "danger") })}>
                {revokeOthers.isPending ? "Signing out…" : "Sign out others"}
              </Button>
            </div>
            {sessions.isLoading ? <BuyNotice tone="accent">Loading sessions…</BuyNotice>
              : sessions.error ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => sessions.refetch()}>Retry</Button>}>{sessions.error.message}</BuyNotice>
              : (sessions.data || []).length === 0 ? <BuyNotice>No active sessions found.</BuyNotice>
              : (sessions.data || []).map((s) => (
                <SettingRow key={s.id} title={s.name} sub={`Last used ${sessionWhen(s.lastUsed)} · signed in ${sessionWhen(s.createdAt)}`}>
                  <Button variant="subtle" size="sm" disabled={revoke.isPending}
                    onClick={() => revoke.mutate(s.id, { onSuccess: (m) => showToast(m || "Session signed out"), onError: (e) => showToast(e.message, "danger") })}>
                    Sign out
                  </Button>
                </SettingRow>
              ))}
            <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "var(--text-faint)", lineHeight: 1.5 }}>Signing out the session you're using now will end this one too.</p>
          </Card>
          </>
        )}

        {tab === "appearance" && (
          <Card style={{ padding: 22 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Appearance</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
              {[{ id: "light", label: "Light", icon: "sun" }, { id: "dark", label: "Dark", icon: "moon" }].map((m) => {
                const sel = theme === m.id;
                return (
                  <button key={m.id} onClick={() => { if (theme !== m.id) toggleTheme(); }} style={{ padding: 16, borderRadius: 14, textAlign: "left",
                    background: sel ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${sel ? "var(--accent-border)" : "var(--border)"}` }}>
                    <div style={{ height: 64, borderRadius: 10, marginBottom: 12, background: m.id === "light" ? "#FAFAFB" : "#0A0B0E", border: "1px solid var(--border)", display: "flex", padding: 8, gap: 6 }}>
                      <div style={{ width: 18, borderRadius: 4, background: m.id === "light" ? "#FFF" : "#181A21", border: "1px solid var(--border)" }} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ height: 7, width: "60%", borderRadius: 3, background: "var(--accent)" }} />
                        <div style={{ height: 6, width: "85%", borderRadius: 3, background: m.id === "light" ? "#EEE" : "#23262E" }} />
                        <div style={{ height: 6, width: "70%", borderRadius: 3, background: m.id === "light" ? "#EEE" : "#23262E" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name={m.icon} size={16} /><span style={{ fontSize: 13.5, fontWeight: 550 }}>{m.label}</span>{sel && <span style={{ marginLeft: "auto", color: "var(--accent)" }}><Icon name="check" size={16} strokeWidth={2.2} /></span>}</div>
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "4px 2px 0" }}>You can also switch theme any time from the top bar. This is saved on this device only.</p>
          </Card>
        )}

        {tab === "notifications" && <NotificationsSettings />}
      </div>
    </div>

    {/* ===== Change email ===== */}
    <Modal open={emailFlow === "request"} onClose={() => setEmailFlow(null)} width={440} title="Change email" subtitle="We'll send a 6-digit code to the new address">
      <Field label="New email address">
        <input value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailErr(""); }} type="email" autoFocus placeholder="name@example.com"
          style={{ ...settingsInput, borderColor: emailErr ? "var(--danger)" : "var(--border-strong)" }} />
      </Field>
      {emailErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: -8, marginBottom: 10 }}><Icon name="info" size={13} /> {emailErr}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Button variant="subtle" full onClick={() => setEmailFlow(null)}>Cancel</Button>
        <Button full onClick={startEmailChange} disabled={!newEmail.trim() || requestEmail.isPending}>{requestEmail.isPending ? "Sending…" : "Send code"}</Button>
      </div>
    </Modal>

    <Modal open={emailFlow === "verify"} onClose={() => setEmailFlow(null)} width={440} title="Confirm your new email" subtitle="Enter the 6-digit code we emailed you — it expires in 10 minutes">
      <input value={emailOtp} onChange={(e) => { setEmailOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setEmailErr(""); }} inputMode="numeric" placeholder="000000" autoFocus
        className="mono tnum" style={{ ...settingsInput, height: 56, fontSize: 26, fontWeight: 600, textAlign: "center", letterSpacing: "0.4em", borderColor: emailErr ? "var(--danger)" : "var(--border-strong)" }} />
      {emailErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: 9 }}><Icon name="info" size={13} /> {emailErr}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Button variant="subtle" full onClick={() => setEmailFlow("request")}>Back</Button>
        <Button full onClick={confirmEmailChange} disabled={emailOtp.length !== 6 || verifyEmail.isPending}>{verifyEmail.isPending ? "Verifying…" : "Confirm email"}</Button>
      </div>
    </Modal>

    {/* ===== Enable 2FA ===== */}
    <Modal open={tfaFlow === "enable"} onClose={closeTfa} width={460}
      title={tfaStep === 0 ? "Set up authenticator" : "Verify your app"}
      subtitle={tfaStep === 0 ? "Step 1 of 2 · Scan the code" : "Step 2 of 2 · Confirm it works"}>
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {[0, 1].map((s) => <div key={s} style={{ height: 4, flex: 1, borderRadius: 99, background: s <= tfaStep ? "var(--accent)" : "var(--surface-3)", transition: "background 0.2s" }} />)}
      </div>

      {tfaStep === 0 && (
        <div>
          {genSecret.isPending || twofa.isLoading ? (
            <BuyNotice tone="accent">Generating your setup key…</BuyNotice>
          ) : twofa.error || tfaErr ? (
            <BuyNotice tone="danger">{tfaErr || twofa.error?.message}</BuyNotice>
          ) : (
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {/* the backend renders the QR itself and returns inline SVG */}
              <div style={{ width: 156, height: 156, padding: 9, borderRadius: 12, background: "#fff", border: "1px solid var(--border-strong)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                dangerouslySetInnerHTML={{ __html: twofa.data?.qrSvg || "" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>Open your authenticator app and scan this QR code, or enter the key manually.</p>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 6 }}>Setup key</div>
                {twofa.data?.secret ? <CodeChip code={twofa.data.secret} /> : <span style={{ fontSize: 12, color: "var(--text-faint)" }}>—</span>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Button variant="subtle" full onClick={closeTfa}>Cancel</Button>
            <Button full iconRight="arrowR" disabled={!twofa.data?.secret} onClick={() => { setTfaStep(1); setTfaErr(""); }}>Continue</Button>
          </div>
        </div>
      )}

      {tfaStep === 1 && (
        <div>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>Enter the 6-digit code currently shown in your authenticator app. You'll be signed out and asked for it next time you sign in.</p>
          <input value={tfaCode} onChange={(e) => { setTfaCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setTfaErr(""); }} inputMode="numeric" placeholder="000000" autoFocus
            className="mono tnum" style={{ ...settingsInput, height: 56, fontSize: 26, fontWeight: 600, textAlign: "center", letterSpacing: "0.4em", borderColor: tfaErr ? "var(--danger)" : "var(--border-strong)" }} />
          {tfaErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: 9 }}><Icon name="info" size={13} /> {tfaErr}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Button variant="subtle" full onClick={() => { setTfaStep(0); setTfaErr(""); }}>Back</Button>
            <Button full onClick={verifyEnable} disabled={enable2faM.isPending}>{enable2faM.isPending ? "Verifying…" : "Verify & enable"}</Button>
          </div>
        </div>
      )}
    </Modal>

    {/* ===== Disable 2FA ===== */}
    <Modal open={tfaFlow === "disable"} onClose={closeTfa} width={420} title="Disable two-factor?" subtitle="This makes your account less secure">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 16, padding: "11px 13px", borderRadius: 11, background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 22%, transparent)" }}>
        <span style={{ display: "flex", color: "var(--danger)", marginTop: 1, flexShrink: 0 }}><Icon name="shield" size={15} /></span>
        <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>You'll only need your password to sign in — no second step. You can re-enable two-factor at any time.</span>
      </div>
      <Field label="Confirm your password to continue">
        <PasswordField value={tfaPwd} onChange={(e) => { setTfaPwd(e.target.value); setTfaErr(""); }} placeholder="Your account password" invalid={!!tfaErr} />
      </Field>
      {tfaErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: -8, marginBottom: 8 }}><Icon name="info" size={13} /> {tfaErr}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Button variant="subtle" full onClick={closeTfa}>Keep enabled</Button>
        <Button variant="danger" full onClick={confirmDisable} disabled={disable2faM.isPending}>{disable2faM.isPending ? "Disabling…" : "Disable 2FA"}</Button>
      </div>
    </Modal>

    {/* ===== Recovery codes — shown once ===== */}
    <Modal open={!!recoveryCodes} onClose={closeRecoveryCodes} width={460}
      title="Save your recovery codes"
      subtitle="This is the only time they're shown">
      <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--warning-soft)", marginBottom: 14 }}>
        <span style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} /></span>
        <span style={{ fontSize: 12.5, color: "var(--warning)", lineHeight: 1.5 }}>
          Store these somewhere safe. If you lose your phone, each code signs you in once — without them you'd need support to get back in.
        </span>
      </div>
      <div className="mono tnum" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "14px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 14 }}>
        {(recoveryCodes || []).map((c) => (
          <span key={c} style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", textAlign: "center" }}>{c}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Button full variant="subtle" icon="copy" onClick={copyRecoveryCodes}>Copy</Button>
        <Button full variant="subtle" icon="receipt" onClick={downloadRecoveryCodes}>Download</Button>
      </div>
      <Button full onClick={closeRecoveryCodes}>
        {recoveryAfter === "enable" ? "I've saved them — sign me out" : "I've saved them"}
      </Button>
    </Modal>

    {/* ===== Regenerate recovery codes ===== */}
    <Modal open={regenOpen} onClose={() => setRegenOpen(false)} width={420}
      title="Regenerate recovery codes" subtitle="Your current codes stop working immediately">
      <Field label="Confirm your password to continue">
        <PasswordField value={regenPwd} onChange={(e) => { setRegenPwd(e.target.value); setRegenErr(""); }} placeholder="Your account password" invalid={!!regenErr} />
      </Field>
      {regenErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: -8, marginBottom: 8 }}><Icon name="info" size={13} /> {regenErr}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Button variant="subtle" full onClick={() => setRegenOpen(false)}>Cancel</Button>
        <Button full onClick={submitRegen} disabled={!regenPwd || regenCodes.isPending}>{regenCodes.isPending ? "Generating…" : "Generate new codes"}</Button>
      </div>
    </Modal>

    {/* ===== Delete account ===== */}
    <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} width={430} title="Delete your account?" subtitle="This can't be undone">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 16, padding: "11px 13px", borderRadius: 11, background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 22%, transparent)" }}>
        <span style={{ display: "flex", color: "var(--danger)", marginTop: 1, flexShrink: 0 }}><Icon name="trash" size={15} /></span>
        <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>Your numbers stop receiving messages immediately and any remaining balance is lost. This cannot be reversed.</span>
      </div>
      {socialOnly ? (
        <>
          <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55 }}>
            You signed up with {loginMethod.label}, so deleting your account needs a fresh sign-in with that provider. Email <a href="mailto:support@zedsms.com" style={{ color: "var(--accent)", fontWeight: 600 }}>support@zedsms.com</a> from {email} and we'll remove it for you.
          </p>
          <Button full variant="subtle" onClick={() => setDeleteOpen(false)}>Close</Button>
        </>
      ) : (
        <>
          <Field label="Confirm your password to continue">
            <PasswordField value={deletePwd} onChange={(e) => { setDeletePwd(e.target.value); setDeleteErr(""); }} placeholder="Your account password" invalid={!!deleteErr} />
          </Field>
          {deleteErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: -8, marginBottom: 8 }}><Icon name="info" size={13} /> {deleteErr}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button variant="subtle" full onClick={() => setDeleteOpen(false)}>Keep my account</Button>
            <Button variant="danger" full onClick={confirmDelete} disabled={!deletePwd || deleteAcc.isPending}>{deleteAcc.isPending ? "Deleting…" : "Delete account"}</Button>
          </div>
        </>
      )}
    </Modal>

    <Toast toast={toast} />
    </>
  );
};

export { BuyScreen, TopUpScreen, TransferScreen, TransactionsScreen, SettingsScreen };
