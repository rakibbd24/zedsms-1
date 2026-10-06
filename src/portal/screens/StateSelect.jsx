import React from "react";
import { Icon } from "../components/Icon";

// US states with a representative area code — private US numbers are picked by state.
export const US_STATES = [
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
export const StateSelect = ({ value, onChange }) => {
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
