import { api } from "./client";

// Buy-number flow — same endpoints and payloads as the legacy dashboard
// (BuyNumber.vue + Payment.vue), with responses normalized for the portal.
//
//   Shared  (mobile_number_type_id 1)
//     GET  /mobile-number-countries            → countries
//     GET  /mobile-number-providers/{country}  → services + per-day price/discounts
//     POST /get-numbers                        → free numbers for country+service
//     GET  /mobile-number-rent-times           → 1 Week / 2 Week / 1 Month
//     POST /user/purchase-number { mobile_number_id, mobile_number_type_id: 1, rent_time_id }
//
//   Private (mobile_number_type_id 2)
//     GET  /private-number-countries           → countries with a price table
//     GET  /telnyx/available-numbers  (US, CA)   ┐
//     GET  /pivotel/available-numbers (AU)       ├ pick a specific number
//     GET  /cloud-numbers/available   (others)   ┘
//     GET  /private-number-plans?country_id    → plans (id is the rent_time_id)
//     POST /user/purchase-number { mobile_number_type_id: 2, rent_time_id, phone_number | number_sid }

const ASSET_BASE = "https://control.zedsms.com/";

const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return s ? `?${s}` : "";
};

// Every endpoint answers { message: "success", data } — anything else carries the reason in data.
const unwrap = (res, fallback) => {
  if (res?.message !== "success") {
    throw new Error(typeof res?.data === "string" ? res.data : fallback);
  }
  return res.data;
};

// Non-2xx replies (503 provider down, 500 upstream failure) come through ApiError
// with the human-readable reason in body.data.
const reasonOf = (err, fallback) =>
  (typeof err?.body?.data === "string" && err.body.data) || err?.message || fallback;

