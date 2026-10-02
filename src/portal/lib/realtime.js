import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Live updates over Laravel Reverb (Pusher protocol), same setup as the legacy
// dashboard: one private channel per user, `zedsms.{userId}`, carrying the
// backend's broadcast notifications (new SMS, number bought / cancelled /
// extended / transferred, balance changes).
//
// The Reverb key is public (it only identifies the app); the private channel is
// authorised per user through /broadcasting/auth with the portal's bearer token.

const env = import.meta.env;
const API_BASE = env.VITE_API_BASE_URL || "";

const CONFIG = {
  key: env.VITE_REVERB_APP_KEY || "p2wlngweboszvivkxtlw",
  host: env.VITE_REVERB_HOST || "control.zedsms.com",
  port: Number(env.VITE_REVERB_PORT || 443),
  scheme: env.VITE_REVERB_SCHEME || "https",
};

// Laravel wraps every broadcast notification in this event; the leading dot
// tells Echo not to prefix it with the App\Events namespace.
export const NOTIFICATION_EVENT = ".Illuminate\\Notifications\\Events\\BroadcastNotificationCreated";

export const userChannel = (userId) => `zedsms.${userId}`;

let echo = null;
let echoToken = null;

/** One shared connection; rebuilt only when the signed-in token changes. */
export function connectRealtime(token) {
  if (echo && echoToken === token) return echo;
  disconnectRealtime();

  window.Pusher = Pusher; // Echo's reverb/pusher connectors look for it here
  const tls = CONFIG.scheme === "https";

  echo = new Echo({
    broadcaster: "reverb",
    key: CONFIG.key,
    wsHost: CONFIG.host,
    wsPort: CONFIG.port,
    wssPort: CONFIG.port,
    forceTLS: tls,
    // Both are needed: pusher-js runs secure sockets over its "ws" transport
    // (forceTLS picks wss://) — allowing only "wss" leaves it nothing to connect with.
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${API_BASE}/broadcasting/auth`,
    auth: { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
  });
  echoToken = token;

  if (import.meta.env.DEV) {
    const conn = echo.connector.pusher.connection;
    conn.bind("connected", () => console.info("[realtime] connected"));
    conn.bind("error", (err) => console.warn("[realtime] connection error", err));
  }

  return echo;
}

export function disconnectRealtime() {
  if (!echo) return;
  echo.disconnect();
  echo = null;
  echoToken = null;
}
