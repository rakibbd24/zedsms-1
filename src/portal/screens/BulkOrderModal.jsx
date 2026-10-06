import React from "react";
import { Icon } from "../components/Icon";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { usePurchaseBulkNumbers } from "../hooks/useBuy";
import { BuyNotice, SelDot } from "./BuyParts";
import { BtnSpinner } from "./SettingsScreen";

// ---- bulk order ----
// Private numbers only (Telnyx / Pivotel / CloudNumbering). The whole order is
// charged when it's placed; the backend then buys the numbers in the background,
// so they show up in the numbers list over the next minute. Any number it can't
// get is refunded automatically.
const BULK_MIN = 2;

const BULK_MAX = 100;

const BULK_PRESETS = [10, 25, 50, 100];

const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ??
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (c ^ (Math.random() * 16) >> (c / 4)).toString(16));

const BulkSummaryRow = ({ label, children }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
    <span style={{ color: "var(--text-muted)" }}>{label}</span>
    <span style={{ fontWeight: 500, textAlign: "right" }}>{children}</span>
  </div>
);

const bulkLabel = { fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500, marginBottom: 8 };

const bulkStepBtn = { width: 40, height: "100%", flexShrink: 0, fontSize: 18, fontWeight: 500, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" };

export const BulkOrderModal = ({ onClose, country, plans, initialPlan, balance, balanceKnown, onSent }) => {
  const [qty, setQty] = React.useState("10");
  const [planId, setPlanId] = React.useState(initialPlan?.id ?? plans[0]?.id ?? null);
  const bulk = usePurchaseBulkNumbers();
  // One id per order attempt: if the same order is sent twice (double click,
  // network retry) the backend charges it only once.
  const requestId = React.useRef(newRequestId());

  const plan = plans.find((p) => p.id === planId) || null;
  const n = Number(qty);
  const qtyValid = Number.isInteger(n) && n >= BULK_MIN && n <= BULK_MAX;
  const total = plan && qtyValid ? Math.round(plan.price * n * 100) / 100 : null;
  const after = balanceKnown && total != null ? Math.round((balance - total) * 100) / 100 : null;
  const blocker = !country ? "Choose a country first"
    : !plan ? "Choose a plan"
    : !qtyValid ? `Enter a quantity between ${BULK_MIN} and ${BULK_MAX}`
    : balanceKnown && total > balance + 0.0001 ? "Insufficient balance"
    : null;
  const step = (d) => setQty(String(Math.min(BULK_MAX, Math.max(BULK_MIN, (qtyValid ? n : BULK_MIN) + d))));

  const submit = () => {
    if (blocker || bulk.isPending) return;
    bulk.mutate({ rent_time_id: plan.id, quantity: n, request_id: requestId.current }, { onSuccess: (data) => onSent(data) });
  };

  return (
    <Modal open onClose={onClose} title="Bulk order" width={480}
      subtitle={`Private numbers${country ? ` in ${country.name}` : ""} · one plan, one order`}>
      {/* plan */}
      <div style={bulkLabel}>Plan</div>
      <div className="bulk-plans" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 18 }}>
        {plans.map((p) => {
          const sel = p.id === planId;
          return (
            <button key={p.id} type="button" onClick={() => setPlanId(p.id)} style={{ padding: "11px 12px", borderRadius: 11, ...pickCard(sel) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 17 }}>
                <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{p.label}</span>
                {p.off > 0 && <span className="tnum" style={{ fontSize: 10, fontWeight: 700, color: "var(--success)", background: "var(--success-soft)", padding: "1px 6px", borderRadius: 99 }}>{p.off}% off</span>}
                {sel && <span style={{ marginLeft: "auto" }}><SelDot size={16} /></span>}
              </div>
              <div className="tnum" style={{ fontSize: 12.5, marginTop: 3, color: "var(--text-faint)" }}>
                <span className="mono" style={{ fontWeight: 600, color: sel ? "var(--accent)" : "var(--text-muted)" }}>${(p.price || 0).toFixed(2)}</span> / number
              </div>
            </button>
          );
        })}
      </div>

      {/* quantity: stepper + quick picks */}
      <div style={bulkLabel}>How many numbers?</div>
      <div className="bulk-qty" style={{ display: "flex", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", flex: "0 0 152px", height: 44, borderRadius: 11, overflow: "hidden", background: "var(--surface)", border: `1px solid ${!qtyValid && qty !== "" ? "var(--danger)" : "var(--border-strong)"}` }}>
          <button type="button" onClick={() => step(-1)} disabled={qtyValid && n <= BULK_MIN} aria-label="Fewer numbers" style={{ ...bulkStepBtn, opacity: qtyValid && n <= BULK_MIN ? 0.35 : 1 }}>−</button>
          <input type="number" inputMode="numeric" min={BULK_MIN} max={BULK_MAX} step={1} aria-label="Number of numbers"
            // on touch screens autofocus pops the keyboard over the sheet before the plan is seen
            autoFocus={!window.matchMedia?.("(pointer: coarse)").matches}
            value={qty} onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            className="mono tnum" style={{ flex: 1, minWidth: 0, height: "100%", border: "none", background: "transparent", outline: "none", textAlign: "center", fontSize: 15, fontWeight: 600, color: "var(--text)" }} />
          <button type="button" onClick={() => step(1)} disabled={qtyValid && n >= BULK_MAX} aria-label="More numbers" style={{ ...bulkStepBtn, opacity: qtyValid && n >= BULK_MAX ? 0.35 : 1 }}>+</button>
        </div>
        <div className="bulk-presets" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, padding: 3, borderRadius: 11, background: "var(--surface-2)" }}>
          {BULK_PRESETS.map((p) => {
            const on = n === p;
            return (
              <button key={p} type="button" onClick={() => setQty(String(p))} className="tnum"
                style={{ borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: on ? "var(--surface)" : "transparent", color: on ? "var(--text)" : "var(--text-muted)", boxShadow: on ? "var(--shadow-sm)" : "none", border: `1px solid ${on ? "var(--border)" : "transparent"}` }}>
                {p}
              </button>
            );
          })}
        </div>
      </div>
      <div className="tnum" style={{ fontSize: 11.5, marginTop: 7, marginBottom: 18, color: !qtyValid && qty !== "" ? "var(--danger)" : "var(--text-faint)" }}>
        {BULK_MIN}–{BULK_MAX} numbers per order
      </div>

      {/* summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "13px 14px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 14 }}>
        <BulkSummaryRow label={plan && qtyValid ? `${n} × $${plan.price.toFixed(2)}` : "Numbers"}>
          <span className="tnum">{total != null ? `$${total.toFixed(2)}` : "—"}</span>
        </BulkSummaryRow>
        {balanceKnown && (
          <BulkSummaryRow label="Balance after">
            <span className="tnum" style={{ color: after != null && after < 0 ? "var(--danger)" : undefined }}>
              {after == null ? "—" : after < 0 ? `$${Math.abs(after).toFixed(2)} short` : `$${after.toFixed(2)}`}
            </span>
          </BulkSummaryRow>
        )}
        <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
          <span className="mono tnum" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{total != null ? `$${total.toFixed(2)}` : "—"}</span>
        </div>
      </div>

      {bulk.error && <div style={{ marginBottom: 12 }}><BuyNotice tone="danger">{bulk.error.message}</BuyNotice></div>}

      <Button full size="lg" icon={bulk.isPending ? undefined : "layers"} onClick={submit} disabled={!!blocker || bulk.isPending}>
        {bulk.isPending ? <><BtnSpinner /> Placing order…</> : blocker || `Buy ${n} numbers · $${total.toFixed(2)}`}
      </Button>
      <p style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 6, margin: "11px 0 0", fontSize: 11.5, lineHeight: 1.5, color: "var(--text-faint)", textAlign: "center" }}>
        <span style={{ display: "flex", flexShrink: 0, marginTop: 2 }}><Icon name="info" size={12} /></span>
        <span>You're charged now. Numbers appear in your list over the next minute — any we can't get are refunded.</span>
      </p>
    </Modal>
  );
};
