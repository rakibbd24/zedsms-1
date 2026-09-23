import { api } from "./client";

// Normalize user data from API response to app format
function normalizeUser(user) {
  return {
    ...user,
    // Ensure balance is a number
    balance: typeof user.balance === 'string' ? parseFloat(user.balance) : (user.balance || 0),
    // Map zedsms_id to zedId for consistency
    zedId: user.zedsms_id || user.id,
  };
}

// With 2FA on, /login issues no token: it answers 400 with
// { message: "Please Enter OTP.", data: { google2fa_enable: 1 } }.
// That's not a failure — the caller has to collect the authenticator code and
// finish through verifyMfa() using the returned challenge token — the password
// is used once here and never carried into the second step.
export async function login({ login, password }) {
  let res;
  try {
    res = await api.post("/login", { login, password });
  } catch (err) {
    if (err?.status === 400 && err?.body?.data?.google2fa_enable) {
      return {
        needsOtp: true,
        // short-lived challenge that stands in for the credentials at /login/mfa
        mfaToken: err.body.data.mfa_token || null,
        expiresIn: err.body.data.expires_in || 300,
        message: err.body.message || "Please enter the code from your authenticator app.",
      };
    }
    throw err;
  }
  if (res?.data?.token && res?.data?.user) {
    const normalizedUser = normalizeUser(res.data.user);
    localStorage.setItem("zedsms-token", res.data.token);
    localStorage.setItem("zedsms-user", JSON.stringify(normalizedUser));
    return { ...res.data, user: normalizedUser };
  }
  throw new Error(res?.message || "Login failed");
}

export async function signup({ email, password, password_confirmation }) {
  const res = await api.post("/register", {
    email,
    password,
    password_confirmation,
  });
  if (res?.data?.token && res?.data?.user) {
    const normalizedUser = normalizeUser(res.data.user);
    localStorage.setItem("zedsms-token", res.data.token);
    localStorage.setItem("zedsms-user", JSON.stringify(normalizedUser));
    return { ...res.data, user: normalizedUser };
  }
  throw new Error(res?.message || "Signup failed");
}

// Shared tail of every social sign-in: a token means done, a 400 carrying a
// challenge means the account has 2FA and the code screen comes next.
async function completeSocialLogin(path, body, failureMessage) {
  let res;
  try {
    res = await api.post(path, body);
  } catch (err) {
    if (err?.status === 400 && err?.body?.data?.mfa_required) {
      return {
        needsOtp: true,
        mfaToken: err.body.data.mfa_token || null,
        expiresIn: err.body.data.expires_in || 300,
        message: err.body.message || "Please enter the code from your authenticator app.",
      };
    }
    throw new Error(err?.body?.message || err?.message || failureMessage);
  }
  if (res?.data?.token && res?.data?.user) {
    const normalizedUser = normalizeUser(res.data.user);
    localStorage.setItem("zedsms-token", res.data.token);
    localStorage.setItem("zedsms-user", JSON.stringify(normalizedUser));
    return { ...res.data, user: normalizedUser };
  }
  throw new Error(res?.message || failureMessage);
}

// All three use the app/social endpoints, which the mobile apps share: each
// verifies a provider-signed credential server-side and checks it was issued
// for us. (The older /social/google takes an access token, which carries no
// audience — it stays only for the legacy dashboard.)

// `idToken` is the JWT from Google Identity Services; the backend checks its
// signature and that `aud` is our client id.
export async function loginWithGoogle({ idToken }) {
  return completeSocialLogin("/app/social/google", { id_token: idToken }, "Google sign-in failed");
}

// `identityToken` is the JWT from Sign in with Apple JS; Apple only sends the
// name on the very first authorization, so it's passed through when present.
export async function loginWithApple({ identityToken, name }) {
  return completeSocialLogin("/app/social/apple", { identity_token: identityToken, name }, "Apple sign-in failed");
}

// The Telegram Login Widget's signed payload, verified with the bot token.
export async function loginWithTelegram(payload) {
  return completeSocialLogin("/app/social/telegram", payload, "Telegram sign-in failed");
}

