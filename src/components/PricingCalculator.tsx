import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import CountrySelect, { type Country } from "./CountrySelect";
import { allCountries } from "../data/countries";
import {
  assetUrl,
  byFeaturedCountry,
  toCents,
  usePrivatePricing,
  useRateCountries,
  useRates,
  useSharedOptions,
  useSharedPrices,
  type PrivatePlan,
  type Rates,
  type RentTime,
  type SharedService,
} from "../api/publicPricing";

// images live in public/assets/ (served from the site root)
const imgCheck = "/assets/pricing/calc/icon-check.svg";
const imgCall = "/assets/pricing/calc/icon-call.svg";
const imgFlagUk = "/assets/pricing/flag-united-kingdom.svg";
const imgFlagUsRound = "/assets/pricing/flag-united-states.svg";
const imgFlagCa = "/assets/pricing/flag-canada.svg";
const imgFlagAu = "/assets/pricing/flag-australia.svg";
const imgPhoneMissed = "/assets/pricing/calc/icon-phone-missed.svg";
const imgSmartPhone = "/assets/pricing/calc/icon-smartphone.svg";
const imgLandline = "/assets/pricing/calc/icon-landline.svg";
const imgMessageIn = "/assets/pricing/calc/icon-message-in.svg";
const imgMessageOut = "/assets/pricing/calc/icon-message-out.svg";
const imgInfo = "/assets/pricing/calc/icon-info.svg";
const imgArrowRight = "/assets/pricing/calc/icon-arrow-right.svg";
const imgShare = "/assets/pricing/calc/icon-share.svg";

// The savings chip uses the best saving across all countries' plans.
function getBadges(maxSavings: number | undefined) {
  return [
    "Instant activation",
    "No setup fees",
    `Save up to ${maxSavings ?? 50}% on longer plans`,
    "Free inbound SMS on private numbers",
    "You control your renewal",
  ];
}

type TabOption = { key: string; label: string; save?: string };
// price is null while the plans are loading (rendered as "$—"). For plans
// longer than a month, total is what's charged up front and was is the same
// term at the monthly plan's rate (struck through when it's higher).
type Period = TabOption & { price: number | null; months?: number; total?: number; was?: number };

const termUnit = (months: number) =>
  months === 12 ? "year" : months === 3 ? "quarter" : months === 1 ? "month" : `${months} months`;

// "$83.88 $24.99/year" under the monthly figure; nothing for the monthly plan.
function TermTotal({ period, className }: { period: Period; className: string }) {
  if (!period.months || period.months <= 1 || period.total == null) return null;
  return (
    <p className={`font-sans text-[#494c52] ${className}`}>
      {period.was != null && (
        <span className="mr-1.5 line-through decoration-from-font">${period.was.toFixed(2)}</span>
      )}
      <span>
        ${period.total.toFixed(2)}/{termUnit(period.months)}
      </span>
    </p>
  );
}

// The design's round flags for the featured countries; everything else uses the emoji flag.
const featuredFlags: Record<string, string> = { GB: imgFlagUk, US: imgFlagUsRound, CA: imgFlagCa, AU: imgFlagAu };

function toCountry(c: { iso: string; name: string }): Country {
  const flag = featuredFlags[c.iso] ?? allCountries.find((w) => w.code === c.iso)?.flag ?? "";
  return { code: c.iso, name: c.name, flag };
}

// Image flags are asset URLs; emoji flags contain none of these characters.
const renderAnyFlag = (c: Country) =>
  /[/.:]/.test(c.flag) ? (
    <img src={c.flag} alt="" className="size-6 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="w-6 shrink-0 text-center text-xl leading-none">{c.flag}</span>
  );

const formatUsd = (n: number | null | undefined) => (n == null ? "—" : n.toFixed(2));

type PrivateCountry = Country & { plans: PrivatePlan[] };

// Tabs shown while the plans load; once loaded, tabs come from the country's plans.
const PLACEHOLDER_TERMS = [
  { key: "MONTHLY", label: "Monthly" },
  { key: "QUARTERLY", label: "Quarterly" },
  { key: "SIX_MONTHLY", label: "6 Months" },
  { key: "ANNUALLY", label: "Annually" },
];

