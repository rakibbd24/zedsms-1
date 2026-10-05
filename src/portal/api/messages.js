import { api } from "./client";

// Get all recent SMS messages (for dashboard)
export async function getRecentMessages() {
  try {
    const response = await api.get(`/user/all-sms`);

    // Extract messages array from nested structure
    let messages = [];
    if (response?.data?.data && Array.isArray(response.data.data)) {
      messages = response.data.data;
    } else if (Array.isArray(response?.data)) {
      messages = response.data;
    } else if (Array.isArray(response)) {
      messages = response;
    }

    // Latest Messages is an inbox: drop outbound (sent from a private number) before
    // limiting, so the feed still holds RECENT_LIMIT received messages
    return messages
      .filter((m) => m.direction !== "outgoing")
      .slice(0, RECENT_LIMIT)
      .map(normalizeRecentMessage);
  } catch (error) {
    console.error("Error fetching recent messages:", error);
    return [];
  }
}

export const RECENT_LIMIT = 10;

// One SMS row → the recent-messages shape. Shared with the realtime feed so a
// live SMS looks exactly like a fetched one.
export function normalizeRecentMessage(m) {
  return {
    id: m.id,
    from: m.sms_from || m.to_number || "Unknown",
    body: m.sms_content || m.message_body || m.body || "",
    // created_at is real UTC; date_time is labelled "+04" but for provider SMS it was
    // stamped in the server's UTC clock, so it reads 4h old — use it only as a fallback
    time: formatMessageTime(m.created_at || m.date_time || m.updated_at),
    code: m.code || "",
    unread: m.status === 0, // status 0 might indicate unread
    color: getServiceColor(m.com_port),
    letter: getServiceLetter(m.com_port),
    virtualNumberId: m.virtual_number_id,
    // the number this SMS arrived on, as the My Numbers screen selects it:
    // private numbers are virtual_numbers rows, shared ones mobile_infos rows
    numberUid: m.virtual_number_id ? `private:${m.virtual_number_id}`
      : m.mobile_info_id ? `shared:${m.mobile_info_id}`
      : null,
    direction: m.direction || "incoming",
    toNumber: m.to_number,
    fromNumber: m.sms_from,
    timestamp: m.created_at || m.date_time
  };
}

// Helper: Format message time to relative format
function formatMessageTime(dateStr) {
  if (!dateStr) return "now";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "now";
  }
}

// Helper: Get color for service/provider
function getServiceColor(comPort) {
  const colors = {
    pivotel_intl: "#FF6B6B",
    cloud_number: "#4ECDC4",
    telnyx: "#45B7D1",
    sms: "#96CEB4",
  };
  return colors[comPort] || "#95E1D3";
}

// Helper: Get letter for service/provider
function getServiceLetter(comPort) {
  const letters = {
    pivotel_intl: "P",
    cloud_number: "C",
    telnyx: "T",
    sms: "S",
  };
  return letters[comPort] || (comPort ? comPort[0].toUpperCase() : "?");
}

const MESSAGES_PER_PAGE = 20;

// One page of a number's SMS, newest first.
// GET /user/all-sms/{id}?page=N&per_page=20 → { message, data: <laravel paginator> }
// per_page is a hint: if the backend ignores it, its own page size is used.
// typeId (1 shared · 2 private) is sent too: ids are per table, so a shared and a
// private number can share one — the backend needs it to tell them apart.
export async function getMessages(numberId, page = 1, typeId) {
  const empty = { rows: [], page: 1, lastPage: 1, total: 0, perPage: MESSAGES_PER_PAGE };
  if (!numberId) return empty;
  try {
    const type = typeId === 1 || typeId === 2 ? `&mobile_number_type_id=${typeId}` : "";
    const res = await api.get(`/user/all-sms/${numberId}?page=${page}&per_page=${MESSAGES_PER_PAGE}${type}`);
    const paginator = res?.data && !Array.isArray(res.data) ? res.data : {};
    const rows = Array.isArray(paginator.data) ? paginator.data
      : Array.isArray(res?.data) ? res.data
      : Array.isArray(res) ? res
      : [];
    return {
      rows,
      page: paginator.current_page || page,
      lastPage: paginator.last_page || 1,
      total: paginator.total ?? rows.length,
      perPage: paginator.per_page || MESSAGES_PER_PAGE,
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return empty;
  }
}