// Telegram OpenID Connect. Telegram supports the authorization-code flow only,
// and its token endpoint needs the client secret, so the browser hands the code
// to our backend and that does the exchange.
const TELEGRAM_PKCE_KEY = "zedsms-telegram-oidc";

const randomString = (bytes = 48) => {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// S256 challenge, so an intercepted code can't be redeemed without the verifier
async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Sends the browser to Telegram's consent screen.
export async function startTelegramOpenId({ clientId, redirectUri }) {
  const verifier = randomString();
  const state = randomString(16);
  sessionStorage.setItem(TELEGRAM_PKCE_KEY, JSON.stringify({ verifier, state, redirectUri }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile",
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: "S256",
  });

  window.location.assign(`https://oauth.telegram.org/auth?${params.toString()}`);
}

// Completes the flow after Telegram redirects back with ?code&state.
export async function finishTelegramOpenId({ code, state }) {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(TELEGRAM_PKCE_KEY) || "null"); } catch { /* unreadable */ }
  sessionStorage.removeItem(TELEGRAM_PKCE_KEY);

  if (!saved) throw new Error("This sign-in didn't start here. Please try again.");
  // state binds the redirect to the request we made — guards against CSRF
  if (saved.state !== state) throw new Error("Telegram sign-in could not be verified. Please try again.");

  return completeSocialLogin(
    "/app/social/telegram/callback",
    { code, code_verifier: saved.verifier, redirect_uri: saved.redirectUri },
    "Telegram sign-in failed"
  );
}

// Completes a 2FA login: trades the challenge from login() for an API token,
// with either an authenticator code or a one-time recovery code. Credentials
// are never sent twice and never held by the client between the steps.
export async function verifyMfa({ mfaToken, otp, recoveryCode }) {
  const res = await api.post("/login/mfa", {
    mfa_token: mfaToken,
    ...(recoveryCode ? { recovery_code: recoveryCode } : { otp }),
  });
  if (res?.data?.token && res?.data?.user) {
    const normalizedUser = normalizeUser(res.data.user);
    localStorage.setItem("zedsms-token", res.data.token);
    localStorage.setItem("zedsms-user", JSON.stringify(normalizedUser));
    return { ...res.data, user: normalizedUser };
  }
  throw new Error(res?.message || "OTP verification failed");
}

// ---- email verification ----

// Polled by the "check your inbox" screen while the user clicks the link
// elsewhere. 403 simply means "not yet".
export async function getEmailVerifyStatus() {
  try {
    const res = await api.get("/email/verify-status");
    if (res?.email_verified && res?.data?.user) {
      const normalizedUser = normalizeUser(res.data.user);
      localStorage.setItem("zedsms-user", JSON.stringify(normalizedUser));
      return { verified: true, user: normalizedUser };
    }
    return { verified: false, user: null };
  } catch (err) {
    return { verified: false, user: null };
  }
}

// Resend the verification email to the signed-in user's address.
export async function resendVerificationEmail() {
  const res = await api.post("/email/send-verification-email", {});
  return res?.message || "Verification link sent to your email address.";
}

// One-time token handed to the frontend by the backend's redirect after a link
// is followed; confirms the redirect really came from a completed verification.
export async function validateVerificationToken(token) {
  const res = await api.post("/validate-verification-token", { token });
  return !!res?.status;
}

// True when the sign-in attempt itself is dead (expired or too many wrong
// codes) — the user has to start again rather than retype a code.
export const isMfaChallengeExpired = (err) =>
  err?.status === 410 || err?.body?.code === "mfa_challenge_expired";

export async function getMe() {
  // User info is already available from login response
  // Data is cached in localStorage from login/signup
  const userJson = localStorage.getItem("zedsms-user");
  if (!userJson) return null;
  const user = JSON.parse(userJson);
  // Ensure normalization even if cached data is old
  return normalizeUser(user);
}

export function logout() {
  localStorage.removeItem("zedsms-token");
  localStorage.removeItem("zedsms-user");
}
