"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuthContext } from "../portal/context/AuthContext";
// @ts-ignore
import { isMfaChallengeExpired } from "../portal/api/auth";
import { clearNavState, readNavState, setNavState } from "../lib/navState";
import { goToPortal } from "../lib/portalNav";

// Second step of a 2FA sign-in. /login issued a short-lived challenge instead of
// a token; it is exchanged here for the real one with an authenticator code or a
// one-time recovery code. No credentials are held on this page.
export function OTPVerificationPage() {
  const router = useRouter();
  // taken once on arrival (left by sign-in / social sign-in / Telegram callback)
  const [challenge] = React.useState(() => readNavState<{ mfaToken?: string; email?: string }>("/auth/verify-otp") || {});
  React.useEffect(() => clearNavState("/auth/verify-otp"), []);
  const { verifyMfa, isVerifyMfaLoading } = useAuthContext();
  const [mode, setMode] = React.useState<"otp" | "recovery">("otp");
  const [otp, setOtp] = React.useState("");
  const [recoveryCode, setRecoveryCode] = React.useState("");
  const [error, setError] = React.useState("");

  // Opened directly, or reloaded (the hand-off is read once) — there is no
  // challenge to finish, so the sign-in starts again.
  React.useEffect(() => {
    if (!challenge.mfaToken) router.replace("/auth/signin");
  }, [challenge.mfaToken, router]);

  // The challenge lives 5 minutes; send people back before they type into a dead form.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setNavState("/auth/signin", { notice: "That sign-in attempt timed out. Please sign in again." });
      router.replace("/auth/signin");
    }, 5 * 60 * 1000);
    return () => clearTimeout(t);
  }, [router]);

  const usingRecovery = mode === "recovery";
  const value = usingRecovery ? recoveryCode : otp;
  const ready = usingRecovery ? recoveryCode.trim().length >= 8 : otp.length === 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyMfaLoading || !ready) return;
    setError("");

    try {
      await new Promise<void>((resolve, reject) => {
        verifyMfa(
          usingRecovery
            ? { mfaToken: challenge.mfaToken, recoveryCode: recoveryCode.trim() }
            : { mfaToken: challenge.mfaToken, otp },
          {
            onSuccess: () => {
              goToPortal();
              resolve();
            },
            onError: (err: any) => {
              // expired, or too many wrong codes — the attempt is over
              if (isMfaChallengeExpired(err)) {
                setNavState("/auth/signin", { notice: err?.body?.message || "That sign-in attempt expired. Please sign in again." });
                router.replace("/auth/signin");
                reject(err);
                return;
              }
              setError(err?.body?.message || err?.message || "That code is not valid. Try again.");
              setOtp("");
              setRecoveryCode("");
              reject(err);
            },
          }
        );
      });
    } catch {
      // Error handled in callback
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9fa] flex flex-col">
      <Navbar />
      {/* clear the Navbar, which floats over the page (absolute) */}
      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12 sm:pt-32 md:pb-16">
        <div className="w-full max-w-[500px]">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2155f5 0%, #5B54E8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
              }}
            >
              🔐
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-[20px] border border-[#e1e2e9] p-8 mb-6">
            <h1 className="font-display font-semibold text-2xl text-[#0f1013] mb-2 text-center">
              Two-Factor Authentication
            </h1>
            <p className="text-[#6B6F76] text-sm text-center mb-6">
              {usingRecovery
                ? "Enter one of the recovery codes you saved when you turned on two-factor authentication."
                : "Enter the 6-digit code from your authenticator app to complete the login."}
            </p>

            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm flex gap-3">
                <span className="text-lg">⚠️</span>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* OTP Input */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6F76] mb-2">
                  {usingRecovery ? "Recovery Code" : "Authentication Code"}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={value}
                  onChange={(e) =>
                    usingRecovery
                      ? setRecoveryCode(e.target.value.toUpperCase().slice(0, 12))
                      : setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder={usingRecovery ? "XXXXX-XXXXX" : "000000"}
                  maxLength={usingRecovery ? 12 : 6}
                  className={`w-full h-11 px-4 rounded-[11px] border text-center text-lg font-mono font-bold tracking-widest transition-colors ${
                    error
                      ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-[#E1E2E7] bg-white focus:border-[#2155f5] focus:ring-2 focus:ring-[#eef1fb]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => { setMode(usingRecovery ? "otp" : "recovery"); setError(""); setOtp(""); setRecoveryCode(""); }}
                  className="mt-3 text-[#2155f5] hover:underline text-xs font-medium"
                >
                  {usingRecovery ? "Use my authenticator app instead" : "Lost your phone? Use a recovery code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifyMfaLoading || !ready}
                className="w-full bg-[#2155f5] hover:bg-[#1a46d1] disabled:opacity-50 text-white font-display font-medium py-3 rounded-full transition-colors mt-6 flex items-center justify-center gap-2"
              >
                {isVerifyMfaLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>
            </form>

            {/* Help Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => router.replace("/auth/signin")}
                className="text-[#2155f5] hover:underline text-sm font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-xs text-[#9CA1A9]">
            Need help? Contact{" "}
            <a href="mailto:support@zedsms.com" className="text-[#2155f5] hover:underline">
              support@zedsms.com
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
