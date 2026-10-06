import React from "react";
import { Icon } from "../components/Icon";
import { Button } from "../components/ui/Button";
import { ServiceAvatar } from "../components/ui/Avatars";

export const INBOUND_FREE = 50;        // free inbound SMS for US numbers

export const INBOUND_RATE = 0.03;      // per inbound SMS after the free quota (US only)

// Inline loading / empty / error line used inside the buy-flow cards.
export const BuyNotice = ({ tone = "neutral", icon = "info", children, action }) => {
  const c = { neutral: ["var(--surface-2)", "var(--text-muted)"], accent: ["var(--accent-soft)", "var(--accent)"], danger: ["var(--danger-soft)", "var(--danger)"], warning: ["var(--warning-soft)", "var(--warning)"] }[tone];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11, background: c[0] }}>
      <span style={{ color: c[1], flexShrink: 0, display: "flex" }}>{tone === "accent" && icon === "info" ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <Icon name={icon} size={16} />}</span>
      <span style={{ flex: 1, fontSize: 12.5, color: c[1], lineHeight: 1.5 }}>{children}</span>
      {action}
    </div>
  );
};

export const SearchBox = ({ value, onChange, placeholder = "Search", width = 110 }) => (
  <div className="buy-search" style={{ display: "flex", alignItems: "center", gap: 7, height: 32, padding: "0 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-faint)" }}>
    <Icon name="search" size={14} />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 12.5, width }} />
  </div>
);

export const BUY_TYPES = [
  { k: "Private", d: "A full private number. Works with any service — priced by country.", caps: [{ icon: "msg", label: "SMS" }, { icon: "phone", label: "Voice" }] },
  { k: "Shared", d: "A number for one specific service. Cheaper, from a shared pool.", caps: [{ icon: "inbox", label: "Receive SMS" }] },
];

export const StepTitle = ({ n, children, sub, right }) => (
  <div className="step-title" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
    <div>
      <h3 style={{ margin: sub ? "0 0 4px" : 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}><span style={{ color: "var(--accent)" }}>{n}.</span>&nbsp; {children}</h3>
      {sub && <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)" }}>{sub}</p>}
    </div>
    {right && <div className="step-title-right">{right}</div>}
  </div>
);

export const pickCard = (sel) => ({ background: sel ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${sel ? "var(--accent-border)" : "var(--border)"}`, transition: "all 0.14s", textAlign: "left" });

export const SelDot = ({ size = 19 }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="check" size={size - 7} strokeWidth={3} style={{ color: "#fff" }} /></span>
);

export const NumberGrid = ({ items, pickedKey, onPick }) => {
  // a preselected (e.g. random) number can sit below the fold of this scroll box;
  // scroll the box itself, not the page
  const boxRef = React.useRef(null);
  React.useEffect(() => {
    const box = boxRef.current;
    const el = box?.querySelector('[data-sel="true"]');
    if (!el) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = top - box.clientHeight / 2 + el.offsetHeight / 2;
    }
  }, [pickedKey]);
  return (
  <div ref={boxRef} className="country-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxHeight: 300, overflowY: "auto", paddingRight: 4, marginRight: -4 }}>
    {items.map((n) => {
      const sel = pickedKey === n.key;
      return (
        <button key={n.key} data-sel={sel} onClick={() => onPick(n)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", borderRadius: 12, ...pickCard(sel) }}>
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
};

export const ServiceLogo = ({ service, size = 40 }) => (
  service?.icon
    ? <img src={service.icon} alt="" style={{ width: size, height: size, borderRadius: size * 0.32, objectFit: "cover", flexShrink: 0, background: "var(--surface-2)" }} />
    : <ServiceAvatar color="var(--accent)" letter={(service?.name || "?")[0].toUpperCase()} size={size} />
);

// Phones: a bottom bar carrying the total until the summary card scrolls up into view
// (CSS-hidden above phone width). It stays mounted and slides out with a transform:
// mounting/unmounting it on each visibility change replayed its entrance animation,
// and as the mobile URL bar resized the viewport mid-scroll that read as blinking.
// The summary counts as reached once it clears the bar, or has scrolled past.
export const MobilePayBar = ({ summaryRef, hidden, caption, amount, action, disabled }) => {
  const [reached, setReached] = React.useState(false);
  React.useEffect(() => {
    const el = summaryRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([e]) => setReached(e.isIntersecting || e.boundingClientRect.top < 0),
      { rootMargin: "0px 0px -96px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [summaryRef]);
  const off = hidden || reached;
  return (
    <div className="buy-mobile-bar" data-hidden={off} aria-hidden={off}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{caption}</div>
        <div className="tnum" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>${amount.toFixed(2)}</div>
      </div>
      <Button size="md" iconRight="chevR" disabled={disabled} tabIndex={off ? -1 : undefined}
        onClick={() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
        {action}
      </Button>
    </div>
  );
};
