"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// @ts-ignore
import { loginWithGoogle } from "../portal/api/auth";
import { setNavState } from "../lib/navState";
import { goToPortal } from "../lib/portalNav";
import { clearGoogleSignIn, readGoogleCallback } from "../lib/googleAuth";

// Where Google's consent screen sends the browser back to, with #id_token&state (see
// lib/googleAuth.ts). The token is handed to the backend exactly as the old Google button's
// credential was. React StrictMode (next dev) runs the effect twice — share one login per token.
const logins = new Map<string, Promise<any>>();
const loginOnce = (idToken: string) => {
  if (!logins.has(idToken)) logins.set(idToken, loginWithGoogle({ idToken }));
  return logins.get(idToken)!;
};

export function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const result = readGoogleCallback(window.location.hash);
    // keep the token out of the address bar and history
    window.history.replaceState(null, "", window.location.pathname);
    let cancelled = false;

    if ("error" in result) {
      clearGoogleSignIn();
      setNavState("/auth/signin", { notice: result.error === "cancelled" ? "Google sign-in was cancelled." : "Google sign-in didn't complete. Please try again." });
      router.replace("/auth/signin");
      return;
    }

    loginOnce(result.idToken)
      .then((res: any) => {
        clearGoogleSignIn();
        if (cancelled) return;
        // 2FA account: same second step as any other sign-in
        if (res?.needsOtp) {
          setNavState("/auth/verify-otp", { mfaToken: res.mfaToken });
          router.replace("/auth/verify-otp");
        } else {
          goToPortal();
        }
      })
      .catch((err: any) => {
        clearGoogleSignIn();
        if (!cancelled) setError(err?.message || "Google sign-in failed. Please try again.");
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
              {error ? "Google sign-in failed" : "Signing you in…"}
            </h1>
            <p className="text-[#6B6F76] text-sm mb-6" style={{ lineHeight: 1.6 }}>
              {error || "Finishing your Google sign-in."}
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
