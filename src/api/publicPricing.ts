import { useQuery } from "@tanstack/react-query";
import { env } from "../lib/env";

// Public pricing for the marketing pages — the unauthenticated /pricing/*
// endpoints (see zedsms-backend/docs/pricing-api.md). All amounts are USD;
// call rates are per minute, SMS per message.

const BASE_URL = env.apiBaseUrl;

// Service icons / country flags come back as paths relative to the backend root.
const ASSET_BASE = BASE_URL.replace(/\/api\/?$/, "/");
export const assetUrl = (path: string | null | undefined) =>
  !path ? "" : /^https?:\/\//i.test(path) ? path : ASSET_BASE + path.replace(/^\//, "");

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/pricing/${path}`, { headers: { Accept: "application/json" } });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.message !== "success") {
    throw new Error((typeof body?.data === "string" && body.data) || body?.message || `Could not load pricing (${res.status})`);
  }
  return body.data as T;
}

export type PrivatePlan = {
  id: number;
  term: string;
  label: string;
  months: number;
  monthly_fee: number;
  total: number;
  setup_fee: number;
  savings_percent: number;
};

export type PrivateCountryPricing = { id: number; name: string; iso: string; plans: PrivatePlan[] };

export type PrivatePricing = { max_savings_percent: number; countries: PrivateCountryPricing[] };

export type RateCountry = { iso: string; name: string };

type CallRate = { per_minute: number; min: number; max: number; minimum_sec: number; increment_sec: number };

export type Rates = {
  calls: { mobile: CallRate | null; landline: CallRate | null } | null;
  sms: {
    outbound: { per_message: number; min: number; max: number } | null;
    inbound: { per_message: number; free_per_month: number | null };
  };
};

export type SharedCountry = { id: number; name: string; iso: string; flag: string | null };
export type RentTime = { id: number; name: string; days: number };

export type SharedService = {
  id: number;
  name: string;
  icon: string | null;
  price_per_day: number;
  prices: { rent_time_id: number; name: string; days: number; price: number; per_day: number }[];
};

// Plans and shared prices change only from the admin; no need to refetch on focus.
const STALE = 5 * 60 * 1000;

export function usePrivatePricing() {
  return useQuery({
    queryKey: ["pricing", "private-numbers"],
    queryFn: async () => {
      const d = await get<PrivatePricing>("private-numbers");
      return { ...d, countries: d.countries.map((c) => ({ ...c, iso: c.iso.toUpperCase() })) };
    },
    staleTime: STALE,
  });
}

/** Calling & SMS destinations reachable from a private number in `fromIso`. */
export function useRateCountries(fromIso: string | undefined) {
  return useQuery({
    queryKey: ["pricing", "rate-countries", fromIso],
    queryFn: () => get<RateCountry[]>(`rates/countries?from=${fromIso}`),
    enabled: !!fromIso,
    staleTime: STALE,
  });
}

export function useRates(toIso: string | undefined, fromIso: string | undefined) {
  return useQuery({
    queryKey: ["pricing", "rates", toIso, fromIso],
    queryFn: () => get<Rates>(`rates/${toIso}?from=${fromIso}`),
    enabled: !!toIso && !!fromIso,
    staleTime: STALE,
  });
}

export function useSharedOptions() {
  return useQuery({
    queryKey: ["pricing", "shared-numbers"],
    queryFn: async () => {
      const d = await get<{ countries: SharedCountry[]; rent_times: RentTime[] }>("shared-numbers");
      return { ...d, countries: d.countries.map((c) => ({ ...c, iso: (c.iso || "").toUpperCase() })) };
    },
    staleTime: STALE,
  });
}

export function useSharedPrices(countryId: number | undefined) {
  return useQuery({
    queryKey: ["pricing", "shared-numbers", countryId],
    queryFn: () => get<{ services: SharedService[] }>(`shared-numbers/${countryId}`).then((d) => d.services),
    enabled: countryId !== undefined,
    staleTime: STALE,
  });
}

// UK → US → Canada → Australia first (the order the design uses), then A–Z.
const FEATURED = ["GB", "US", "CA", "AU"];
export function byFeaturedCountry<T extends { iso: string; name: string }>(a: T, b: T) {
  const ra = FEATURED.indexOf(a.iso), rb = FEATURED.indexOf(b.iso);
  if (ra !== rb) return (ra === -1 ? Infinity : ra) - (rb === -1 ? Infinity : rb);
  return a.name.localeCompare(b.name);
}

/** USD → cents, trimmed: 0.0201 → "2.01", 0.442511 → "44.25". */
export function toCents(usd: number) {
  return String(Math.round(usd * 100 * 100) / 100);
}