// Shown until the plans arrive, so the card keeps its shape instead of jumping.
const placeholderPrivateCountry: PrivateCountry = { ...toCountry({ iso: "GB", name: "United Kingdom" }), plans: [] };

function getPrivatePeriods(country: PrivateCountry): Period[] {
  if (!country.plans.length) {
    return PLACEHOLDER_TERMS.map((t) => ({ ...t, price: null }));
  }
  const baseMonthly = country.plans.find((p) => p.months === 1)?.monthly_fee;
  return country.plans.map((p) => {
    const full = baseMonthly != null ? Math.round(baseMonthly * p.months * 100) / 100 : undefined;
    return {
      key: p.term,
      label: p.label,
      price: p.monthly_fee,
      months: p.months,
      total: p.total,
      was: full != null && full > p.total ? full : undefined,
      save: p.savings_percent > 0 ? `Save ${p.savings_percent}%` : undefined,
    };
  });
}

const INBOUND_ALLOWANCE_TOOLTIP =
  "Includes a monthly free allowance. Any messages beyond the included amount are charged at the listed rate. The allowance resets each month.";
const INBOUND_FREE_TOOLTIP = "Inbound SMS is free.";

type CallRateRow = {
  key: string;
  icon: string;
  label: string;
  price: string;
  tooltip?: string;
};

// Only the numeric rate ever changes here — these label/unit templates are fixed.
// The API quotes USD per minute / per message; the design shows cents. A rate
// that is loading or not offered for the destination renders as "—".
function getCallRateRows(rates: Rates | undefined): CallRateRow[] {
  const cents = (usd: number | null | undefined, unit: string) => (usd == null ? "—" : `${toCents(usd)}${unit}`);

  // Inbound depends only on the FROM number: free, or N free a month then metered.
  const inbound = rates?.sms.inbound;
  const inboundFree = inbound?.per_message === 0;
  const inboundPrice = !inbound
    ? "—"
    : inboundFree
      ? "FREE"
      : inbound.free_per_month
        ? `${inbound.free_per_month} Free/mo, then ${toCents(inbound.per_message)} ¢/Msg`
        : `${toCents(inbound.per_message)} ¢/Msg`;

  return [
    { key: "mobile", icon: imgSmartPhone, label: "Mobile", price: cents(rates?.calls?.mobile?.per_minute, "¢/Min") },
    { key: "landline", icon: imgLandline, label: "Landline", price: cents(rates?.calls?.landline?.per_minute, "¢/Min") },
    {
      key: "inbound",
      icon: imgMessageIn,
      label: "Inbound SMS",
      price: inboundPrice,
      tooltip: inboundFree ? INBOUND_FREE_TOOLTIP : INBOUND_ALLOWANCE_TOOLTIP,
    },
    { key: "outbound", icon: imgMessageOut, label: "Outbound SMS", price: cents(rates?.sms.outbound?.per_message, " ¢/Msg") },
  ];
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <span ref={rootRef} className="relative isolate inline-flex shrink-0">
      <button
        type="button"
        aria-label="More information"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center"
      >
        <img src={imgInfo} alt="" className="size-4" />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-[99999] mb-2 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-[#0f1013] px-3 py-2 text-left font-sans text-xs leading-4 text-white shadow-[0px_12px_24px_0px_rgba(15,16,19,0.32)] transition-[visibility,opacity] duration-150 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {text}
        <span
          aria-hidden
          className="absolute left-1/2 top-full -mt-1 size-2.5 -translate-x-1/2 rotate-45 bg-[#0f1013]"
        />
      </span>
    </span>
  );
}

// Shared-number countries come from the API. Default: United States.
const placeholderSharedCountry = toCountry({ iso: "US", name: "United States" });

// Services priced for the selected country, mapped into the shape CountrySelect
// expects (code/name/flag) — flag is the service's icon from the backend.
type ServiceOption = Country & { prices: SharedService["prices"] };

const placeholderService: ServiceOption = { code: "", name: "WhatsApp", flag: "", prices: [] };

