import Link from "next/link";

// images live in public/assets/ (served from the site root)
const imgPrivate = "/assets/number-types/private-number-app.webp";
const imgShared = "/assets/number-types/shared-number-services.webp";
const imgArrow = "/assets/number-types/icon-arrow-right-white.svg";
const imgCheck = "/assets/number-types/icon-check.svg";

const offers = [
  {
    badge: "For everyday privacy",
    title: "A number that's entirely yours",
    body: "One private number that sends and receives SMS and calls, forwards to Telegram instantly, and stays 100% yours - renew it for as long as you want.",
    cta: "Get a private number",
    price: "From $2.50/mo",
    features: [
      "Send & receive SMS and calls",
      "Instant forwarding to Telegram",
      "Renewable — keep the number forever",
    ],
    image: imgPrivate,
    alt: "ZEDSMS app showing a private number dashboard",
    imageFirst: false,
  },
  {
    badge: "For everyday privacy",
    title: "A Number for your service",
    body: "Rent a number scoped to one service — 120+ supported apps and platforms — for as long as you need it.",
    cta: "Get a shared number",
    price: "from $0.15/day",
    features: [
      "Pick from 120+ supported services",
      "Rent for 1 week, 2 weeks or 1 month",
      "New number each time you need one",
    ],
    image: imgShared,
    alt: "ZEDSMS connected to Instagram, Google, X, Facebook, WhatsApp, Telegram and more",
    imageFirst: true,
  },
];

export default function NumberTypes() {
  return (
    <section className="relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-6 lg:py-[50px]">
      <div className="mx-auto max-w-[1290px] flex flex-col gap-6 sm:gap-10 lg:gap-[100px]">
        {offers.map((o) => (
          <div
            key={o.title}
            data-reveal-target
            className={`flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-8 lg:gap-10 lg:h-[568px] bg-white border border-[#e6e6e6] rounded-[20px] sm:rounded-[28px] overflow-hidden p-5 sm:p-8 lg:py-7 ${
              o.imageFirst ? "lg:pl-7 lg:pr-[60px]" : "lg:pl-[60px] lg:pr-7"
            }`}
          >
            <div
              className={`flex flex-col gap-10 lg:justify-between lg:flex-1 lg:max-w-[570px] lg:py-[7px] ${
                o.imageFirst ? "lg:order-2" : ""
              }`}
            >
              <div className="flex flex-col gap-4 items-start">
                <div
                  className="inline-flex items-center justify-center gap-1.5 px-[13px] py-[9px] rounded-full border border-transparent"
                  style={{
                    background:
                      "linear-gradient(#fff, #fff) padding-box, linear-gradient(92deg, #2155F5 1.96%, #7A9BFF 46.96%, #2155F5 92.83%) border-box",
                  }}
                >
                  <span className="font-sans font-semibold text-sm leading-4 text-[#2155f5] whitespace-nowrap">
                    {o.badge}
                  </span>
                </div>

                <div className="flex flex-col gap-7">
                  <div className="flex flex-col gap-5">
                    <h2 className="font-display font-semibold text-[30px] leading-[36px] sm:text-[36px] sm:leading-[40px] xl:text-[40px] xl:leading-[44px] tracking-[-0.015em] text-[#0f1013]">
                      {o.title}
                    </h2>
                    <p className="font-sans text-base leading-6 text-[#494c52]">{o.body}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <Link
                      href="/auth/signup"
                      className="lift inline-flex items-center justify-center gap-2.5 bg-[#2155f5] hover:bg-[#1a46d1] rounded-full px-6 py-3 font-display font-medium text-sm leading-5 text-white whitespace-nowrap"
                    >
                      {o.cta}
                      <img loading="lazy" decoding="async" src={imgArrow} alt="" className="size-4" />
                    </Link>
                    <span className="font-display font-medium text-sm leading-5 text-[#0f1013] whitespace-nowrap">
                      {o.price}
                    </span>
                  </div>
                </div>
              </div>

              <ul className="flex flex-col gap-3">
                {o.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <img loading="lazy" decoding="async" src={imgCheck} alt="" className="size-[18px] shrink-0" />
                    <span className="font-sans text-base leading-6 text-[#494c52]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <img
              src={o.image}
              alt={o.alt}
              loading="lazy"
              decoding="async"
              className={`w-full aspect-[570/512] lg:aspect-auto lg:h-full lg:w-auto lg:flex-1 lg:max-w-[570px] object-cover rounded-2xl ${
                o.imageFirst ? "lg:order-1" : ""
              }`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
