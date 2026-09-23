import React from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { useAuthContext } from "../portal/context/AuthContext";
// @ts-ignore
import { startTelegramOpenId } from "../portal/api/auth";

// Google / Apple / Telegram sign-in, shared by the sign-in and sign-up pages.
// Each provider is shown only when its client id is configured, so there are
// never buttons that can't work:
//   VITE_GOOGLE_CLIENT_ID    Google OAuth client id (Web application)
//   VITE_APPLE_SERVICE_ID    Apple Services ID + VITE_APPLE_REDIRECT_URI
//   VITE_TELEGRAM_OPENID_CLIENT_ID + VITE_TELEGRAM_OPENID_REDIRECT_URI
//                            Telegram OpenID Connect (preferred)
//   VITE_TELEGRAM_BOT        Telegram Login Widget, used when OpenID isn't set
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const APPLE_SERVICE_ID = import.meta.env.VITE_APPLE_SERVICE_ID || "";
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI || "";
const TELEGRAM_BOT = (import.meta.env.VITE_TELEGRAM_BOT || "").replace("@", "");
const TELEGRAM_OPENID_CLIENT_ID = import.meta.env.VITE_TELEGRAM_OPENID_CLIENT_ID || "";
const TELEGRAM_OPENID_REDIRECT_URI =
  import.meta.env.VITE_TELEGRAM_OPENID_REDIRECT_URI || `${window.location.origin}/auth/telegram/callback`;
// OpenID is the better path (audience-bound id_token); the widget is the fallback
const TELEGRAM_MODE = TELEGRAM_OPENID_CLIENT_ID ? "openid" : TELEGRAM_BOT ? "widget" : "off";

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

// Loads a third-party script once and resolves when it's ready.
const scriptCache: Record<string, Promise<void>> = {};
function loadScript(src: string): Promise<void> {
  if (!scriptCache[src]) {
    scriptCache[src] = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("Could not load " + src));
      document.head.appendChild(el);
    });
  }
  return scriptCache[src];
}

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.2 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.2-3.9 6.6-9.6 6.6-17.1z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C1 16.3 0 20 0 24s1 7.7 2.6 10.8l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.6 2.2-8.7 2.2-6.3 0-11.6-3.7-13.5-9.1l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);
const AppleMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.36 12.78c.02-2.4 1.96-3.55 2.05-3.6-1.12-1.63-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.75 0-1.91-.85-3.14-.83-1.61.02-3.1.94-3.93 2.38-1.68 2.91-.43 7.21 1.2 9.57.8 1.16 1.75 2.45 3 2.4 1.2-.05 1.66-.78 3.11-.78 1.45 0 1.86.78 3.13.75 1.29-.02 2.11-1.17 2.9-2.33.91-1.34 1.29-2.64 1.31-2.71-.03-.01-2.51-.96-2.53-3.83zM14.1 5.3c.66-.8 1.11-1.91.99-3.02-.95.04-2.11.63-2.79 1.43-.61.71-1.15 1.85-1 2.93 1.06.08 2.14-.54 2.8-1.34z" />
  </svg>
);
const TelegramMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#2AABEE" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.21-1.86 8.77c-.14.62-.51.77-1.03.48l-2.85-2.1-1.37 1.32c-.15.15-.28.28-.58.28l.2-2.93 5.33-4.82c.23-.2-.05-.32-.36-.12L8.5 13.2l-2.84-.89c-.62-.19-.63-.62.13-.92l11.1-4.28c.51-.19.96.12.79.9z" />
  </svg>
);

const PROVIDERS = [
  { id: "google", label: "Google", mark: <GoogleMark />, enabled: !!GOOGLE_CLIENT_ID },
  { id: "apple", label: "Apple", mark: <AppleMark />, enabled: !!APPLE_SERVICE_ID && !!APPLE_REDIRECT_URI },
  { id: "telegram", label: "Telegram", mark: <TelegramMark />, enabled: TELEGRAM_MODE !== "off" },
] as const;