function ServiceLogo({ service }: { service: ServiceOption }) {
  const [errored, setErrored] = useState(false);
  if (errored || !service.flag) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#eef1fb] font-sans text-[11px] font-semibold text-[#2155f5]">
        {service.name.charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={service.flag}
      alt=""
      className="size-6 shrink-0 rounded-md bg-white object-contain"
      onError={() => setErrored(true)}
    />
  );
}

// The design's labels for the usual durations; any other rent time uses its own name.
const SHARED_DURATION_LABEL: Record<number, string> = { 7: "1 week", 14: "2 weeks", 30: "1 month" };
const PLACEHOLDER_RENT_TIMES: RentTime[] = [
  { id: -1, name: "1 Week", days: 7 },
  { id: -2, name: "2 Week", days: 14 },
  { id: -3, name: "1 Month", days: 30 },
];

// Tabs keyed by rent_time_id. "Save X%" compares each duration's per-day price
// with the shortest duration's, per the pricing API doc.
function getSharedDurations(rentTimes: RentTime[], service: ServiceOption): TabOption[] {
  const basePerDay = service.prices[0]?.per_day;
  return rentTimes.map((r) => {
    const perDay = service.prices.find((p) => p.rent_time_id === r.id)?.per_day;
    const savePct = basePerDay && perDay ? Math.round((1 - perDay / basePerDay) * 100) : 0;
    return {
      key: String(r.id),
      label: SHARED_DURATION_LABEL[r.days] ?? r.name,
      save: savePct > 0 ? `Save ${savePct}%` : undefined,
    };
  });
}

