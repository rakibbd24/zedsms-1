import React from "react";
import { Icon } from "../components/Icon";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { formatExpiryDate, restoreDaysLeftOf, restoreDeadlineOf, termLabelOf } from "./numberHelpers";

const modalInput = { width: "100%", height: 44, padding: "0 14px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontSize: 14, outline: "none" };

export function ExtendModal({ number, open, onClose, onConfirm, plans = [], isLoading = false, isSubmitting = false }) {
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

  // the 1-month plan — "SIX_MONTHLY" also contains "MONTHLY", so match by length, not name
  const monthlyPlan = plans.find(p => getMonthsForTerm(p.terms) === 1);
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
export function RestoreModal({ number, open, onClose, onConfirm, price, isLoading = false, error = null, balance = 0, isSubmitting = false }) {
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

export function TransferModal({ number, open, onClose, onConfirm, isSubmitting = false }) {
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

export function RenameModal({ number, open, onClose, onConfirm, isSubmitting = false }) {
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

export function ReleaseModal({ number, open, onClose, onConfirm, isSubmitting = false }) {
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

export function ComposeModal({ number, open, onClose, onSend, isSubmitting = false }) {
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
