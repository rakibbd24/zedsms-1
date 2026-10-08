// Google sign-in by redirect (OpenID Connect implicit flow, response_type=id_token).
//
// Google's ready-made Identity Services button can't be styled: once it knows the account it
// turns into a "Sign in as …" card, and it refuses clicks when hidden behind our own button.
// So our button sends the browser to Google's consent screen, and /auth/google/callback reads
// the id_token Google returns in the URL fragment. It's the same JWT the button issued (bound
// to our client id), so the backend's /app/social/google check is unchanged.
//
// Google Cloud → this OAuth client → Authorised redirect URIs must list
// <origin>/auth/google/callback for every origin the site runs on.
const KEY = "zedsms-google-oidc";

const randomString = (bytes = 24) => {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** Sends the browser to Google's consent screen. */
export function startGoogleSignIn(clientId: string) {
  const state = randomString(16);
  const nonce = randomString(16);
  sessionStorage.setItem(KEY, JSON.stringify({ state, nonce }));
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/google/callback`,
    response_type: "id_token",
    scope: "openid email profile",
    state,
    nonce,
    prompt: "select_account",
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

const jwtPayload = (jwt: string) => {
  try {
    const part = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
};

/**
 * Reads Google's answer from the callback URL fragment. Returns the id_token, or an error
 * ("cancelled" when the user backed out). Checks state and nonce so a token can't be
 * injected from another tab or replayed; the backend verifies the signature and audience.
 */
export function readGoogleCallback(hash: string): { idToken: string } | { error: "cancelled" | "failed" } {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  let saved: { state?: string; nonce?: string } = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    /* treated as a mismatch below */
  }

  if (params.get("error")) return { error: params.get("error") === "access_denied" ? "cancelled" : "failed" };
  const idToken = params.get("id_token");
  if (!idToken || !saved.state || params.get("state") !== saved.state) return { error: "failed" };
  if (jwtPayload(idToken)?.nonce !== saved.nonce) return { error: "failed" };
  return { idToken };
}

/** Forget the attempt once it has been used. */
export function clearGoogleSignIn() {
  sessionStorage.removeItem(KEY);
}
