

// Format expiry date from timestamp
export const formatExpiryDate = (expiryTs) => {
  if (!expiryTs) return "Unknown";
  const date = new Date(expiryTs);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ---- reactivation (restore) of lapsed numbers ----
// A number that expires isn't released immediately: it sits in a grace window
// during which POST /user/restore-number brings it back on the same number.
// Past the deadline it's gone and the user has to buy a new one.
export const RESTORE_WINDOW_DAYS = 7;

export const isLapsed = (status) => status === "expired" || status === "disconnected";

export const restoreDeadlineOf = (expiryTs) => {
  if (!expiryTs) return null;
  const d = new Date(expiryTs);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + RESTORE_WINDOW_DAYS);
  return d;
};

export const restoreDaysLeftOf = (expiryTs) => {
  const deadline = restoreDeadlineOf(expiryTs);
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)));
};

export const termLabelOf = (terms) => {
  const t = (terms || "").toUpperCase();
  if (t === "MONTHLY") return "Monthly";
  if (t === "QUARTERLY") return "Quarterly";
  if (t === "SIX_MONTHLY") return "6 Months";
  if (t === "ANNUALLY") return "Annual";
  return terms;
};
