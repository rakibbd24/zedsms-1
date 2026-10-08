"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// @ts-ignore
import { finishTelegramOpenId } from "../portal/api/auth";
import { setNavState } from "../lib/navState";
import { goToPortal } from "../lib/portalNav";

// Where Telegram's OpenID consent screen sends the browser back to, with
// ?code&state. The code is handed to our backend, which exchanges it for an
// id_token (that call needs the client secret, so it can't happen here).
// The authorization code can be redeemed once, and finishTelegramOpenId consumes the saved
// PKCE verifier. React StrictMode (next dev) runs the effect twice, so the second run would
// fail with "didn't start here" — share one exchange per code instead.
const exchanges = new Map<string, Promise<any>>();
const exchangeOnce = (code: string, state: string | null) => {
  if (!exchanges.has(code)) exchanges.set(code, finishTelegramOpenId({ code, state }));
  return exchanges.get(code)!;
};

export function TelegramCallbackPage() {
  const router = useRouter();
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const denied = params.get("error");
    let cancelled = false;

    if (denied || !code) {
      setNavState("/auth/signin", { notice: denied === "access_denied" ? "Telegram sign-in was cancelled." : "Telegram sign-in didn't complete. Please try again." });
      router.replace("/auth/signin");
      return;
    }

    exchangeOnce(code, state)
      .then((result: any) => {
        if (cancelled) return;
        // 2FA account: same second step as any other sign-in
        if (result?.needsOtp) {
          setNavState("/auth/verify-otp", { mfaToken: result.mfaToken });
          router.replace("/auth/verify-otp");
        } else {
          goToPortal();
        }
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Telegram sign-in failed. Please try again.");
      });

    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f9f9fa] flex flex-col">
      <Navbar />
      {/* clear the Navbar, which floats over the page (absolute) */}
      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12 sm:pt-32 md:pb-16">
        <div className="w-full max-w-[460px] text-center">
          <div className="flex justify-center mb-8">
            <div
              style={{
                width: 90, height: 90, borderRadius: "50%",
                background: error ? "linear-gradient(135deg, #D6453A 0%, #EE6B5F 100%)" : "linear-gradient(135deg, #2155f5 0%, #5B54E8 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 40,
              }}
            >
              {error ? "✕" : (
                <span style={{ width: 40, height: 40, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
              )}
            </div>
          </div>
          <div className="bg-white rounded-[20px] border border-[#e1e2e9] p-8">
            <h1 className="font-display font-semibold text-xl text-[#0f1013] mb-2">
              {error ? "Telegram sign-in failed" : "Signing you in…"}
            </h1>
            <p className="text-[#6B6F76] text-sm mb-6" style={{ lineHeight: 1.6 }}>
              {error || "Finishing your Telegram sign-in."}
            </p>
            {error && (
              <button
                onClick={() => router.replace("/auth/signin")}
                className="w-full bg-[#2155f5] hover:bg-[#1a46d1] text-white font-display font-medium py-3 rounded-full transition-colors"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
