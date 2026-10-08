"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import SocialAuthButtons from "../components/SocialAuthButtons";
import Footer from "../components/Footer";
import { useAuth } from "../portal/hooks/useAuth";
import { clearNavState, readNavState, setNavState } from "../lib/navState";
import { goToPortal } from "../lib/portalNav";

const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const pwChecks = (p: string) => ({
  len: p.length >= 8,
  upper: /[A-Z]/.test(p),
  lower: /[a-z]/.test(p),
  num: /[0-9]/.test(p),
});
const pwStrongEnough = (p: string) => Object.values(pwChecks(p)).every(Boolean);

const MAX_ATTEMPTS = 3;
const LOCK_MS = 30_000;

// ---------- icons (stroke SVGs — emoji rendered differently on every phone) ----------
type IconProps = { className?: string };
const svg = (path: React.ReactNode) => ({ className = "size-[18px]" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const MailIcon = svg(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>);
const LockIcon = svg(<><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>);
const EyeIcon = svg(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>);
const EyeOffIcon = svg(<><path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.7 3.4M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.5-.6 4.9-1.5" /><path d="m3 3 18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>);
const AlertIcon = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>);
const ClockIcon = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
const CheckIcon = svg(<path d="m5 12.5 4.5 4.5L19 7.5" />);
const DotIcon = svg(<circle cx="12" cy="12" r="3.5" />);

const Spinner = () => (
  <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ---------- shared pieces ----------
const Banner = ({ tone, icon, children }: { tone: "danger" | "warning"; icon: React.ReactNode; children: React.ReactNode }) => (
  <div role="alert" className={`mb-5 px-3.5 py-3 rounded-xl text-sm flex items-start gap-2.5 ${tone === "danger" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
    <span className="shrink-0 mt-px">{icon}</span>
    <div className="leading-snug">{children}</div>
  </div>
);

const FieldError = ({ id, children }: { id: string; children?: string }) =>
  children ? (
    <p id={id} className="text-red-600 text-xs mt-1.5 flex items-center gap-1.5">
      <AlertIcon className="size-3.5 shrink-0" /> {children}
    </p>
  ) : null;

type AuthInputProps = {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete: string;
  error?: string;
  disabled?: boolean;
  reveal?: { shown: boolean; toggle: () => void };
};

// Label tied to its input, icon inside, optional show/hide toggle. 16px text on phones
// (below that iOS zooms in on focus), 14px from sm up.
const AuthInput = ({ id, label, icon, type, value, onChange, placeholder, autoComplete, error, disabled, reveal }: AuthInputProps) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-[#6B6F76] mb-2">{label}</label>
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA1A9] flex">{icon}</span>
      <input
        id={id}
        type={reveal ? (reveal.shown ? "text" : "password") : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize={type === "email" ? "none" : undefined}
        spellCheck={type === "email" ? false : undefined}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full h-11 pl-11 ${reveal ? "pr-11" : "pr-4"} rounded-[11px] border text-base sm:text-sm text-[#0f1013] placeholder:text-[#9CA1A9] outline-none transition-colors disabled:opacity-60 ${
          error ? "border-red-400 bg-red-50/60 focus:ring-2 focus:ring-red-100" : "border-[#E1E2E7] bg-white focus:border-[#2155f5] focus:ring-2 focus:ring-[#eef1fb]"
        }`}
      />
      {reveal && (
        <button
          type="button"
          onClick={reveal.toggle}
          aria-label={reveal.shown ? "Hide password" : "Show password"}
          aria-pressed={reveal.shown}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 size-8 rounded-lg flex items-center justify-center text-[#9CA1A9] hover:text-[#6B6F76] hover:bg-[#f5f6f8] transition-colors"
        >
          {reveal.shown ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
    <FieldError id={`${id}-error`}>{error}</FieldError>
  </div>
);

const AuthTabs = ({ active }: { active: "signin" | "signup" }) => {
  const base = "flex-1 py-2.5 px-4 rounded-lg font-display font-medium text-sm text-center transition-colors";
  const on = `${base} bg-white text-[#0f1013] shadow-sm`;
  const off = `${base} text-[#6B6F76] hover:text-[#0f1013]`;
  return (
    <div className="flex gap-1 mb-7 bg-[#f4f5f7] p-1 rounded-xl">
      <Link href="/auth/signin" replace className={active === "signin" ? on : off} aria-current={active === "signin" ? "page" : undefined}>Sign in</Link>
      <Link href="/auth/signup" replace className={active === "signup" ? on : off} aria-current={active === "signup" ? "page" : undefined}>Sign up</Link>
    </div>
  );
};

const SubmitButton = ({ loading, disabled, children, loadingText }: { loading: boolean; disabled?: boolean; children: React.ReactNode; loadingText: string }) => (
  <button
    type="submit"
    disabled={disabled || loading}
    className="w-full h-11 bg-[#2155f5] hover:bg-[#1a46d1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-medium rounded-full transition-colors flex items-center justify-center gap-2"
  >
    {loading ? <><Spinner /> {loadingText}</> : children}
  </button>
);

const legal = "text-[#6B6F76] underline underline-offset-2 hover:text-[#2155f5]";

// Page frame: the Navbar floats over the page (absolute), so phones — which hide the
// logo that used to fill this gap — need top padding to clear it.
const AuthShell = ({ children, footnote }: { children: React.ReactNode; footnote?: boolean }) => (
  <div className="min-h-screen bg-[#f9f9fa] flex flex-col">
    <Navbar />
    <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12 sm:pt-32 md:pb-16">
      <div className="w-full max-w-[420px]">
        {/* Logo — phones already show it in the header right above, so only from md up */}
        <div className="hidden md:flex items-center justify-center gap-3 mb-8">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#2155f5" />
            <path d="M16 8C11.58 8 8 11.58 8 16s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="white" />
          </svg>
          <span className="font-display font-semibold text-2xl text-[#0f1013]">ZEDSMS</span>
        </div>

        <div className="bg-white rounded-[20px] border border-[#e1e2e9] p-6 sm:p-8">{children}</div>

        {footnote && (
          <p className="text-center text-xs text-[#9CA1A9] mt-6 leading-relaxed">
            By continuing you agree to ZEDSMS's <Link href="/terms-of-service" className={legal}>Terms of Service</Link> and <Link href="/privacy-policy" className={legal}>Privacy Policy</Link>.
          </p>
        )}
      </div>
    </div>
    <Footer />
  </div>
);

// ============ SIGN IN PAGE ============
function SignInPage() {
  const router = useRouter();
  // set when the 2FA step sends the user back (challenge expired or used up), or
  // ?expired=1 when the API rejected a stale session (see api/client)
  const expired = useSearchParams().get("expired") === "1";
  const [navNotice] = React.useState(() => readNavState<{ notice?: string }>("/auth/signin")?.notice);
  React.useEffect(() => clearNavState("/auth/signin"), []);
  const notice = navNotice || (expired ? "Your session has expired. Please sign in again." : undefined);
  const { login, isLoginLoading } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [attempts, setAttempts] = React.useState(0);

  // after MAX_ATTEMPTS failures the form locks for LOCK_MS, then unlocks by itself
  // (it used to say "try again in 30 seconds" but stayed locked until a reload)
  const [lockedUntil, setLockedUntil] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!lockedUntil) return undefined;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= lockedUntil) { setLockedUntil(null); setAttempts(0); setErrors({}); }
    }, 500);
    return () => clearInterval(t);
  }, [lockedUntil]);
  const locked = lockedUntil !== null;
  const secondsLeft = locked ? Math.max(1, Math.ceil((lockedUntil - now) / 1000)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || isLoginLoading) return;

    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required";
    else if (!emailValid(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    login(
      { login: email.trim(), password },
      {
        onSuccess: (result: any) => {
          // 2FA account: no token yet — finish on the OTP screen, carrying only the
          // short-lived challenge in router state, never the password
          if (result?.needsOtp) {
            setNavState("/auth/verify-otp", { mfaToken: result.mfaToken, email });
            router.replace("/auth/verify-otp");
          } else {
            setTimeout(() => goToPortal("/app/home", { replace: false }), 300);
          }
        },
        onError: (error: any) => {
          // the backend rate-limits /login itself ("Too many login attempts. Please try
          // again in N seconds.") — that survives a reload, so mirror its wait here
          const serverMsg = String(error?.message || "");
          if (/too many/i.test(serverMsg)) {
            const secs = Number(/(\d+)\s*second/i.exec(serverMsg)?.[1]) || LOCK_MS / 1000;
            setErrors({});
            setNow(Date.now());
            setLockedUntil(Date.now() + secs * 1000);
            return;
          }
          const next = attempts + 1;
          setAttempts(next);
          if (next >= MAX_ATTEMPTS) {
            setErrors({});
            setNow(Date.now());
            setLockedUntil(Date.now() + LOCK_MS);
          } else {
            const remaining = MAX_ATTEMPTS - next;
            setErrors({ submit: `Incorrect email or password. ${remaining} attempt${remaining === 1 ? "" : "s"} left.` });
          }
        },
      }
    );
  };

  return (
    <AuthShell footnote>
      <AuthTabs active="signin" />

      <h1 className="font-display font-semibold text-2xl text-[#0f1013] mb-1">Welcome back</h1>
      <p className="text-[#6B6F76] text-sm mb-6">Sign in to manage your numbers and messages.</p>

      {locked && <Banner tone="danger" icon={<ClockIcon />}>Too many failed attempts. Try again in {secondsLeft}s.</Banner>}
      {!locked && notice && !errors.submit && <Banner tone="warning" icon={<ClockIcon />}>{notice}</Banner>}
      {!locked && errors.submit && <Banner tone="danger" icon={<AlertIcon />}>{errors.submit}</Banner>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput id="signin-email" label="Email" icon={<MailIcon />} type="email" autoComplete="email"
          value={email} onChange={(v) => { setEmail(v); setErrors((er) => ({ ...er, email: "" })); }}
          placeholder="you@example.com" error={errors.email} disabled={locked} />
        <AuthInput id="signin-password" label="Password" icon={<LockIcon />} type="password" autoComplete="current-password"
          value={password} onChange={(v) => { setPassword(v); setErrors((er) => ({ ...er, password: "" })); }}
          placeholder="Your password" error={errors.password} disabled={locked}
          reveal={{ shown: showPassword, toggle: () => setShowPassword((s) => !s) }} />

        <div className="pt-2">
          <SubmitButton loading={isLoginLoading} disabled={locked} loadingText="Signing in…">Sign in</SubmitButton>
        </div>
      </form>

      <SocialAuthButtons action="Sign in" />

      <p className="mt-6 text-center text-sm text-[#6B6F76]">
        Don't have an account? <Link href="/auth/signup" replace className="text-[#2155f5] hover:underline font-medium">Sign up</Link>
      </p>
    </AuthShell>
  );
}

// ============ SIGN UP PAGE ============
const Requirement = ({ met, children }: { met: boolean; children: React.ReactNode }) => (
  <li className={`flex items-center gap-1.5 transition-colors ${met ? "text-green-600" : "text-[#9CA1A9]"}`}>
    {met ? <CheckIcon className="size-3.5 shrink-0" /> : <DotIcon className="size-3.5 shrink-0" />}
    {children}
  </li>
);

function SignUpPage() {
  const { signup, isSignupLoading } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const checks = pwChecks(password);
  const clear = (key: string) => setErrors((er) => ({ ...er, [key]: "" }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignupLoading) return;

    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required";
    else if (!emailValid(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (!pwStrongEnough(password)) newErrors.password = "Password doesn't meet the requirements below";
    if (!confirm || confirm !== password) newErrors.confirm = "Passwords don't match";
    if (!agreed) newErrors.agreed = "You must accept the Terms to continue";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    signup(
      { email: email.trim(), password, password_confirmation: confirm },
      {
        onSuccess: () => { setTimeout(() => goToPortal("/app/home", { replace: false }), 300); },
        // the API client throws ApiError(message) — it has no axios-style .response,
        // so reading that always fell back to the generic text and hid the real reason
        onError: (error: any) => {
          setErrors({ submit: error?.message || error?.body?.message || "Signup failed. Please try again." });
        },
      }
    );
  };

  return (
    <AuthShell>
      <AuthTabs active="signup" />

      <h1 className="font-display font-semibold text-2xl text-[#0f1013] mb-1">Create your account</h1>
      <p className="text-[#6B6F76] text-sm mb-6">Get a number in minutes. No name or username needed.</p>

      {errors.submit && <Banner tone="danger" icon={<AlertIcon />}>{errors.submit}</Banner>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput id="signup-email" label="Email" icon={<MailIcon />} type="email" autoComplete="email"
          value={email} onChange={(v) => { setEmail(v); clear("email"); }}
          placeholder="you@example.com" error={errors.email} />

        <div>
          <AuthInput id="signup-password" label="Password" icon={<LockIcon />} type="password" autoComplete="new-password"
            value={password} onChange={(v) => { setPassword(v); clear("password"); }}
            placeholder="Create a password" error={errors.password}
            reveal={{ shown: showPassword, toggle: () => setShowPassword((s) => !s) }} />
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs" aria-label="Password requirements">
            <Requirement met={checks.len}>8+ characters</Requirement>
            <Requirement met={checks.upper}>One uppercase</Requirement>
            <Requirement met={checks.lower}>One lowercase</Requirement>
            <Requirement met={checks.num}>One number</Requirement>
          </ul>
        </div>

        {/* shares the password field's show/hide toggle */}
        <AuthInput id="signup-confirm" label="Confirm password" icon={<LockIcon />} type="password" autoComplete="new-password"
          value={confirm} onChange={(v) => { setConfirm(v); clear("confirm"); }}
          placeholder="Re-enter your password" error={errors.confirm}
          reveal={{ shown: showPassword, toggle: () => setShowPassword((s) => !s) }} />

        <div className="pt-1">
          <label htmlFor="signup-terms" className="flex items-start gap-2.5 text-sm text-[#6B6F76] cursor-pointer">
            <input id="signup-terms" type="checkbox" checked={agreed}
              onChange={(e) => { setAgreed(e.target.checked); clear("agreed"); }}
              aria-invalid={!!errors.agreed} aria-describedby={errors.agreed ? "signup-terms-error" : undefined}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#2155f5]" />
            <span className="leading-snug">
              I agree to the <Link href="/terms-of-service" className={legal}>Terms of Service</Link> and <Link href="/privacy-policy" className={legal}>Privacy Policy</Link>.
            </span>
          </label>
          <FieldError id="signup-terms-error">{errors.agreed}</FieldError>
        </div>

        <div className="pt-2">
          <SubmitButton loading={isSignupLoading} loadingText="Creating account…">Create account</SubmitButton>
        </div>
      </form>

      <SocialAuthButtons action="Sign up" />

      <p className="mt-6 text-center text-sm text-[#6B6F76]">
        Already have an account? <Link href="/auth/signin" replace className="text-[#2155f5] hover:underline font-medium">Sign in</Link>
      </p>
    </AuthShell>
  );
}

export { SignInPage, SignUpPage };
