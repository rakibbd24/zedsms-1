import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { acknowledgeReturn, checkPaymentStatus, clearPendingTopUp, readPendingTopUp } from "../api/topup";

// Landing page for gateway redirects: /{gateway}/success and /{gateway}/cancel
// (the URLs the payment providers are configured to send users back to).
//
// 1. find the transaction id (query string, path, or the top-up saved before leaving)
// 2. acknowledge the return with the gateway's success/cancel endpoint
// 3. on success, poll check-payment-status until the webhook has credited the order

const POLL_EVERY_MS = 4000;
const POLL_FOR_MS = 90000;

// URL segment → gateway key used by api/topup
const GATEWAY_OF_SEGMENT = {
  stripe: "stripe", crypto: "crypto", mixpay: "mixpay", binance: "binance",
  payeer: "payeer", perfectmoney: "perfectmoney", "perfect-money": "perfectmoney",
};
const GATEWAY_LABEL = { stripe: "Stripe", crypto: "Crypto", mixpay: "MixPay", binance: "Binance Pay", payeer: "Payeer", perfectmoney: "Perfect Money" };

const TONE = {
  working: { bg: "linear-gradient(135deg, #2155f5 0%, #5B54E8 100%)", glyph: null },
  success: { bg: "linear-gradient(135deg, #1B8A5A 0%, #2FB37A 100%)", glyph: "✓" },
  pending: { bg: "linear-gradient(135deg, #C98A0E 0%, #E8B23A 100%)", glyph: "⏳" },
  failed:  { bg: "linear-gradient(135deg, #D6453A 0%, #EE6B5F 100%)", glyph: "✕" },
};

export default function PaymentReturn() {
  const { pathname, search } = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [, segment, outcomeSegment] = pathname.split("/");
  const outcome = outcomeSegment === "cancel" ? "cancel" : "success";
  const pending = React.useMemo(() => readPendingTopUp(), []);
  // Crypto and MixPay share the NOWPayments return URLs — prefer what we actually started.
  const pathGateway = GATEWAY_OF_SEGMENT[segment] || null;
  const gateway = pending && pathGateway === "crypto" && pending.gateway === "mixpay" ? "mixpay" : pathGateway;

  const trxId = React.useMemo(() => {
    const q = new URLSearchParams(search);
    const fromUrl = q.get("trx_id") || q.get("transaction_id") || q.get("transection_id") || params.trxId;
    if (fromUrl) return fromUrl;
    // same-gateway top-up saved before we left for the provider
    if (pending && (pending.gateway === gateway || (pathGateway === "crypto" && pending.gateway === "mixpay"))) return pending.trxId;
    return null;
  }, [search, params.trxId, pending, gateway, pathGateway]);

  const amount = pending && pending.trxId === trxId ? pending.amount : null;
  const [state, setState] = React.useState({ phase: "working", message: null });

  React.useEffect(() => {
    if (!gateway || !trxId) {
      setState({ phase: "failed", message: "We couldn't match this return to a payment. If you were charged, your balance will update automatically — check Transactions in a few minutes." });
      return;
    }
    let stopped = false;
    let timer = null;

    const settle = (phase, message) => {
      if (stopped) return;
      if (phase !== "pending") clearPendingTopUp();
      if (phase === "success") {
        qc.invalidateQueries({ queryKey: ["balance"] });
        qc.invalidateQueries({ queryKey: ["me"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["recent-activity"] });
      }
      setState({ phase, message });
    };

    (async () => {
      let ackMessage = null;
      try {
        ackMessage = await acknowledgeReturn(gateway, outcome, trxId);
      } catch (err) {
        // "Payment already processed" / "Invalid transaction" — the order status below is authoritative
        ackMessage = err?.body?.message || null;
      }

      if (outcome === "cancel") {
        settle("failed", "Payment cancelled. You weren't charged, and nothing was added to your balance.");
        return;
      }

      const startedAt = Date.now();
      const poll = async () => {
        if (stopped) return;
        let status = "Unknown";
        try { status = await checkPaymentStatus(trxId); } catch { /* keep polling */ }
        if (status === "Confirmed") return settle("success", null);
        if (status === "Declined") return settle("failed", "The payment was declined by the provider. Nothing was added to your balance.");
        if (status === "Cancelled") return settle("failed", "This payment was cancelled. Nothing was added to your balance.");
        if (Date.now() - startedAt >= POLL_FOR_MS) {
          return settle("pending", ackMessage || "Your payment was received and is waiting for confirmation from the provider. Your balance updates automatically — you can safely leave this page.");
        }
        if (!stopped) setState({ phase: "working", message: ackMessage });
        timer = setTimeout(poll, POLL_EVERY_MS);
      };
      poll();
    })();

    return () => { stopped = true; clearTimeout(timer); };
  }, [gateway, outcome, trxId, qc]);

  const tone = TONE[state.phase];
  const label = GATEWAY_LABEL[gateway] || "the provider";
  const title = {
    working: "Confirming your payment…",
    success: amount ? `$${Number(amount).toFixed(2)} added to your balance` : "Balance topped up",
    pending: "Payment is processing",
    failed: outcome === "cancel" ? "Payment cancelled" : "Payment not completed",
  }[state.phase];
  const body = state.phase === "success"
    ? `Your ${label} payment is confirmed and the funds are ready to use.`
    : state.message || `Checking with ${label}. This usually takes a few seconds.`;

  const goPortal = (view) => navigate(`/app?view=${view}`);

  return (
    <div className="min-h-screen bg-[#f9f9fa] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[500px]">
          <div className="flex justify-center mb-8">
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: tone.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, color: "#fff", fontWeight: 600 }}>
              {tone.glyph || <span style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />}
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#e1e2e9] p-8 text-center mb-6">
            <h1 className="font-display font-semibold text-2xl text-[#0f1013] mb-2">{title}</h1>
            <p className="text-[#6B6F76] text-sm mb-6" style={{ lineHeight: 1.6 }}>{body}</p>
            {trxId && <p className="text-[#9CA1A9] text-xs mb-6">Reference: <span style={{ fontFamily: "ui-monospace, monospace" }}>{trxId}</span></p>}

            <div className="space-y-3">
              {state.phase === "failed" ? (
                <button onClick={() => goPortal("topup")} className="w-full bg-[#2155f5] hover:bg-[#1a46d1] text-white font-display font-medium py-3 rounded-full transition-colors">
                  Try again
                </button>
              ) : (
                <button onClick={() => goPortal("home")} disabled={state.phase === "working"} className="w-full bg-[#2155f5] hover:bg-[#1a46d1] disabled:opacity-50 text-white font-display font-medium py-3 rounded-full transition-colors">
                  {state.phase === "working" ? "Please wait…" : "Go to dashboard"}
                </button>
              )}
              <button onClick={() => goPortal("transactions")} className="w-full bg-white border border-[#E1E2E7] text-[#2155f5] font-display font-medium py-3 rounded-full transition-colors hover:bg-[#f9f9fa]">
                View transactions
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-[#9CA1A9]">
            Charged but no balance after 30 minutes? Contact{" "}
            <a href="mailto:support@zedsms.com" className="text-[#2155f5] hover:underline">support@zedsms.com</a>
            {trxId ? " with the reference above." : "."}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
