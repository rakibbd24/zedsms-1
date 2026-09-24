import { api } from "./client";

/**
 * Fetch current user balance
 * Called by useBalance hook for real-time updates
 * Includes 4 decimal places precision from backend
 */
export async function getBalance() {
  const res = await api.get("/user/balance");
  if (res?.balance !== undefined) {
    return {
      balance: parseFloat(res.balance),
      timestamp: new Date().toISOString(),
    };
  }
  throw new Error(res?.message || "Failed to fetch balance");
}

/**
 * Fetch user dashboard data including balance
 * Returns full user profile with mobile numbers, balance, etc.
 */
export async function getDashboard() {
  const res = await api.get("/user/dashboard");
  if (res?.data) {
    return {
      ...res.data,
      balance: parseFloat(res.data.balance || 0),
    };
  }
  throw new Error(res?.message || "Failed to fetch dashboard");
}

/**
 * Fetch transaction history (paginated)
 * Page 1 by default, returns 20 items per page
 */
export async function getTransactions(page = 1) {
  const res = await api.get(`/user/my-transactions?page=${page}`);
  if (res?.data) {
    return {
      data: res.data,
      meta: res.meta || {},
      links: res.links || {},
    };
  }
  throw new Error(res?.message || "Failed to fetch transactions");
}

/**
 * Fetch recent activity (latest 8 entries)
 * Used for quick activity display on dashboard
 */
export async function getRecentActivity() {
  const res = await api.get("/user/recent-activity");
  if (res?.data) {
    return res.data;
  }
  throw new Error(res?.message || "Failed to fetch recent activity");
}

/**
 * Fetch activity with cursor-based pagination
 * afterId: Start from specific ID (for infinite scroll)
 * limit: Number of items (default 100, max 200)
 */
export async function getActivitySync(afterId = 0, limit = 100) {
  const res = await api.get(
    `/user/recent-activity/sync?after_id=${afterId}&limit=${Math.min(limit, 200)}`
  );
  if (res?.data !== undefined) {
    return {
      data: res.data || [],
      nextCursor: res.next_cursor || afterId,
      hasMore: res.has_more || false,
    };
  }
  throw new Error(res?.message || "Failed to fetch activity sync");
}

/**
 * Transfer balance to another user
 * Recipient can be email or zedsms_id
 */
export async function transferBalance(amount, recipient) {
  const res = await api.post("/user/balance-transfer", {
    amount: parseFloat(amount),
    recipient: recipient.trim(),
  });

  if (res?.status === false) {
    // Backend returns { status: false, code: X, message: "..." }
    const errorMessages = {
      0: "Insufficient balance",
      2: "User not found",
      3: "Cannot transfer to yourself",
    };
    throw new Error(errorMessages[res.code] || res.message || "Transfer failed");
  }

  return res;
}

/**
 * Fetch user profile (includes balance from login response)
 * Used to get full user data during session
 */
export async function getUserProfile() {
  const res = await api.get("/user/profile");
  if (res?.data) {
    return {
      ...res.data,
      balance: parseFloat(res.data.balance || 0),
    };
  }
  throw new Error(res?.message || "Failed to fetch profile");
}