export const assetUrl = (path) => {
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : ASSET_BASE + String(path).replace(/^\//, "");
};

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// Countries are listed UK → USA → Canada → Australia, then everything else A–Z.
const COUNTRY_ORDER = ["gb", "us", "ca", "au"];
const byCountryOrder = (a, b) => {
  const ra = COUNTRY_ORDER.indexOf(a.iso), rb = COUNTRY_ORDER.indexOf(b.iso);
  if (ra !== rb) return (ra === -1 ? Infinity : ra) - (rb === -1 ? Infinity : rb);
  return a.name.localeCompare(b.name);
};

// ---------------- shared ----------------

export async function getSharedCountries() {
  const data = unwrap(await api.get("/mobile-number-countries"), "Could not load countries");
  return (data || [])
    .map((c) => ({ id: c.id, name: c.name, iso: (c.iso || "").toLowerCase(), flag: assetUrl(c.flag) }))
    .sort(byCountryOrder);
}

// Services priced for this country. Services without a shared price can't be
// bought (purchase-number answers "Pricing not available"), so they're dropped.
export async function getSharedServices(countryId) {
  const data = unwrap(await api.get(`/mobile-number-providers/${countryId}`), "Could not load services");
  return (data || [])
    .map((s) => ({
      id: s.id,
      name: s.name,
      icon: assetUrl(s.icon),
      pricePerDay: num(s.price_per_day),
      discounts: { 7: num(s.discount_1) || 0, 14: num(s.discount_2) || 0, 30: num(s.discount_3) || 0 },
    }))
    .filter((s) => s.pricePerDay !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSharedNumbers({ countryId, serviceId }) {
  const data = unwrap(
    await api.post("/get-numbers", { country_id: countryId, service_provider_id: serviceId, mobile_number_type_id: 1 }),
    "Could not load numbers"
  );
  // numbers arrive masked; the id is what purchase-number needs
  return (data || []).map((n) => ({ id: n.id, number: n.mobile_number }));
}

// Rent times only expose { id, name }; the backend prices by rent_time.days, which
// maps from the name ("1 Week" → 7, "2 Week" → 14, "1 Month" → 30).
const daysFromName = (name) => {
  const m = String(name || "").toLowerCase().match(/(\d+)\s*(day|week|month)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return m[2] === "day" ? n : m[2] === "week" ? n * 7 : n * 30;
};

export async function getSharedRentTimes() {
  const data = unwrap(await api.get("/mobile-number-rent-times"), "Could not load rent periods");
  return (data || [])
    .map((r) => ({ id: r.id, name: r.name, days: daysFromName(r.name) }))
    .filter((r) => r.days)
    .sort((a, b) => a.days - b.days);
}

// Mirrors purchaseNumber(): price_per_day × days − the discount for 7/14/30 days.
export const sharedPriceOf = (service, days) => {
  if (!service || !days) return 0;
  const base = service.pricePerDay * days;
  const discount = service.discounts[days] || 0;
  return Math.max(0, Math.round((base - discount) * 100) / 100);
};

// ---------------- private ----------------

export async function getPrivateCountries() {
  const data = unwrap(await api.get("/private-number-countries"), "Could not load countries");
  return (data || [])
    .map((c) => ({ id: c.id, name: c.name, iso: (c.iso || "").toLowerCase() }))
    .sort(byCountryOrder);
}

// Which upstream sells numbers for a country. The backend routes the purchase by
// the plan's upstream column, which the plans endpoint doesn't expose — this
// mirrors that table: Telnyx for US/CA, Pivotel for AU, CloudNumbering otherwise.
export const privateUpstreamOf = (iso) => {
  const i = (iso || "").toUpperCase();
  if (i === "US" || i === "CA") return "telnyx";
  if (i === "AU") return "pivotel";
  return "cloud";
};

// Available numbers normalized to { key, number, detail, payload } where payload
// is exactly what purchase-number needs to buy that number.
export async function getPrivateAvailableNumbers({ iso, state, page = 0 }) {
  const upstream = privateUpstreamOf(iso);
  try {
    if (upstream === "telnyx") {
      const data = unwrap(
        await api.get(`/telnyx/available-numbers${qs({ country: iso.toUpperCase(), state, limit: 20 })}`),
        "Could not search numbers"
      );
      return (data || []).map((n) => ({
        key: n.phone_number,
        number: n.phone_number,
        detail: [n.city || n.rate_center, n.state].filter(Boolean).join(", "),
        payload: { phone_number: n.phone_number },
      }));
    }
    if (upstream === "pivotel") {
      const data = unwrap(await api.get(`/pivotel/available-numbers${qs({ page })}`), "Could not search numbers");
      return (data || []).map((n) => ({ key: n, number: n, detail: "", payload: { phone_number: n } }));
    }
    const data = unwrap(await api.get(`/cloud-numbers/available${qs({ limit: 20 })}`), "Could not search numbers");
    // the cloud pool isn't queried by country, so drop entries from other countries
    return (data || [])
      .filter((n) => !n.countryIso || n.countryIso.toLowerCase() === iso.toLowerCase())
      .map((n) => ({ key: n.sid, number: n.e164, detail: "", payload: { number_sid: n.sid } }));
  } catch (err) {
    throw new Error(reasonOf(err, "Could not search numbers"));
  }
}

const TERM_MONTHS = { MONTHLY: 1, QUARTERLY: 3, SIX_MONTHLY: 6, ANNUALLY: 12 };
const TERM_LABEL = { MONTHLY: "1 Month", QUARTERLY: "3 Months", SIX_MONTHLY: "6 Months", ANNUALLY: "12 Months" };

// Mirrors purchaseNumber(): total = monthly_fee × months for the term.
export async function getPrivatePlans(countryId) {
  const data = unwrap(await api.get(`/private-number-plans${qs({ country_id: countryId })}`), "Could not load plans");
  const plans = (data || [])
    .map((p) => {
      const terms = String(p.terms || "").toUpperCase();
      const months = TERM_MONTHS[terms] || 1;
      const monthlyFee = num(p.monthly_fee) || 0;
      return { id: p.id, terms, label: TERM_LABEL[terms] || p.terms, months, monthlyFee, total: Math.round(monthlyFee * months * 100) / 100 };
    })
    .sort((a, b) => a.months - b.months);
  // discount vs. paying the 1-month rate every month
  const base = plans.find((p) => p.months === 1)?.monthlyFee;
  return plans.map((p) => ({
    ...p,
    off: base && p.months > 1 && p.monthlyFee < base ? Math.round(((base - p.monthlyFee) / base) * 100) : 0,
  }));
}

// ---------------- purchase ----------------

export async function purchaseNumber(payload) {
  try {
    return unwrap(await api.post("/user/purchase-number", payload), "Purchase failed");
  } catch (err) {
    const e = new Error(reasonOf(err, "Purchase failed"));
    // 503 from the private flow means the picked number was taken / provider busy
    e.status = err?.status;
    throw e;
  }
}
