import { api } from "./client";

// Account settings — same endpoints as the legacy dashboard's AccountSettings.vue.
// Response conventions differ per endpoint, so each call is unwrapped separately:
//   change-password  → { message: "success" | "<reason>" }
//   2fa              → { success: bool, message }
//   sessions/delete  → { status: "success" | "error", message }
//   email change     → { message } with 422 on failure

const msgOf = (err, fallback) =>
  err?.body?.message || (typeof err?.body?.data === "string" && err.body.data) || err?.message || fallback;

// ---- profile ----

export async function getProfile() {
  const res = await api.get("/user/profile");
  return res?.data || null;
}

// UserDetails fields; the avatar upload the backend also accepts needs multipart,
// which this JSON client doesn't send — the portal has no avatar picker yet.
export async function updateProfile({ phone, address, country, profession }) {
  try {
    const res = await api.post("/user/update-profile", { phone, address, country, profession });
    if (res?.message !== "success") throw new Error(res?.message || "Could not save your profile");
    return res.data;
  } catch (err) {
    throw new Error(msgOf(err, "Could not save your profile"));
  }
}

// ---- password ----

// Backend answers 200 with message "Current password does not match" on a wrong password.
export async function changePassword({ currentPassword, newPassword }) {
  try {
    const res = await api.post("/user/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    });
    if (res?.message !== "success") throw new Error(res?.message || "Could not change your password");
    return res;
  } catch (err) {
    throw new Error(msgOf(err, "Could not change your password"));
  }
}

// ---- email change (OTP to the new address, valid 10 minutes) ----

export async function requestEmailChange(email) {
  try {
    const res = await api.post("/user/update-email", { email });
    return res?.message || "OTP sent to your new email address.";
  } catch (err) {
    throw new Error(msgOf(err, "Could not start the email change"));
  }
}

export async function verifyEmailChange(otp) {
  try {
    const res = await api.post("/user/verify-email-change", { otp });
    return res?.message || "Email updated successfully.";
  } catch (err) {
    throw new Error(msgOf(err, "Could not verify the code"));
  }
}

// ---- login sessions ----

export async function getSessions() {
  const res = await api.get("/user/sessions");
  const rows = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
  return rows.map((t) => ({
    id: t.id,
    name: t.name || "Unknown device",
    lastUsed: t.last_used_at || null,
    createdAt: t.created_at || null,
  }));
}

export async function revokeSession(id) {
  try {
    const res = await api.post(`/user/sessions/revoke/${id}`, {});
    if (res?.status !== "success") throw new Error(res?.message || "Could not sign out that session");
    return res.message;
  } catch (err) {
    throw new Error(msgOf(err, "Could not sign out that session"));
  }
}

export async function revokeOtherSessions() {
  try {
    const res = await api.post("/user/sessions/revoke/others", {});
    if (res?.status !== "success") throw new Error(res?.message || "Could not sign out the other sessions");
    return res.message;
  } catch (err) {
    throw new Error(msgOf(err, "Could not sign out the other sessions"));
  }
}

// ---- two-factor authentication ----

// The QR comes back as an inline SVG string built by the backend; `secret` is the
// key to type into an authenticator app by hand.
export async function get2fa() {
  const res = await api.get("/user/2fa");
  return {
    // the secret and QR are only returned while enrolling; once 2FA is on the
    // backend withholds them so a stolen token can't mint codes
    secret: res?.secret || "",
    qrSvg: res?.google2fa_url || "",
    enabled: !!res?.enabled,
    recoveryCodesRemaining: Number(res?.recovery_codes_remaining) || 0,
  };
}

// Issues a fresh secret (and disables 2FA until the new one is confirmed).
export async function generate2faSecret() {
  try {
    const res = await api.post("/user/2fa/generateSecret", {});
    if (!res?.success) throw new Error(res?.message || "Could not generate a secret");
    return res.message;
  } catch (err) {
    throw new Error(msgOf(err, "Could not generate a secret"));
  }
}

// `code` is the 6-digit code from the authenticator app (the API calls it `secret`).
// On success the backend returns one-time recovery codes — shown once, never again —
// and revokes every session, so the user signs in again through the 2FA flow.
export async function enable2fa(code) {
  try {
    const res = await api.post("/user/2fa/enable2fa", { secret: code });
    if (!res?.success) throw new Error(res?.message || "That code isn't valid");
    return { message: res.message, recoveryCodes: res.recovery_codes || [] };
  } catch (err) {
    throw new Error(msgOf(err, "That code isn't valid"));
  }
}

// Replaces the recovery codes; the previous set stops working immediately.
export async function regenerateRecoveryCodes(currentPassword) {
  try {
    const res = await api.post("/user/2fa/recovery-codes", { current_password: currentPassword });
    if (!res?.success) throw new Error(res?.message || "Could not generate new recovery codes");
    return res.recovery_codes || [];
  } catch (err) {
    throw new Error(msgOf(err, "Could not generate new recovery codes"));
  }
}

export async function disable2fa(currentPassword) {
  try {
    const res = await api.post("/user/2fa/disable2fa", { current_password: currentPassword });
    if (!res?.success) throw new Error(res?.message || "Could not disable two-factor authentication");
    return res.message;
  } catch (err) {
    throw new Error(msgOf(err, "Could not disable two-factor authentication"));
  }
}

// ---- danger zone ----

// Password re-auth for email/password accounts; social accounts re-auth differently
// on the backend, so a 403 there surfaces as its own message.
export async function deleteAccount(password) {
  try {
    const res = await api.post("/user/delete-account", { password });
    if (res?.status !== "success") throw new Error(res?.message || "Could not delete your account");
    return res.message;
  } catch (err) {
    throw new Error(msgOf(err, "Could not delete your account"));
  }
}
