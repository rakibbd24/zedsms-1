import { api } from "./client";

// Notification channels — where incoming SMS and account alerts are delivered.
// Same endpoints as the legacy dashboard's Appearance.vue.
//
//   GET  /user/notification-channels                        → channels + per-number and per-event state
//   POST /user/notification-channel/add                     → { channel_id: 1 email | 2 telegram, account_identifier? }
//   POST /user/notification-channel/verify-email            → { verification_code, account_identifier }
//   POST /user/notification-channel/check-telegram          → { verification_code }
//   POST /user/notification-channel/remove                  → { id }
//   POST /user/notification-channel/update/mobile-numbers   → { account_identifier, notification_number: [id] }
//   POST /user/notification-channel/update/system-notifications → { account_identifier, system_notification_type: [id] }

export const CHANNEL_EMAIL = 1;
export const CHANNEL_TELEGRAM = 2;
export const TELEGRAM_BOT = "@zedsmsbot";

const msgOf = (err, fallback) =>
  err?.body?.message || err?.body?.errors?.account_identifier?.[0] || err?.message || fallback;

export async function getChannels() {
  const res = await api.get("/user/notification-channels");
  const rows = Array.isArray(res?.data) ? res.data : [];
  return rows.map((c) => ({
    id: c.id,
    channelId: Number(c.channel_id),
    type: Number(c.channel_id) === CHANNEL_TELEGRAM ? "telegram" : "email",
    account: c.account_identifier || (c.telegram_username ? `@${c.telegram_username}` : ""),
    telegramUsername: c.telegram_username || null,
    name: [c.first_name, c.last_name].filter(Boolean).join(" ") || null,
    verified: Number(c.status) === 1,
    // status 1 = this number/event is forwarded to this channel
    numbers: (c.notification_number || []).map((n) => ({ id: n.id, number: n.mobile_number, type: n.type, on: Number(n.status) === 1 })),
    events: (c.system_notification_type || []).map((e) => ({ id: e.id, name: e.name, on: Number(e.status) === 1 })),
  }));
}

// Email channels need the address up front; Telegram ones are claimed by sending
// the returned code to the bot, so they're created without an identifier.
export async function addChannel({ type, email }) {
  try {
    const body = type === "telegram"
      ? { channel_id: CHANNEL_TELEGRAM }
      : { channel_id: CHANNEL_EMAIL, account_identifier: email };
    const res = await api.post("/user/notification-channel/add", body);
    return { message: res?.message || "Channel added", verificationCode: res?.verification_code || null };
  } catch (err) {
    throw new Error(msgOf(err, "Could not add that channel"));
  }
}

export async function verifyEmailChannel({ email, code }) {
  try {
    const res = await api.post("/user/notification-channel/verify-email", {
      verification_code: Number(code),
      account_identifier: email,
    });
    if (!/verified/i.test(res?.message || "")) throw new Error(res?.message || "Invalid verification code");
    return res.message;
  } catch (err) {
    throw new Error(msgOf(err, "Invalid verification code"));
  }
}

// Polled while the user sends /add=<code> to the bot; not connected yet is a
// normal answer, so it comes back as { connected: false } rather than an error.
export async function checkTelegramConnected(code) {
  try {
    const res = await api.post("/user/notification-channel/check-telegram", { verification_code: String(code) });
    return { connected: /verified/i.test(res?.message || ""), message: res?.message || "" };
  } catch (err) {
    // an expired or unknown code answers 4xx — that's terminal, not "keep waiting"
    throw new Error(msgOf(err, "Could not check the Telegram connection"));
  }
}

export async function removeChannel(id) {
  try {
    const res = await api.post("/user/notification-channel/remove", { id });
    return res?.message || "Channel removed";
  } catch (err) {
    throw new Error(msgOf(err, "Could not remove that channel"));
  }
}

export async function updateChannelNumbers({ account, numberIds }) {
  try {
    const res = await api.post("/user/notification-channel/update/mobile-numbers", {
      account_identifier: account,
      notification_number: numberIds,
    });
    return res?.message || "Updated";
  } catch (err) {
    throw new Error(msgOf(err, "Could not update the numbers for this channel"));
  }
}

export async function updateChannelEvents({ account, eventIds }) {
  try {
    const res = await api.post("/user/notification-channel/update/system-notifications", {
      account_identifier: account,
      system_notification_type: eventIds,
    });
    return res?.message || "Updated";
  } catch (err) {
    throw new Error(msgOf(err, "Could not update the alerts for this channel"));
  }
}

// ---------------------------------------------------------------------------
// Notification feed (the bell) — Laravel database notifications.
//   GET  /user/notifications?page=N   → paginated, newest first
//   POST /user/notification/read      → { id }
//   POST /user/notification/read/all
// Each row carries its own payload in `data` ({ title, message }) and is unread
// while `read_at` is null.
// ---------------------------------------------------------------------------

export async function getNotifications(page = 1) {
  const res = await api.get(`/user/notifications?page=${page}`);
  const paginator = res?.data || {};
  const rows = Array.isArray(paginator.data) ? paginator.data : [];

  return {
    items: rows.map((n) => ({
      id: n.id,
      title: n.data?.title || "Notification",
      message: n.data?.message || "",
      readAt: n.read_at || null,
      createdAt: n.created_at || null,
    })),
    page: paginator.current_page || page,
    lastPage: paginator.last_page || 1,
    total: paginator.total ?? rows.length,
  };
}

export async function markNotificationRead(id) {
  const res = await api.post("/user/notification/read", { id });
  if (res?.status !== "success") throw new Error(res?.message || "Could not mark that as read");
  return res.message;
}

export async function markAllNotificationsRead() {
  const res = await api.post("/user/notification/read/all", {});
  if (res?.status !== "success") throw new Error(res?.message || "Could not mark everything as read");
  return res.message;
}
