import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import SocialAuthButtons from "../components/SocialAuthButtons";
import Footer from "../components/Footer";
import { useAuth } from "../portal/hooks/useAuth";

const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const pwChecks = (p: string) => ({
  len: p.length >= 8,
  upper: /[A-Z]/.test(p),
  lower: /[a-z]/.test(p),
  num: /[0-9]/.test(p),
});
const pwStrongEnough = (p: string) => Object.values(pwChecks(p)).every(Boolean);

// ============ SIGN IN PAGE ============
function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // set when the 2FA step sends the user back (challenge expired or used up)
  const notice = (location.state as { notice?: string } | null)?.notice;
  const { login, isLoginLoading, loginError } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [attempts, setAttempts] = React.useState(0);
  const locked = attempts >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || isLoginLoading) return;

    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required";
    else if (!emailValid(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      await new Promise<void>((resolve, reject) => {
        login(
          { login: email, password },
          {
            onSuccess: (result: any) => {
              // 2FA account: no token yet — finish on the OTP screen, carrying the
              // credentials in router state (verifyOtp re-checks them) and never storing them
              if (result?.needsOtp) {
                // carry only the short-lived challenge, never the password
                navigate("/auth/verify-otp", { state: { mfaToken: result.mfaToken, email }, replace: true });
              } else {
                setTimeout(() => navigate("/app/home"), 300);
              }
              resolve();
            },
            onError: (error: any) => {
              setAttempts((a) => a + 1);
              const remaining = 3 - attempts - 1;
              if (remaining > 0) {
                setErrors({ submit: `Incorrect email or password. ${remaining} attempt${remaining === 1 ? "" : "s"} left.` });
              } else {
                setErrors({ submit: "Too many attempts. Try again later." });
              }
              reject(error);
            },
          }
        );
      });
    } catch (err) {
      // Error handled in onError callback
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9fa] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#2155f5" />
            <path d="M16 8C11.58 8 8 11.58 8 16s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="white" />
          </svg>
          <span className="font-display font-semibold text-2xl text-[#0f1013]">ZEDSMS</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[20px] border border-[#e1e2e9] p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-[#f9f9fa] p-1 rounded-xl">
            <button className="flex-1 py-2.5 px-4 bg-white rounded-lg font-display font-medium text-sm text-[#0f1013] shadow-sm">
              Sign in
            </button>
            <button
              onClick={() => navigate("/auth/signup")}
              className="flex-1 py-2.5 px-4 rounded-lg font-display font-medium text-sm text-[#6B6F76] hover:text-[#0f1013] transition-colors"
            >
              Sign up
            </button>
          </div>

          <h1 className="font-display font-semibold text-2xl text-[#0f1013] mb-1">Welcome back</h1>
          <p className="text-[#6B6F76] text-sm mb-6">Sign in to manage your numbers and messages.</p>

          {locked && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm flex gap-3">
              <span className="text-lg">⏱️</span>
              <div>Too many failed attempts. Try again in 30 seconds.</div>
            </div>
          )}
          {notice && !errors.submit && (
            <div className="mb-4 p-4 rounded-lg bg-amber-50 text-amber-800 text-sm flex gap-3">
              <span className="text-lg">⏱️</span>
              <div>{notice}</div>
            </div>
          )}

          {!locked && errors.submit && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm flex gap-3">
              <span className="text-lg">⚠️</span>
              <div>{errors.submit}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6F76] mb-2">Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9CA1A9]">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={locked}
                  className={`w-full h-11 pl-12 pr-4 rounded-[11px] border text-sm font-sans transition-colors ${
                    errors.email ? "border-red-500 bg-red-50" : "border-[#E1E2E7] bg-white focus:border-[#2155f5] focus:ring-2 focus:ring-[#eef1fb]"
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-600 text-xs mt-1.5 flex gap-1"><span>ℹ️</span> {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6F76] mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9CA1A9]">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={locked}
                  className={`w-full h-11 pl-12 pr-12 rounded-[11px] border text-sm font-sans transition-colors ${
                    errors.password ? "border-red-500 bg-red-50" : "border-[#E1E2E7] bg-white focus:border-[#2155f5] focus:ring-2 focus:ring-[#eef1fb]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9CA1A9] hover:text-[#6B6F76]"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1.5 flex gap-1"><span>ℹ️</span> {errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={locked || isLoginLoading}
              className="w-full bg-[#2155f5] hover:bg-[#1a46d1] disabled:opacity-50 text-white font-display font-medium py-3 rounded-full transition-colors mt-6 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoginLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <SocialAuthButtons action="Sign in" />

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-[#6B6F76]">Don't have an account? </span>
            <button onClick={() => navigate("/auth/signup")} className="text-[#2155f5] hover:underline font-medium">
              Sign up
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#9CA1A9] mt-6">
          By continuing you agree to ZEDSMS's Terms of Service and Privacy Policy.
        </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ============ SIGN UP PAGE ============
function SignUpPage() {
  const navigate = useNavigate();
  const { signup, isSignupLoading, signupError } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const checks = pwChecks(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignupLoading) return;

    const newErrors: Record<string, string> = {};

    if (!email) newErrors.email = "Email is required";
    else if (!emailValid(email)) newErrors.email = "Enter a valid email";

    if (!password) newErrors.password = "Password is required";
    else if (!pwStrongEnough(password)) newErrors.password = "Password doesn't meet the requirements below";

    if (confirm !== password || !confirm) newErrors.confirm = "Passwords don't match";

    if (!agreed) newErrors.agreed = "You must accept the Terms to continue";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      await new Promise<void>((resolve, reject) => {
        signup(
          { email, password, password_confirmation: confirm },
          {
            onSuccess: () => {
              setTimeout(() => navigate("/app/home"), 300);
              resolve();
            },
            onError: (error: any) => {
              setErrors({ submit: error.response?.data?.message || "Signup failed. Please try again." });
              reject(error);
            },
          }
        );
      });
    } catch (err) {
      // Error handled in onError callback
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9fa] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#2155f5" />
            <path d="M16 8C11.58 8 8 11.58 8 16s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="white" />
          </svg>
          <span className="font-display font-semibold text-2xl text-[#0f1013]">ZEDSMS</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[20px] border border-[#e1e2e9] p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-[#f9f9fa] p-1 rounded-xl">
            <button
              onClick={() => navigate("/auth/signin")}
              className="flex-1 py-2.5 px-4 rounded-lg font-display font-medium text-sm text-[#6B6F76] hover:text-[#0f1013] transition-colors"
            >
              Sign in
            </button>
            <button className="flex-1 py-2.5 px-4 bg-white rounded-lg font-display font-medium text-sm text-[#0f1013] shadow-sm">
              Sign up
            </button>
          </div>

          <h1 className="font-display font-semibold text-2xl text-[#0f1013] mb-1">Create your account</h1>
          <p className="text-[#6B6F76] text-sm mb-6">Get a number in minutes. No name or username needed.</p>

          {errors.submit && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm flex gap-3">
              <span className="text-lg">⚠️</span>
              <div>{errors.submit}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6F76] mb-2">Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9CA1A9]">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full h-11 pl-12 pr-4 rounded-[11px] border text-sm font-sans transition-colors ${
                    errors.email ? "border-red-500 bg-red-50" : "border-[#E1E2E7] bg-white focus:border-[#2155f5] focus:ring-2 focus:ring-[#eef1fb]"
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-600 text-xs mt-1.5">ℹ️ {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6F76] mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9CA1A9]">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-11 pl-12 pr-12 rounded-[11px] border text-sm font-sans transition-colors ${
                    errors.password ? "border-red-500 bg-red-50" : "border-[#E1E2E7] bg-white focus:border-[#2155f5] focus:ring-2 focus:ring-[#eef1fb]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9CA1A9]"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1.5">ℹ️ {errors.password}</p>}

              {/* Password Requirements */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className={checks.len ? "text-green-600" : "text-[#9CA1A9]"}>✓ 8+ characters</div>
                <div className={checks.upper ? "text-green-600" : "text-[#9CA1A9]"}>✓ One uppercase</div>
                <div className={checks.lower ? "text-green-600" : "text-[#9CA1A9]"}>✓ One lowercase</div>
                <div className={checks.num ? "text-green-600" : "text-[#9CA1A9]"}>✓ One number</div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6F76] mb-2">Confirm password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9CA1A9]">🔒</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-11 pl-12 pr-4 rounded-[11px] border text-sm font-sans transition-colors ${
                    errors.confirm ? "border-red-500 bg-red-50" : "border-[#E1E2E7] bg-white focus:border-[#2155f5] focus:ring-2 focus:ring-[#eef1fb]"
                  }`}
                />
              </div>
              {errors.confirm && <p className="text-red-600 text-xs mt-1.5">ℹ️ {errors.confirm}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 text-sm text-[#6B6F76] mt-6">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 cursor-pointer accent-[#2155f5]"
              />
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>
            {errors.agreed && <p className="text-red-600 text-xs">ℹ️ {errors.agreed}</p>}

            <button
              type="submit"
              disabled={isSignupLoading}
              className="w-full bg-[#2155f5] hover:bg-[#1a46d1] disabled:opacity-50 text-white font-display font-medium py-3 rounded-full transition-colors mt-6 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSignupLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <SocialAuthButtons action="Sign up" />

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-[#6B6F76]">Already have an account? </span>
            <button onClick={() => navigate("/auth/signin")} className="text-[#2155f5] hover:underline font-medium">
              Sign in
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#9CA1A9] mt-6">
          By continuing you agree to ZEDSMS's Terms of Service and Privacy Policy.
        </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export { SignInPage, SignUpPage };
