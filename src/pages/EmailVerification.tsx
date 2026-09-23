import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuthContext } from "../portal/context/AuthContext";
// @ts-ignore
import { getEmailVerifyStatus, resendVerificationEmail } from "../portal/api/auth";

export function EmailVerificationPage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuthContext();
  const [resendAfter, setResendAfter] = React.useState(0);
  const [isResending, setIsResending] = React.useState(false);
  const [message, setMessage] = React.useState("");

  // The link is usually opened in another tab (or another device), so this
  // screen asks the API whether the address has been verified yet and moves on
  // by itself. Polling pauses while the tab is hidden and stops after 15 min.
  React.useEffect(() => {
    let stopped = false;
    const startedAt = Date.now();

    const check = async () => {
      if (stopped || document.hidden) return;
      if (Date.now() - startedAt > 15 * 60 * 1000) { clearInterval(timer); return; }

      const { verified } = await getEmailVerifyStatus();
      if (verified && !stopped) {
        clearInterval(timer);
        await refreshUser?.();
        navigate("/app/home", { replace: true });
      }
    };

    const timer = setInterval(check, 5000);
    // also check as soon as the user comes back to this tab
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVisible);
    check();

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [navigate, refreshUser]);

  const handleResendEmail = async () => {
    if (resendAfter > 0) return;

    setIsResending(true);
    setMessage("");

    try {
      const msg = await resendVerificationEmail();
      setMessage(msg || "Verification email sent! Check your inbox.");
      // 2 minute cooldown, same as the old dashboard
      setResendAfter(120);
    } catch (error: any) {
      setMessage(error?.body?.message || error?.message || "Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };

  // Countdown timer
  React.useEffect(() => {
    if (resendAfter <= 0) return;

    const interval = setInterval(() => {
      setResendAfter((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendAfter]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#f9f9fa] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
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
              ✉️
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-[20px] border border-[#e1e2e9] p-8 text-center mb-6">
            <h1 className="font-display font-semibold text-2xl text-[#0f1013] mb-2">
              Verify Your Email
            </h1>
            <p className="text-[#6B6F76] text-sm mb-6">
              We've sent a verification link to <strong>{user?.email}</strong>. Click the link in your email to
              activate your account.
            </p>
            <p className="text-[#9CA1A9] text-xs mb-6">
              Leave this page open — it continues automatically once you click the link.
              Didn't receive the email? Check your spam folder or resend it below.
            </p>

            {message && (
              <div
                className="mb-6 p-4 rounded-lg text-sm"
                style={{
                  background: /sent|verified/i.test(message) ? "#E9F6EF" : "#FCEDEC",
                  color: /sent|verified/i.test(message) ? "#1B8A5A" : "#D6453A",
                }}
              >
                {message}
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={resendAfter > 0 || isResending}
                className="w-full bg-[#2155f5] hover:bg-[#1a46d1] disabled:opacity-50 text-white font-display font-medium py-3 rounded-full transition-colors"
              >
                {isResending ? "Sending..." : resendAfter > 0 ? `Resend after ${formatTime(resendAfter)}` : "Resend Email"}
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate("/auth/signin");
                }}
                className="w-full bg-white border border-[#E1E2E7] text-[#2155f5] font-display font-medium py-3 rounded-full transition-colors hover:bg-[#f9f9fa]"
              >
                Back to Sign In
              </button>
            </div>
          </div>

          {/* Help Text */}
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
