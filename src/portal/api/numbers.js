import { api } from "./client";

// my-numbers returns `type: "shared" | "private"` but no mobile_number_type_id,
// so derive the id the number endpoints expect: shared → 1, private → 2.
function numberTypeIdOf(number) {
  const id = Number(number?.mobile_number_type_id);
  if (id === 1 || id === 2) return id;
  return (number?.type || "").toLowerCase() === "private" ? 2 : 1;
}

// Shared and private numbers live in different tables, so an id alone is ambiguous
// (a shared and a private number can share one). Callers pass the type they already
// know from the list; the my-numbers lookup is only a fallback.
async function resolveTypeId(numberId, typeId) {
  if (typeId === 1 || typeId === 2) return typeId;
  const numbers = await getNumbers();
  const number = numbers.find((n) => n.id === numberId);
  if (!number) throw new Error("Number not found");
  return numberTypeIdOf(number);
}

// Endpoints signal failure in the body with HTTP 200: { message: "error", data }
// (most) or { status: false, message } (number-transfer).
function assertOk(res, fallback) {
  if (res?.status === false) throw new Error(res.message || fallback);
  if (typeof res?.message === "string" && res.message !== "success" && res.status !== true) {
    throw new Error(typeof res.data === "string" ? res.data : fallback);
  }
  return res;
}

// Get user's virtual numbers
export async function getNumbers() {
  try {
    console.log("Fetching numbers...");
    const token = localStorage.getItem("zedsms-token");

    // Use the web endpoint directly (it's at /web/user/my-numbers, not /api/web/user/my-numbers)
    const response = await fetch(`https://control.zedsms.com/web/user/my-numbers?paginate=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("Numbers response:", data);

    // API returns: { status, data: { numbers: [...], pagination: {...} } }
    if (data?.data?.numbers && Array.isArray(data.data.numbers)) {
      console.log("✓ Got numbers:", data.data.numbers.length);
      return data.data.numbers;
    }

    console.log("No numbers array found in response");
    return [];
  } catch (error) {
    console.error("Error fetching numbers:", error);
    return [];
  }
}

// Get SMS messages for a specific number
export async function getNumberMessages(numberId) {
  if (!numberId) return [];
  try {
    const response = await api.get(`/user/all-sms/${numberId}`);
    // API returns paginated response
    if (response?.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) return response.data;
    return [];
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

// Get extension plans and pricing for a number
export async function getNumberExtensionPlans(numberId, typeId) {
  try {
    const response = await api.post(`/user/extent-number-price`, {
      mobile_number_id: numberId,
      mobile_number_type_id: await resolveTypeId(numberId, typeId)
    });
    if (response?.plans && Array.isArray(response.plans)) return response.plans;
    return [];
  } catch (err) {
    console.error("Renewal plans error:", err.message);
    // Return empty array on error - modal shows "plans not available"
    return [];
  }
}

// Extend a number
export async function extendNumber(numberId, { plan, typeId }) {
  try {
    const res = await api.post(`/user/extent-number`, {
      mobile_number_id: numberId,
      mobile_number_type_id: await resolveTypeId(numberId, typeId),
      rent_time_id: plan
    });
    // rejections (insufficient balance, 6-month limit, …) come back as 200 + message "error"
    return assertOk(res, "Extension failed");
  } catch (err) {
    console.error("Extend error:", err.status, err.body, err.message);
    throw new Error(`Number extension failed: ${err.body?.message || err.message}`);
  }
}

// Price to restore an expired number — call before restore-number so the user
// sees exactly what will be charged. total = monthly_fee + restore_fee (USD).
// Ineligible numbers (still active, past the 7-day window, unsupported carrier,
// no pricing) come back as HTTP 200 with message "error" and the reason in data.
export async function getRestoreNumberPrice(numberId) {
  const res = await api.post(`/user/restore-number-price`, {
    mobile_number_id: numberId
  });
  if (res?.message !== "success") {
    throw new Error(typeof res?.data === "string" ? res.data : "Could not load the restore price");
  }
  return {
    monthlyFee: parseFloat(res.monthly_fee) || 0,
    restoreFee: parseFloat(res.restore_fee) || 0,
    total: parseFloat(res.total) || 0
  };
}

// Restore an expired number inside its post-expiry grace window.
// POST /user/restore-number with only the number id — the backend charges the
// total quoted by restore-number-price from the wallet. A failed restore still
// returns 200 with message !== "success".
export async function restoreNumber(numberId) {
  try {
    console.log("Restoring number:", numberId);
    const res = await api.post(`/user/restore-number`, {
      mobile_number_id: numberId
    });
    if (res?.message && res.message !== "success") {
      throw new Error(typeof res.data === "string" ? res.data : "Restore failed");
    }
    return res;
  } catch (err) {
    console.error("Restore error:", err.status, err.body, err.message);
    throw new Error(`Number restore failed: ${err.body?.message || err.message}`);
  }
}

// Release/delete a number
export async function releaseNumber(numberId, typeId) {
  try {
    const res = await api.post(`/user/cancel-number`, {
      mobile_number_id: numberId,
      mobile_number_type_id: await resolveTypeId(numberId, typeId)
    });
    return assertOk(res, "Release failed");
  } catch (err) {
    console.error("Release error:", err.status, err.body, err.message);
    throw new Error(`Number release failed: ${err.body?.message || err.message}`);
  }
}

// Rename/label a number
export async function renameNumber(numberId, label, typeId) {
  try {
    const resolved = await resolveTypeId(numberId, typeId);
    // set-label wants the type as a word, and fails with a proper 4xx
    return await api.post(`/user/set-label`, {
      number_id: numberId,
      type: resolved === 2 ? "private" : "shared",
      label: label || null
    });
  } catch (err) {
    console.error("Rename error:", err.status, err.body, err.message);
    throw new Error(`Failed to rename number: ${err.body?.message || err.message}`);
  }
}

// Transfer a number to another user
export async function transferNumber(numberId, toZedId, typeId) {
  try {
    const res = await api.post(`/user/number-transfer`, {
      mobile_number_id: numberId,
      mobile_number_type_id: await resolveTypeId(numberId, typeId),
      recipient: toZedId
    });
    // "User not found", "You cannot transfer to yourself", … arrive as 200 + status false
    return assertOk(res, "Transfer failed");
  } catch (err) {
    console.error("Transfer error:", err.status, err.body, err.message);
    throw new Error(`Number transfer failed: ${err.body?.message || err.message}`);
  }
}

// Update auto-renew setting
export async function updateAutoRenew(numberId, enabled, typeId) {
  try {
    const res = await api.post(`/user/auto-renew`, {
      mobile_number_id: numberId,
      mobile_number_type_id: await resolveTypeId(numberId, typeId),
      auto_renew: enabled ? 1 : 0
    });
    // rejections (expired number, not the owner, …) come back as 200 + message "error"
    return assertOk(res, "Auto-renew update failed");
  } catch (err) {
    console.error("Auto-renew error:", err.status, err.body, err.message);
    throw new Error(`Failed to update auto-renew: ${err.body?.message || err.message}`);
  }
}

// Send SMS from a number
export async function sendSmsFromNumber(numberId, { to, body }) {
  try {
    return api.post(`/user/send-sms/${numberId}`, { to, message: body });
  } catch (err) {
    throw new Error("Failed to send SMS");
  }
}
