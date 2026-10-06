// Thin fetch wrapper. Every api/*.js module funnels network calls through this
// so auth headers, base URL, and error handling live in exactly one place.
import { env } from "../../lib/env";

const BASE_URL = env.apiBaseUrl;

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// The session is only ever read from localStorage (getMe never asks the server), so a
// token the backend has expired or revoked would leave the user "signed in" with every
// call failing. Any 401 on an authenticated request ends the session and sends them to
// sign in instead — once, however many requests fail together.
let sessionEnding = false;
function endExpiredSession() {
  if (sessionEnding) return;
  sessionEnding = true;
  localStorage.removeItem("zedsms-token");
  localStorage.removeItem("zedsms-user");
  window.location.replace("/auth/signin?expired=1");
}

export async function request(path, { method = "GET", body, headers, authRedirect = true, ...rest } = {}) {
  const token = localStorage.getItem("zedsms-token");
  // an absolute URL passes through (the few web endpoints that live outside /api)
  const res = await fetch(/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (res.status === 401 && token && authRedirect) endExpiredSession();
    throw new ApiError(data?.message || res.statusText, res.status, data);
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};
