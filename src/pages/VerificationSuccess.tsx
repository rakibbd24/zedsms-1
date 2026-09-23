import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// @ts-ignore
import { useAuthContext } from "../portal/context/AuthContext";
// @ts-ignore
import { validateVerificationToken } from "../portal/api/auth";

// Where the emailed verification link lands, after the backend has marked the
// address verified and redirected back with ?status=...&token=...
//
// The token is a one-time value tied to that verification, so it confirms the
// redirect really came from a completed link rather than someone typing the URL.
type Status = "checking" | "verified" | "already-verified" | "expired" | "invalid";

const COPY: Record<Exclude<Status, "checking">, { icon: string; title: string; body: string; tone: string }> = {
  verified: {
    icon: "✓",
    title: "Email verified",
    body: "Your account is active. You can start using ZEDSMS right away.",
    tone: "linear-gradient(135deg, #1B8A5A 0%, #2FB37A 100%)",
  },
  "already-verified": {
    icon: "✓",
    title: "Already verified",
    body: "This email was verified earlier — no need to do it again.",
    tone: "linear-gradient(135deg, #1B8A5A 0%, #2FB37A 100%)",
  },
  expired: {
    icon: "⏱️",
    title: "This link has expired",
    body: "Verification links are valid for a limited time. Sign in and send yourself a fresh one.",
    tone: "linear-gradient(135deg, #C98A0E 0%, #E8B23A 100%)",
  },
  invalid: {
    icon: "✕",
    title: "This link isn't valid",
    body: "The link may have been altered or already used. Sign in and request a new verification email.",
    tone: "linear-gradient(135deg, #D6453A 0%, #EE6B5F 100%)",
  },
};

export function VerificationSuccessPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { isLoggedIn, refreshUser } = useAuthContext();

  const params = React.useMemo(() => new URLSearchParams(search), [search]);
  const urlStatus = params.get("status");
  const token = params.get("token");

  const [status, setStatus] = React.useState<Status>(
    urlStatus === "expired" ? "expired"
      : urlStatus === "invalid" ? "invalid"
      : urlStatus === "already-verified" ? "already-verified"
      : "checking"
  );

  React.useEffect(() => {
    if (status !== "checking") return;
    let cancelled = false;

    (async () => {
      // No token means we can't confirm this came from a real verification.
      if (!token) {
        if (!cancelled) setStatus("invalid");
        return;
      }
      const ok = await validateVerificationToken(token).catch(() => false);
      if (cancelled) return;
      setStatus(ok ? "verified" : "invalid");
      // this browser may hold the session that was waiting — pick up the new state
      if (ok) refreshUser?.();
    })();

    return () => { cancelled = true; };
  }, [status, token, refreshUser]);

  const verified = status === "verified" || status === "already-verified";
  const copy = status === "checking" ? null : COPY[status];

  return (
    <div className="min-h-screen bg-[#f9f9fa] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[500px]">
          <div className="flex justify-center mb-8">
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: copy ? copy.tone : "linear-gradient(135deg, #2155f5 0%, #5B54E8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                color: "#fff",
                fontWeight: 600,
              }}
            >
              {copy ? copy.icon : (
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "4px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              )}
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#e1e2e9] p-8 text-center mb-6">
            <h1 className="font-display font-semibold text-2xl text-[#0f1013] mb-2">
              {copy ? copy.title : "Confirming your email…"}
            </h1>
            <p className="text-[#6B6F76] text-sm mb-6" style={{ lineHeight: 1.6 }}>
              {copy ? copy.body : "This only takes a moment."}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate(verified && isLoggedIn ? "/app/home" : "/auth/signin")}
                disabled={status === "checking"}
                className="w-full bg-[#2155f5] hover:bg-[#1a46d1] disabled:opacity-50 text-white font-display font-medium py-3 rounded-full transition-colors"
              >
                {status === "checking" ? "Please wait…" : verified && isLoggedIn ? "Go to dashboard" : "Sign in"}
              </button>
              {verified && isLoggedIn && (
                <p className="text-[#9CA1A9] text-xs">
                  Signed in on another tab? It will continue on its own.
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-[#9CA1A9]">
            Having trouble? Contact{" "}
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
