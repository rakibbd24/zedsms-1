import { api } from "./client";

// Transaction history — the user's own account history rows (UserHistory),
// same endpoint the legacy dashboard's Transaction.vue used.
// GET /user/my-transactions?page=N → { message, data: <laravel paginator> }
//
// status: 0 Pending · 1 Complete · 2 Partial · 3 Declined
// amount_updates carries its own sign, e.g. "-2.70" (spent) or "+5" (added).
export const TRANSACTION_STATUS = {
  0: { label: "Pending", tone: "warning" },
  1: { label: "Complete", tone: "success" },
  2: { label: "Partial", tone: "accent" },
  3: { label: "Declined", tone: "danger" },
};

function normalizeTransaction(row) {
  const amount = parseFloat(String(row?.amount_updates ?? "").replace(/[^\d.+-]/g, "")) || 0;
  return {
    id: row?.id,
    date: row?.created_at || null,
    action: row?.action_name || "Activity",
    desc: row?.action_details || "",
    trxId: row?.trx_id || null,
    amount,
    status: Number(row?.status ?? 0),
  };
}

export async function getTransactions(page = 1) {
  const res = await api.get(`/user/my-transactions?page=${page}`);
  const paginator = res?.data || {};
  const rows = Array.isArray(paginator.data) ? paginator.data : Array.isArray(res?.data) ? res.data : [];
  return {
    rows: rows.map(normalizeTransaction),
    page: paginator.current_page || page,
    perPage: paginator.per_page || rows.length,
    total: paginator.total ?? rows.length,
    lastPage: paginator.last_page || 1,
  };
}

// Transfer balance to another ZEDSMS wallet.
// Same contract as the legacy dashboard: recipient is an email or a numeric
// ZEDSMS ID, and failures ("User not found", "Insufficient balance", …) come
// back as HTTP 200 with status false.
export async function transferBalance({ recipient, amount }) {
  const res = await api.post("/user/balance-transfer", {
    recipient: String(recipient || "").trim(),
    amount
  });
  if (res?.status !== true) {
    throw new Error(res?.message || "Transfer failed");
  }
  return res;
}
