import React from "react";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Toast } from "../components/ui/Toast";
import { useUser } from "../hooks/useUser";
import { useBalance } from "../hooks/useBalance";
import { useTransactions, useTransferBalance } from "../hooks/useTransactions";
import { BuyNotice, MobilePayBar } from "./BuyParts";

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

export const TransferScreen = () => {
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
  // phones: the review card drops below the form — see MobilePayBar
  const summaryRef = React.useRef(null);

  return (
    <>
    <div className="view-enter buy-layout transfer-page" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="transfer" size={20} /></div>
            <div><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>Send balance</h3><p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>Instant &amp; free between ZEDSMS wallets</p></div>
          </div>

          <TransferField label="Recipient" hint="ZEDSMS ID or email">
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. 16565956596 or name@example.com"
              className="transfer-recipient" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email"
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

      <Card ref={summaryRef} className="buy-summary" style={{ padding: 18, position: "sticky", top: 82 }}>
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
        <Button full size="lg" icon={transfer.isPending ? undefined : "send"} disabled={!valid || transfer.isPending} onClick={() => setConfirming(true)}>
          {transfer.isPending ? (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Sending…
            </span>
          ) : (
            `Send $${amount.toFixed(2)}`
          )}
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
        <Button full icon={transfer.isPending ? undefined : "send"} onClick={send} disabled={transfer.isPending}>
          {transfer.isPending ? (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Sending…
            </span>
          ) : (
            `Send $${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </Modal>
    <MobilePayBar summaryRef={summaryRef} hidden={confirming || transfer.isPending} amount={amount}
      caption={to ? `To ${to}` : "Sending"}
      action={error || (!to ? "Enter a recipient" : "Review & send")} disabled={!valid} />
    <Toast toast={toast} />
    </>
  );
};
