import { api } from "./client";

// Balance top-up — same gateways, endpoints and return handling as the legacy
// dashboard (TopupBalance.vue + PaymentSuccessful.vue / PaymentFailed.vue).
//
//   GET  /payment-gateways                     → active gateways, fee, limits
//   POST /user/payment/{gateway}/create        → { invoice_id, url }
//   …user pays on the gateway, which sends them back to /{gateway}/success|cancel…
//   success/cancel acknowledgement endpoints   → marks the order seen / cancelled
//   POST /user/check-payment-status { trx_id } → Pending | Confirmed | Declined | Cancelled
//
// The balance itself is credited by the gateway's webhook/IPN, never by the
// return page — so after returning we poll the order status until it settles.

const ASSET_BASE = "https://control.zedsms.com/";
const PENDING_KEY = "zedsms-pending-topup";

const assetUrl = (path) => (!path ? null : /^https?:\/\//i.test(path) ? path : ASSET_BASE + String(path).replace(/^\//, ""));
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

// Gateways are matched by the backend's `name` column (that's what the controllers look up).
const GATEWAYS = {
  stripe:       { name: "Stripe",        create: "/user/payment/stripe/create" },
  crypto:       { name: "Crypto",        create: "/user/payment/crypto/create" },
  mixpay:       { name: "MixPay",        create: "/user/payment/mixpay/create" },
};
// Binance Pay, Payeer and Perfect Money were retired (their return pages no longer exist),
// so they're left out here — a gateway missing from this map is never offered.
const keyOfName = (name) => Object.keys(GATEWAYS).find((k) => GATEWAYS[k].name.toLowerCase() === String(name || "").toLowerCase()) || null;

export async function getPaymentGateways() {
  const res = await api.get("/payment-gateways");
  if (res?.status !== "success") throw new Error("Could not load payment methods");
  return (res.data || [])
    .map((g) => ({
      id: g.id,
      key: keyOfName(g.name),
      name: g.name,
      description: g.description || "",
      image: assetUrl(g.image),
      fee: num(g.fee),
      feeIsPercent: Number(g.fee_type) === 1,   // 1 = percentage, otherwise a flat USD fee
      instant: Number(g.payment_type) === 1,    // 1 = automatic, otherwise manually reviewed
      min: num(g.min_limit),
      max: num(g.max_limit),
    }))
    // a gateway this client doesn't know how to start can't be offered
    .filter((g) => g.key);
}

// Mirrors the controllers' calculateOrderTotal(): percentage of the amount, or a flat fee.
export const feeFor = (gateway, amount) => {
  if (!gateway || !(amount > 0)) return 0;
  const fee = gateway.feeIsPercent ? (gateway.fee / 100) * amount : gateway.fee;
  return Math.round(fee * 100) / 100;
};

export const feeLabel = (gateway) => {
  if (!gateway || gateway.fee <= 0) return "No fee";
  return gateway.feeIsPercent ? `${gateway.fee}% fee` : `$${gateway.fee.toFixed(2)} fee`;
};

// The backend doesn't enforce min/max itself, so this is the only check.
export const amountError = (gateway, amount) => {
  if (!(amount > 0)) return "Enter an amount";
  if (!gateway) return "Choose a payment method";
  if (gateway.min > 0 && amount < gateway.min) return `Minimum for ${gateway.name} is $${gateway.min.toFixed(2)}`;
  if (gateway.max > 0 && amount > gateway.max) return `Maximum for ${gateway.name} is $${gateway.max.toFixed(2)}`;
  return null;
};

// ---- pending top-up, kept across the round-trip to the gateway ----
// Stripe doesn't echo the transaction id back in the return URL.
const savePendingTopUp = (entry) => {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify({ ...entry, at: Date.now() })); } catch { /* storage unavailable */ }
};
export const readPendingTopUp = () => {
  try {
    const v = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
    // a top-up older than a day is stale — don't attach it to a new return
    return v && Date.now() - (v.at || 0) < 24 * 60 * 60 * 1000 ? v : null;
  } catch { return null; }
};
export const clearPendingTopUp = () => { try { localStorage.removeItem(PENDING_KEY); } catch { /* storage unavailable */ } };

// Creates the order and sends the browser to the gateway. Resolves only if it
// couldn't leave (the page is navigating away on success).
export async function startTopUp(gateway, amount) {
  const g = GATEWAYS[gateway?.key];
  if (!g) throw new Error("This payment method isn't supported");
  let res;
  try {
    res = await api.post(g.create, { amount: Math.round(amount * 100) / 100 });
  } catch (err) {
    throw new Error(err?.body?.message || err?.body?.data || err?.message || "Could not start the payment");
  }

  if (res?.status !== "success" || !res.url) throw new Error(res?.message || "Could not start the payment");
  savePendingTopUp({ gateway: gateway.key, trxId: res.invoice_id || res.transaction_id, amount });
  window.location.assign(res.url);
}

// ---- return from the gateway ----

// Tell the backend the user came back (success) or gave up (cancel → order marked cancelled).
// Returns the backend's message; a failure here isn't fatal — the webhook still settles the order.
export async function acknowledgeReturn(gatewayKey, outcome, trxId) {
  const ok = outcome === "success";
  const q = `trx_id=${encodeURIComponent(trxId)}`;
  let res;
  switch (gatewayKey) {
    case "stripe":
      res = await api.get(`/payment/stripe/${ok ? "success" : "cancel"}/${encodeURIComponent(trxId)}`);
      break;
    case "crypto":
    case "mixpay": // MixPay returns through the NOWPayments/crypto success & cancel URLs
      res = await api.get(`/payment/crypto/${ok ? "success" : "cancel"}?${q}`);
      break;
    default:
      return null;
  }
  return typeof res?.message === "string" ? res.message : null;
}

// "Pending" | "Confirmed" | "Declined" | "Cancelled" | "Unknown"
export async function checkPaymentStatus(trxId) {
  const res = await api.post("/user/check-payment-status", { trx_id: trxId });
  return res?.status || "Unknown";
}
