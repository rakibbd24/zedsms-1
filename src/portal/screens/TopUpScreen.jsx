import React from "react";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useBalance } from "../hooks/useBalance";
import { createPortal } from "react-dom";
import { usePaymentGateways, useStartTopUp } from "../hooks/useTopUp";
import { amountError, feeFor, feeLabel } from "../api/topup";
import { BuyNotice, MobilePayBar } from "./BuyParts";

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

export const TopUpScreen = () => {
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

  // phones: the summary sits below the gateway list — see MobilePayBar
  const summaryRef = React.useRef(null);

  const limitsOf = (g) => [g.min > 0 && `min $${g.min.toFixed(g.min % 1 ? 2 : 0)}`, g.max > 0 && `max $${g.max.toLocaleString("en-US", { maximumFractionDigits: 2 })}`].filter(Boolean).join(" · ");

  return (
    <>
    <div className="view-enter buy-layout topup-page" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Choose amount</h3>
          <div className="topup-presets" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
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
                      <div className="gw-indent gw-meta" style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", padding: "12px 15px 0 68px" }}>
                        <MetaStat icon="bolt" label="Credit" value={g.instant ? "Automatic" : "Manual review"} />
                        <MetaStat icon="receipt" label="Fee" value={feeLabel(g)} />
                        {limitsOf(g) && <MetaStat icon="info" label="Limits" value={limitsOf(g)} />}
                        {lk.best && <MetaStat icon="check" label="Best for" value={lk.best} />}
                      </div>
                      {sel && desc && (
                        <div className="gw-indent" style={{ padding: "12px 15px 0 68px", animation: "fadeIn 0.2s ease both" }}>
                          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--text-muted)" }}>{desc}</p>
                        </div>
                      )}
                      <div className={lk.tags.length ? "gw-indent" : undefined} style={{ padding: lk.tags.length ? "12px 15px 15px 68px" : "0 0 15px" }}>
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

      <Card ref={summaryRef} className="buy-summary" style={{ padding: 18, position: "sticky", top: 82 }}>
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
        <div className="buy-processing-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, boxShadow: "var(--shadow-pop)", padding: "40px 50px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, minWidth: 320, animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
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
    <MobilePayBar summaryRef={summaryRef} hidden={redirecting} amount={total}
      caption={`You pay${method ? ` · ${method.name}` : ""}`}
      action={invalid && amountText !== "" ? invalid : "Review & pay"} disabled={!!invalid} />
    </>
  );
};
