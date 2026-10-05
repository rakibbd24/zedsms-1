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

