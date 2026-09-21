import { api } from "./client";

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

// Purchase a virtual number
export async function buyNumber(data) {
  return api.post("/user/purchase-number", data);
}

// Get extension plans and pricing for a number
export async function getNumberExtensionPlans(numberId) {
  try {
    console.log("Fetching renewal plans for number:", numberId);
    const numbers = await getNumbers();
    const number = numbers.find(n => n.id === numberId);

    if (!number) {
      throw new Error("Number not found");
    }

    // Map type to mobile_number_type_id: "private" → 2, "shared" → 1
    let typeId = number?.mobile_number_type_id;
    if (!typeId) {
      const typeStr = (number?.type || "").toLowerCase();
      typeId = typeStr.includes("private") ? 2 : 1;
    }

    console.log("Number type mapping:", { type: number?.type, typeId });

    const response = await api.post(`/user/extent-number-price`, {
      mobile_number_id: numberId,
      mobile_number_type_id: typeId
    });

    console.log("Renewal plans response:", response);

    if (response?.plans && Array.isArray(response.plans)) {
      console.log("✓ Got renewal plans:", response.plans);
      return response.plans;
    }

    return [];
  } catch (err) {
    console.error("Renewal plans error:", err.message);
    // Return empty array on error - modal will use fallback pricing
    return [];
  }
}

// Extend a number
export async function extendNumber(numberId, { plan }) {
  try {
    console.log("Extending number:", numberId, { plan });
    const numbers = await getNumbers();
    const number = numbers.find(n => n.id === numberId);
    return api.post(`/user/extent-number`, {
      mobile_number_id: numberId,
      mobile_number_type_id: number?.mobile_number_type_id || 1,
      plan: plan
    });
  } catch (err) {
    console.error("Extend error:", err.status, err.body, err.message);
    throw new Error(`Number extension failed: ${err.body?.message || err.message}`);
  }
}

// Release/delete a number
export async function releaseNumber(numberId) {
  try {
    console.log("Releasing number:", numberId);
    const numbers = await getNumbers();
    const number = numbers.find(n => n.id === numberId);
    return api.post(`/user/cancel-number`, {
      mobile_number_id: numberId,
      mobile_number_type_id: number?.mobile_number_type_id || 1
    });
  } catch (err) {
    console.error("Release error:", err.status, err.body, err.message);
    throw new Error(`Number release failed: ${err.body?.message || err.message}`);
  }
}

// Rename/label a number
export async function renameNumber(numberId, label) {
  try {
    console.log("Renaming number:", numberId, { label });
    const numbers = await getNumbers();
    const number = numbers.find(n => n.id === numberId);

    if (!number) {
      throw new Error("Number not found");
    }

    // Determine type: "private" or "shared"
    const type = number.type === "private" ? "private" : "shared";

    return api.post(`/user/set-label`, {
      number_id: numberId,
      type: type,
      label: label || null
    });
  } catch (err) {
    console.error("Rename error:", err.status, err.body, err.message);
    throw new Error(`Failed to rename number: ${err.body?.message || err.message}`);
  }
}

// Transfer a number to another user
export async function transferNumber(numberId, toZedId) {
  try {
    console.log("Transferring number:", numberId, { recipient: toZedId });
    const numbers = await getNumbers();
    const number = numbers.find(n => n.id === numberId);
    return api.post(`/user/number-transfer`, {
      mobile_number_id: numberId,
      mobile_number_type_id: number?.mobile_number_type_id || 1,
      recipient: toZedId
    });
  } catch (err) {
    console.error("Transfer error:", err.status, err.body, err.message);
    throw new Error(`Number transfer failed: ${err.body?.message || err.message}`);
  }
}

// Update auto-renew setting
export async function updateAutoRenew(numberId, enabled) {
  try {
    console.log("Updating auto-renew:", numberId, { auto_renew: enabled });
    const numbers = await getNumbers();
    const number = numbers.find(n => n.id === numberId);
    return api.post(`/user/auto-renew`, {
      mobile_number_id: numberId,
      mobile_number_type_id: number?.mobile_number_type_id || 1,
      auto_renew: enabled ? 1 : 0
    });
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

// Get available mobile number countries
export async function getMobileCountries() {
  return api.get("/mobile-number-countries");
}

// Get mobile number providers
export async function getMobileProviders() {
  return api.get("/mobile-number-providers");
}

// Get specific mobile provider details
export async function getMobileProvider(providerId) {
  return api.get(`/mobile-number-providers/${providerId}`);
}

// Get mobile rent times
export async function getMobileRentTimes() {
  return api.get("/mobile-number-rent-times");
}

// Get private number countries
export async function getPrivateCountries() {
  return api.get("/private-number-countries");
}

// Get private number plans
export async function getPrivatePlans(countryId) {
  return api.get("/private-number-plans", { params: { country_id: countryId } });
}

// Get available Telnyx numbers
export async function getTelnyxNumbers(params) {
  return api.get("/telnyx/available-numbers", { params });
}

// Get available cloud numbers
export async function getCloudNumbers(params) {
  return api.get("/cloud-numbers/available", { params });
}

// Get available numbers (POST)
export async function getAvailableNumbers(data) {
  return api.post("/get-numbers", data);
}
