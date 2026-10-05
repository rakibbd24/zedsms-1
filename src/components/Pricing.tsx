import { Link } from "react-router-dom";
// Figma has the Canada and Australia flags swapped; assigned correctly here.
import { usePrivatePricing, type PrivateCountryPricing } from "../api/publicPricing";

// images live in public/assets/ (served from the site root)
const imgFlagUk = "/assets/pricing/flag-united-kingdom.svg";
const imgFlagUs = "/assets/pricing/flag-united-states.svg";
const imgFlagCa = "/assets/pricing/flag-canada.svg";
const imgFlagAu = "/assets/pricing/flag-australia.svg";
const imgTag = "/assets/pricing/icon-tag.svg";
const imgGift = "/assets/pricing/icon-gift.svg";
const imgCall = "/assets/pricing/icon-call.svg";
const imgRefresh = "/assets/pricing/icon-refresh.svg";
const imgFlash = "/assets/pricing/icon-flash.svg";

// The four featured countries, in the design's order. Prices come from the API.
const featured = [
  { iso: "GB", country: "United Kingdom", flag: imgFlagUk, popular: true },
  { iso: "US", country: "United States", flag: imgFlagUs },
  { iso: "CA", country: "Canada", flag: imgFlagCa },
  { iso: "AU", country: "Australia", flag: imgFlagAu },
];

function planCopy(pricing: PrivateCountryPricing | undefined) {
  const monthly = pricing?.plans.find((p) => p.term === "MONTHLY");
  const annual = pricing?.plans.find((p) => p.term === "ANNUALLY");
  return {
    price: monthly ? `$${monthly.monthly_fee.toFixed(2)}` : "$—",
    // Some countries (e.g. Australia) only sell monthly — then there's no annual line.
    annual: annual
      ? `Annual: $${annual.total.toFixed(2)}${annual.savings_percent > 0 ? ` (save ${annual.savings_percent}% vs monthly)` : ""}`
      : pricing
        ? "Billed monthly"
        : "Annual: —",
  };
}

const sharedDetails = [
  { icon: imgGift, text: "Setup Fee: Free" },
  { icon: imgCall, text: "Free incoming calls & SMS" },
  { icon: imgRefresh, text: "Renew anytime" },
  { icon: imgFlash, text: "Instant Activation" },
];

export default function Pricing() {
  const { data, isSuccess } = usePrivatePricing();

  // Once loaded, drop any featured country that no longer has plans.
  const plans = featured
    .map((f) => ({ ...f, pricing: data?.countries.find((c) => c.iso === f.iso) }))
    .filter((p) => !isSuccess || p.pricing?.plans.length)
    .map((p) => ({ ...p, ...planCopy(p.pricing) }));

  return (
    <section className="relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-12 lg:py-[60px]">
      <div className="mx-auto max-w-[1290px] flex flex-col items-center gap-10 lg:gap-[60px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="inline-flex items-center justify-center gap-1.5 px-[13px] py-[9px] rounded-full border border-transparent"
            style={{
              background:
                "linear-gradient(#fff, #fff) padding-box, linear-gradient(92deg, #2155F5 1.96%, #7A9BFF 46.96%, #2155F5 92.83%) border-box",
            }}
          >
            <span className="font-sans font-semibold text-sm leading-4 text-[#2155f5] whitespace-nowrap">
              Pricing Plan
            </span>
          </div>

          <div className="flex flex-col items-center gap-5">
            <h2 className="font-display font-semibold text-[30px] leading-[36px] sm:text-[36px] sm:leading-[40px] xl:text-[40px] xl:leading-[44px] tracking-[-0.015em] text-[#0f1013]">
              Simple, transparent pricing
            </h2>
            <p className="font-sans text-base leading-6 text-[#494c52]">
              Pay from your wallet balance. No subscriptions, no contracts.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-10 lg:gap-12">
          <ul className="grid w-full max-w-none md:max-w-[635px] xl:max-w-none grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-end gap-5 xl:gap-[19px]">
            {plans.map((p) => (
              <li
                key={p.country}
                className={`lift relative rounded-[20px] p-1.5 ${
                  p.popular
                    ? "bg-gradient-to-b from-[#2155f5] to-[#96afff] pt-[34px]"
                    : "bg-[#f2f2f2]"
                }`}
              >
                {p.popular && (
                  <span className="absolute left-1/2 top-[18px] -translate-x-1/2 -translate-y-1/2 font-sans font-medium text-base leading-6 text-white whitespace-nowrap">
                    POPULAR
                  </span>
                )}
                <div className="flex flex-col gap-7 bg-white rounded-2xl px-3.5 pt-3.5 pb-4 shadow-[0px_24px_32px_0px_rgba(193,193,214,0.16)]">
                  <div className="flex items-center gap-[9px]">
                    <img src={p.flag} alt="" className="size-11 shrink-0" />
                    <h3 className="font-display font-medium text-xl leading-7 text-[#0f1013]">
                      {p.country}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-7">
                    <p className="text-[#0f1013]">
                      <span className="font-display font-semibold text-[40px] leading-[44px] tracking-[-0.03em]">
                        {p.price}
                      </span>
                      <span className="font-sans text-base leading-6 text-[#494c52]">/mo</span>
                    </p>

                    <ul className="flex flex-col gap-3.5">
                      {[{ icon: imgTag, text: p.annual }, ...sharedDetails].map((d) => (
                        <li key={d.text} className="flex items-center gap-2">
                          <img src={d.icon} alt="" className="size-4 shrink-0" />
                          <span className="font-sans text-sm leading-5 text-[#494c52]">{d.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="font-sans text-base leading-6 text-[#494c52] text-center">
            US private numbers include 50 free inbound SMS, then $0.03 each.{" "}
            <Link to="/pricing" className="text-[#2155f5] hover:underline whitespace-nowrap">
              See the full pricing checker →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