export default function SocialAuthButtons({ action = "Sign in" }: { action?: string }) {
  const navigate = useNavigate();
  const { socialLogin, isSocialLoginLoading } = useAuthContext();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const available = PROVIDERS.filter((p) => p.enabled);
  // Telegram is rendered by its own widget below, not as one of our buttons
  // Google and Telegram render their own official buttons below
  const buttonProviders = available.filter(
    (p) => p.id !== "google" && !(p.id === "telegram" && TELEGRAM_MODE === "widget")
  );

  const withTelegram = async () => {
    setError(""); setBusy("telegram");
    try {
      await startTelegramOpenId({ clientId: TELEGRAM_OPENID_CLIENT_ID, redirectUri: TELEGRAM_OPENID_REDIRECT_URI });
    } catch {
      fail("Could not start Telegram sign-in. Please try again.");
    }
  };

  const finish = (result: any) => {
    setBusy(null);
    // 2FA account: same second step as a password sign-in
    if (result?.needsOtp) {
      navigate("/auth/verify-otp", { state: { mfaToken: result.mfaToken }, replace: true });
    } else {
      navigate("/app/home", { replace: true });
    }
  };
  const fail = (message: string) => { setBusy(null); setError(message); };

  const run = (provider: string, payload: Record<string, unknown>) =>
    socialLogin({ provider, ...payload }, {
      onSuccess: finish,
      onError: (err: any) => fail(err?.message || "Sign-in failed. Please try again."),
    });

  // Google's own button, because the backend wants an ID token (JWT bound to our
  // client id) rather than an access token, and only Identity Services issues it.
  const googleHolder = React.useRef<HTMLDivElement>(null);
  const googleEnabled = available.some((p) => p.id === "google");

  React.useEffect(() => {
    if (!googleEnabled) return;
    let cancelled = false;

    loadScript("https://accounts.google.com/gsi/client")
      .then(() => {
        if (cancelled || !googleHolder.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res: any) => {
            if (!res?.credential) return fail("Google sign-in was cancelled.");
            setError(""); setBusy("google");
            run("google", { idToken: res.credential });
          },
        });
        window.google.accounts.id.renderButton(googleHolder.current, {
          theme: "outline", size: "large", shape: "pill",
          text: action === "Sign up" ? "signup_with" : "signin_with",
          width: 320,
        });
      })
      .catch(() => { if (!cancelled) setError("Could not load Google sign-in."); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, [googleEnabled]);

  const withApple = async () => {
    setError(""); setBusy("apple");
    try {
      await loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");
      window.AppleID.auth.init({
        clientId: APPLE_SERVICE_ID,
        scope: "name email",
        redirectURI: APPLE_REDIRECT_URI,
        usePopup: true,
      });
      const res = await window.AppleID.auth.signIn();
      const identityToken = res?.authorization?.id_token;
      if (!identityToken) return fail("Apple sign-in was cancelled.");
      // Apple returns the name only on the first authorization
      const name = [res?.user?.name?.firstName, res?.user?.name?.lastName].filter(Boolean).join(" ");
      run("apple", { identityToken, name: name || undefined });
    } catch (err: any) {
      if (err?.error === "popup_closed_by_user") return fail("Apple sign-in was cancelled.");
      fail("Apple sign-in failed. Please try again.");
    }
  };

  // Telegram only works through its own widget (it renders a cross-origin
  // iframe, which can't be clicked from our code), so it is mounted inline and
  // the user clicks Telegram's own button.
  const telegramHolder = React.useRef<HTMLDivElement>(null);
  const telegramWidget = TELEGRAM_MODE === "widget" && available.some((p) => p.id === "telegram");

  React.useEffect(() => {
    if (!telegramWidget) return;
    const holder = telegramHolder.current;
    if (!holder || holder.querySelector("script")) return;

    window.onTelegramAuth = (user) => { setError(""); setBusy("telegram"); run("telegram", { data: user }); };

    const el = document.createElement("script");
    el.src = "https://telegram.org/js/telegram-widget.js?22";
    el.async = true;
    el.setAttribute("data-telegram-login", TELEGRAM_BOT);
    el.setAttribute("data-size", "large");
    el.setAttribute("data-userpic", "false");
    el.setAttribute("data-radius", "20");
    el.setAttribute("data-request-access", "write");
    el.setAttribute("data-onauth", "onTelegramAuth(user)");
    holder.appendChild(el);

    return () => { window.onTelegramAuth = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, [telegramWidget]);

  const pending = (id: string) => busy === id && isSocialLoginLoading !== false;

  if (available.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 my-5">
        <div className="h-px bg-[#E1E2E7] flex-1" />
        <span className="text-[#9CA1A9] text-xs">or continue with</span>
        <div className="h-px bg-[#E1E2E7] flex-1" />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex gap-2">
          <span>⚠️</span><div>{error}</div>
        </div>
      )}

      {/* Google renders its own branded button */}
      {googleEnabled && (
        <div ref={googleHolder} style={{ display: "flex", justifyContent: "center", marginBottom: buttonProviders.length || telegramWidget ? 12 : 0, minHeight: 44 }} />
      )}

      <div className={`grid gap-3 ${buttonProviders.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {buttonProviders.map((p) => (
          <button
            key={p.id}
            type="button"
            title={`${action} with ${p.label}`}
            disabled={!!busy}
            onClick={() => (p.id === "telegram" ? withTelegram() : withApple())}
            className="h-11 rounded-full border border-[#E1E2E7] bg-white hover:bg-[#f9f9fa] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-[#0f1013]"
          >
            {pending(p.id) ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : p.mark}
            <span className="hidden sm:inline">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Telegram renders its own branded button here */}
      {telegramWidget && (
        <div ref={telegramHolder} style={{ marginTop: buttonProviders.length ? 12 : 0, display: "flex", justifyContent: "center" }} />
      )}
    </div>
  );
}
