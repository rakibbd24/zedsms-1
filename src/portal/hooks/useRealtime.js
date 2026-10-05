import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectRealtime, disconnectRealtime, NOTIFICATION_EVENT, userChannel } from "../lib/realtime";
import { normalizeRecentMessage, RECENT_LIMIT } from "../api/messages";

// Which cached queries each broadcast makes stale. The payload's `type` is the
// notification class (e.g. "App\Notifications\NumberPurchaseNotification";
// the SMS ones send a bare class name), so match on the class name alone.
const SMS = [["recentMessages"], ["messages"], ["numbers"], ["recent-activity"]];
const NUMBERS = [["numbers"], ["balance"], ["transactions"], ["recent-activity"], ["me"]];
const BALANCE = [["balance"], ["transactions"], ["recent-activity"]];

const STALE_BY_TYPE = {
  SmsTransactionUpdatedNotification: SMS,
  CloudSmsReceivedNotification: SMS,
  NumberPurchaseNotification: NUMBERS,
  NumberCancelNotification: NUMBERS,
  NumberExtendNotification: NUMBERS,
  NumberTransferNotification: NUMBERS,
  BalanceTransferNotification: BALANCE,
  LowBalanceReminderNotification: BALANCE,
  TelnyxLowBalanceNotification: BALANCE,
};

const classNameOf = (type) => String(type || "").split("\\").pop();

const isPrivateNumber = (n) => {
  const typeId = Number(n?.mobile_number_type_id);
  if (typeId === 1 || typeId === 2) return typeId === 2;
  return String(n?.type || "").toLowerCase().includes("private");
};

/**
 * Put a live SMS straight into the cached lists so it shows instantly:
 *   ["messages", id, 1] first page of that number's thread (only if it's been opened)
 *   ["numbers"]       that number's message count
 *   ["recentMessages"] the latest-messages feed
 * Private numbers (Telnyx / CloudNumbering / Pivotel) are keyed by
 * virtual_number_id, shared ones by mobile_info_id — the same ids my-numbers
 * and /user/all-sms/{id} use. A refetch follows to reconcile with the server.
 */
// SMS ids already applied — a reconnect can redeliver an event, and counts
// must not go up twice. Bounded so a long session doesn't grow it forever.
const seenSms = new Set();
const SEEN_LIMIT = 500;

function applyLiveSms(qc, event) {
  if (event.sms_id != null) {
    if (seenSms.has(event.sms_id)) return;
    seenSms.add(event.sms_id);
    if (seenSms.size > SEEN_LIMIT) seenSms.delete(seenSms.values().next().value);
  }

  const isPrivate = !!event.virtual_number_id;
  const numberId = Number(isPrivate ? event.virtual_number_id : event.mobile_info_id) || null;

  // shaped like a row from /user/all-sms so the screens normalise it as usual
  const sms = {
    id: event.sms_id ?? `live-${Date.now()}`,
    sms_from: event.sms_from || "",
    sms_content: event.sms_content || "",
    created_at: new Date().toISOString(), // the backend's date_time carries a non-ISO "+04" suffix
    status: 0,
    virtual_number_id: event.virtual_number_id ?? null,
    mobile_info_id: event.mobile_info_id || null,
    com_port: event.com_port,
    sim_number: event.to_number,
    to_number: event.to_number,
  };
  const isNew = (list) => Array.isArray(list) && !list.some((m) => m.id === sms.id);

  if (numberId) {
    // my-numbers sends ids uncast (7 or "7" depending on the DB driver), and the
    // open thread is keyed by that value — so match every cached thread for this
    // number regardless of type, or the message only shows after a refetch
    // newest-first, so a new SMS only lands on page 1; later pages catch up on refetch
    qc.getQueryCache()
      .findAll({ queryKey: ["messages"] })
      .filter((q) => String(q.queryKey[1]) === String(numberId) && q.queryKey[2] === 1
        && (q.queryKey[3] == null || Number(q.queryKey[3]) === (isPrivate ? 2 : 1)))
      .forEach((q) => qc.setQueryData(q.queryKey, (old) => (isNew(old?.rows)
        ? { ...old, rows: [sms, ...old.rows], total: (old.total || 0) + 1 }
        : old)));

    qc.setQueryData(["numbers"], (old) => Array.isArray(old)
      ? old.map((n) => (Number(n.id) === numberId && isPrivateNumber(n) === isPrivate
        ? { ...n, total_sms_count: (Number(n.total_sms_count) || 0) + 1 }
        : n))
      : old);
  }

  // the Latest Messages feed is inbound only (see getRecentMessages)
  if (event.direction === "outgoing") return;
  qc.setQueryData(["recentMessages"], (old) => (isNew(old)
    ? [normalizeRecentMessage(sms), ...old].slice(0, RECENT_LIMIT)
    : old));
}

/**
 * Keeps the portal live for the signed-in user: subscribes to their private
 * channel and refreshes whatever each event touches, plus the bell feed.
 * `onEvent` (optional) receives every event, e.g. to show a toast.
 */
export function useRealtime(userId, onEvent) {
  const qc = useQueryClient();
  // latest callback without resubscribing when the caller re-renders
  const onEventRef = React.useRef(onEvent);
  React.useEffect(() => { onEventRef.current = onEvent; });

  React.useEffect(() => {
    const token = localStorage.getItem("zedsms-token");
    if (!userId || !token) return undefined;

    const echo = connectRealtime(token);
    const channelName = userChannel(userId);

    echo.private(channelName).listen(NOTIFICATION_EVENT, (event) => {
      const type = classNameOf(event?.type);
      // unknown types still refresh the numbers + balance: it's cheap and safe
      const stale = STALE_BY_TYPE[type] ?? (event?.sms_content !== undefined ? SMS : NUMBERS);

      if (stale === SMS) applyLiveSms(qc, event);

      stale.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
      qc.invalidateQueries({ queryKey: ["notifications"] });

      onEventRef.current?.({ ...event, type });
    });

    return () => {
      echo.leave(channelName);
      disconnectRealtime();
    };
  }, [userId, qc]);
}