function PeriodTabs({
  options,
  active,
  onChange,
}: {
  options: TabOption[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="bg-[#f9f9fa] flex flex-col items-start overflow-clip p-1.5 rounded-[14px] shrink-0 w-full">
      <div className="flex items-center justify-between w-full">
        {options.map((o) => {
          const isActive = o.key === active;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              className={`flex flex-1 flex-col gap-0.5 h-12 items-center justify-center py-1.5 rounded-[10px] transition-colors ${
                isActive ? "bg-white shadow-[0px_11px_14px_0px_rgba(0,0,0,0.05)]" : ""
              }`}
            >
              {o.save && (
                <span className="font-sans font-semibold text-xs leading-3 text-[#2155f5]">{o.save}</span>
              )}
              <span className="font-sans font-medium text-base leading-6 text-[#0f1013]">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Mobile-only accordion for the private-number billing period. Desktop keeps
// the horizontal PeriodTabs segmented control untouched.
function PrivateBillingAccordion({
  periods,
  active,
  onChange,
}: {
  periods: Period[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {periods.map((p) => {
        const isActive = p.key === active;
        return (
          <div
            key={p.key}
            className={`rounded-2xl border transition-colors ${
              isActive ? "border-[#2155f5] bg-[#f5f8ff]" : "border-[#e6e6e6] bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => onChange(p.key)}
              aria-expanded={isActive}
              className="flex flex-col gap-1.5 w-full px-4 py-3.5"
            >
              <span className="flex items-center gap-2 w-full">
                <span className="font-sans font-medium text-base leading-6 text-[#0f1013]">{p.label}</span>
                {p.save && (
                  <span className="font-sans font-semibold text-xs leading-3 text-[#2155f5] bg-[#eef1fb] px-2 py-1 rounded-full">
                    {p.save}
                  </span>
                )}
              </span>
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-[#0f1013]">
                  <span className="font-sans font-semibold text-xl leading-6 tracking-[-0.02em]">
                    ${formatUsd(p.price)}
                  </span>
                  <span className="font-sans text-sm leading-5 text-[#494c52]">/mo</span>
                </span>
                <TermTotal period={p} className="text-sm leading-5" />
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function PricingCalculator() {
  // Selections are kept by key and resolved against the latest API data, so a
  // choice survives refetches and falls back sensibly when it isn't offered.
  const [privateIso, setPrivateIso] = useState("GB");
  const [privatePeriod, setPrivatePeriod] = useState("MONTHLY");
  const [destinationIso, setDestinationIso] = useState("BD");
  const [sharedIso, setSharedIso] = useState("US");
  const [sharedServiceName, setSharedServiceName] = useState("WhatsApp");
  const [sharedPeriod, setSharedPeriod] = useState("");
  const [openSharedDropdown, setOpenSharedDropdown] = useState<"country" | "service" | null>(null);

  // Private numbers
  const { data: privateData } = usePrivatePricing();
  const privateCountries: PrivateCountry[] = (privateData?.countries ?? [])
    .filter((c) => c.plans.length)
    .sort(byFeaturedCountry)
    .map((c) => ({ ...toCountry(c), plans: c.plans }));
  const privateCountry =
    privateCountries.find((c) => c.code === privateIso) ?? privateCountries[0] ?? placeholderPrivateCountry;
  const privatePeriods = getPrivatePeriods(privateCountry);
  const activePrivate = privatePeriods.find((p) => p.key === privatePeriod) ?? privatePeriods[0];

  // Calling & SMS: rates depend on the provider of the selected private number (FROM)
  const fromIso = privateData ? privateCountry.code : undefined;
  const { data: rateCountries } = useRateCountries(fromIso);
  const destinations = (rateCountries ?? []).map(toCountry);
  const destination =
    destinations.find((c) => c.code === destinationIso) ??
    destinations[0] ??
    toCountry({ iso: "BD", name: "Bangladesh" });
  const { data: rates } = useRates(rateCountries ? destination.code : undefined, fromIso);
  const callRates = getCallRateRows(rates);

  // Shared numbers
  const { data: sharedOptions } = useSharedOptions();
  const sharedCountryList = (sharedOptions?.countries ?? []).slice().sort(byFeaturedCountry);
  const sharedCountries = sharedCountryList.map(toCountry);
  const sharedCountry = sharedCountries.find((c) => c.code === sharedIso) ?? sharedCountries[0] ?? placeholderSharedCountry;
  const sharedCountryId = sharedCountryList.find((c) => c.iso === sharedCountry.code)?.id;
  const { data: sharedServices } = useSharedPrices(sharedCountryId);
  const serviceOptions: ServiceOption[] = (sharedServices ?? []).map((s) => ({
    code: String(s.id),
    name: s.name,
    flag: assetUrl(s.icon),
    prices: s.prices,
  }));
  const sharedService =
    serviceOptions.find((s) => s.name.toLowerCase() === sharedServiceName.toLowerCase()) ??
    serviceOptions[0] ??
    placeholderService;
  const rentTimes = sharedOptions?.rent_times.length ? sharedOptions.rent_times : PLACEHOLDER_RENT_TIMES;
  const sharedDurations = getSharedDurations(rentTimes, sharedService);
  const activeShared = sharedDurations.find((p) => p.key === sharedPeriod) ?? sharedDurations[0];
  const activeSharedPrice = sharedService.prices.find((p) => String(p.rent_time_id) === activeShared.key)?.price;

  return (
    <section className="relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] pb-12 lg:pb-[60px]">
      <div className="mx-auto max-w-[1290px] flex flex-col items-center gap-10 lg:gap-10">
        <ul className="flex flex-wrap items-center justify-center gap-3">
          {getBadges(privateData?.max_savings_percent).map((b) => (
            <li
              key={b}
              className="bg-white border border-[#e6e6e6] flex gap-1.5 items-center justify-center px-[18px] py-3.5 rounded-full shadow-[0px_5px_4px_-4px_rgba(67,67,90,0.1)]"
            >
              <img src={imgCheck} alt="" className="size-[18px]" />
              <span className="font-sans text-sm leading-5 text-[#0f1013] whitespace-nowrap">{b}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-[30px] items-start w-full">
          <div className="flex flex-col lg:flex-row gap-[30px] items-stretch justify-center w-full">
            {/* Private numbers */}
            <div className="bg-[#f2f2f2] flex-1 rounded-[20px] p-1.5">
              <div className="bg-white flex flex-col h-full items-center justify-between p-6 rounded-2xl shadow-[0px_24px_32px_0px_rgba(193,193,214,0.16)] gap-8">
                <div className="flex flex-col gap-10 items-start w-full">
                  <div className="flex gap-4 items-center w-full">
                    <div className="relative flex items-center justify-center rounded-full shrink-0 size-12 bg-gradient-to-b from-[#2155f5] to-[#698dfb]">
                      <img src={imgCall} alt="" className="size-5" />
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full shadow-[inset_0_-3px_12px_rgba(255,255,255,0.24)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display font-medium text-xl leading-7 text-[#0f1013]">
                        Private numbers
                      </h3>
                      <p className="font-sans text-sm leading-5 text-[#0f1013]/50">Subscribe to a local number</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 items-start w-full">
                    <CountrySelect
                      countries={privateCountries}
                      value={privateCountry}
                      onChange={(c) => setPrivateIso(c.code)}
                      renderFlag={renderAnyFlag}
                    />
                    <div className="hidden md:block w-full">
                      <PeriodTabs options={privatePeriods} active={activePrivate.key} onChange={setPrivatePeriod} />
                    </div>
                    <div className="md:hidden w-full">
                      <PrivateBillingAccordion periods={privatePeriods} active={activePrivate.key} onChange={setPrivatePeriod} />
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col gap-1.5 items-center justify-center w-full">
                    <p className="text-[#0f1013] text-center">
                      <span className="font-sans font-semibold text-[40px] leading-[44px] tracking-[-0.03em]">
                        ${formatUsd(activePrivate.price)}
                      </span>
                      <span className="font-sans text-base leading-6 text-[#494c52]">/mo</span>
                    </p>
                    <TermTotal period={activePrivate} className="text-sm leading-5" />
                  </div>
                </div>

                <div className="flex gap-2 items-center justify-center">
                  <img src={imgCheck} alt="" className="size-[18px]" />
                  <span className="font-sans text-sm leading-5 text-[#494c52]">
                    Inbound calls free for all country number
                  </span>
                </div>
              </div>
            </div>

            {/* Calling & SMS rates */}
            <div className="bg-[#f2f2f2] flex-1 rounded-[20px] p-1.5">
              <div className="bg-white flex flex-col h-full items-start justify-between p-6 rounded-2xl shadow-[0px_24px_32px_0px_rgba(193,193,214,0.16)] gap-8">
                <div className="flex flex-col gap-10 items-start w-full">
                  <div className="flex gap-4 items-center w-full">
                    <div className="relative flex items-center justify-center rounded-full shrink-0 size-12 bg-gradient-to-b from-[#2155f5] to-[#698dfb]">
                      <img src={imgPhoneMissed} alt="" className="size-5" />
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full shadow-[inset_0_-3px_12px_rgba(255,255,255,0.24)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display font-medium text-xl leading-7 text-[#0f1013]">
                        Calling & SMS rates
                      </h3>
                      <p className="font-sans text-sm leading-5 text-[#0f1013]/50">
                        Outgoing call & SMS prices by destination
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 items-start w-full">
                    <CountrySelect
                      countries={destinations}
                      value={destination}
                      onChange={(c) => setDestinationIso(c.code)}
                      renderFlag={renderAnyFlag}
                    />

                    {/* Desktop: unchanged flex layout */}
                    <ul className="hidden md:flex flex-col gap-3 items-start w-full">
                      {callRates.map((r, i) => (
                        <li key={r.key} className="w-full">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex gap-3 items-center">
                              <img src={r.icon} alt="" className="size-6" />
                              <span className="font-sans font-medium text-base leading-6 text-[#494c52]">
                                {r.label}
                              </span>
                              {r.tooltip && <InfoTooltip text={r.tooltip} />}
                            </div>
                            <span className="font-sans text-lg leading-7 text-[#0f1013]">{r.price}</span>
                          </div>
                          {i < callRates.length - 1 && <div className="border-t border-[#e6e6e6] mt-3" />}
                        </li>
                      ))}
                    </ul>

                    {/* Mobile: flex row with a controlled-width, right-aligned pricing block */}
                    <ul className="md:hidden flex flex-col gap-2.5 items-start w-full">
                      {callRates.map((r, i) => (
                        <li key={r.key} className="w-full">
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap py-1">
                              <img src={r.icon} alt="" className="size-6 shrink-0" />
                              <span className="flex items-center gap-1.5">
                                <span className="font-sans font-medium text-[16px] leading-6 text-[#494c52]">
                                  {r.label}
                                </span>
                                {r.tooltip && <InfoTooltip text={r.tooltip} />}
                              </span>
                            </div>
                            <span className="font-sans text-[17px] leading-[22px] text-[#0f1013] text-right ml-auto [flex:0_0_45%] max-w-[45%] [white-space:normal] [overflow-wrap:normal] [word-break:normal]">
                              {r.price}
                            </span>
                          </div>
                          {i < callRates.length - 1 && <div className="border-t border-[#e6e6e6] mt-2.5" />}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  to="/auth/signup"
                  className="lift bg-[#2155f5] hover:bg-[#1a46d1] flex gap-2.5 items-center justify-center px-6 py-3 rounded-full w-full"
                >
                  <span className="font-display font-medium text-sm leading-5 text-white">Get started now</span>
                  <img src={imgArrowRight} alt="" className="size-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Shared number rates */}
          <div className="bg-[#f2f2f2] rounded-[20px] p-1.5 w-full">
            <div className="bg-white flex flex-col items-center p-6 rounded-2xl shadow-[0px_24px_32px_0px_rgba(193,193,214,0.16)] gap-7 w-full">
              <div className="flex flex-col gap-7 items-start w-full">
                <div className="flex gap-4 items-center">
                  <div className="relative flex items-center justify-center rounded-full shrink-0 size-12 bg-gradient-to-b from-[#2155f5] to-[#698dfb]">
                    <img src={imgShare} alt="" className="size-5" />
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full shadow-[inset_0_-3px_12px_rgba(255,255,255,0.24)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display font-medium text-xl leading-7 text-[#0f1013]">
                      Shared number rates
                    </h3>
                    <p className="font-sans text-sm leading-5 text-[#0f1013]/50">Verification codes by service</p>
                  </div>
                </div>

                <div className="flex flex-col gap-5 items-start w-full">
                  <div className="flex flex-col sm:flex-row gap-5 items-start w-full">
                    <div className="w-full flex-1">
                      <CountrySelect
                        countries={sharedCountries}
                        value={sharedCountry}
                        onChange={(c) => setSharedIso(c.code)}
                        renderFlag={renderAnyFlag}
                        open={openSharedDropdown === "country"}
                        onOpenChange={(o) => setOpenSharedDropdown(o ? "country" : null)}
                      />
                    </div>
                    <div className="w-full flex-1">
                      <CountrySelect
                        countries={serviceOptions}
                        value={sharedService}
                        onChange={(s) => setSharedServiceName(s.name)}
                        open={openSharedDropdown === "service"}
                        onOpenChange={(o) => setOpenSharedDropdown(o ? "service" : null)}
                        renderFlag={(s) => <ServiceLogo key={s.flag} service={s} />}
                        searchPlaceholder="Search services..."
                        emptyMessage="No services found"
                        listMaxHeightClass="max-h-[min(360px,calc(100vh-260px))]"
                      />
                    </div>
                  </div>
                  <PeriodTabs options={sharedDurations} active={activeShared.key} onChange={setSharedPeriod} />
                </div>
              </div>

              <div className="flex items-center justify-between w-full">
                <div className="flex gap-3 items-center">
                  <ServiceLogo key={sharedService.flag} service={sharedService} />
                  <span className="font-sans font-medium text-base leading-6 text-[#0f1013]">
                    {sharedService.name}
                  </span>
                </div>
                <div className="flex gap-4 items-center">
                  <p className="text-[#0f1013] text-center">
                    <span className="font-display font-medium text-2xl leading-7">
                      ${formatUsd(activeSharedPrice)}
                    </span>
                    <span className="font-sans text-sm leading-5 text-[#494c52]">/{activeShared.label}</span>
                  </p>
                </div>
              </div>

              <Link
                to="/auth/signup"
                className="lift bg-[#2155f5] hover:bg-[#1a46d1] flex gap-2.5 items-center justify-center px-6 py-3 rounded-full w-full"
              >
                <span className="font-display font-medium text-sm leading-5 text-white">Get started now</span>
                <img src={imgArrowRight} alt="" className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        <p className="font-sans text-base leading-6 text-[#494c52] text-center">
          Prices shown are examples — see full details before you check out.
        </p>
      </div>
    </section>
  );
}
