// One-shot data handed from one page to the next during sign-in: the 2FA challenge for
// /auth/verify-otp, or a notice for /auth/signin ("Telegram sign-in was cancelled.").
//
// Replaces react-router's navigation `state` (Next.js's router has no equivalent), so it
// works the same before and after the migration. It behaves like router state did:
//   - tied to the destination path — another page never sees it
//   - read once on arrival, then cleared — a reload starts over, as before
//   - this tab only (sessionStorage), and dropped after NAV_STATE_TTL_MS
const KEY = "zedsms-nav-state";
const NAV_STATE_TTL_MS = 10 * 60 * 1000;

type Entry = { path: string; data: unknown; at: number };

const read = (): Entry | null => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

/** Leave data for the page at `path`; call right before navigating there. */
export function setNavState(path: string, data: Record<string, unknown>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, data, at: Date.now() }));
  } catch {
    /* storage unavailable — the target page falls back to its no-state behaviour */
  }
}

/** Data left for `path`, or null. Doesn't clear it — pair with clearNavState(path) in an effect. */
export function readNavState<T>(path: string): T | null {
  const e = read();
  if (!e || e.path !== path || Date.now() - e.at > NAV_STATE_TTL_MS) return null;
  return e.data as T;
}

/** Drop the data left for `path` (once the page has taken it). */
export function clearNavState(path: string) {
  const e = read();
  if (e && e.path === path) {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  }
}
