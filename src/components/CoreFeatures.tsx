// images live in public/assets/ (served from the site root)
const imgDevices = "/assets/core-features/icon-devices.svg";
const imgRefresh = "/assets/core-features/icon-refresh.svg";
const imgSwap = "/assets/core-features/icon-swap.svg";
const imgClock = "/assets/core-features/icon-clock.svg";
const imgShield = "/assets/core-features/icon-shield.svg";
const imgServices = "/assets/core-features/icon-services.svg";

const features = [
  {
    icon: imgDevices,
    title: "Multi-device inbox",
    body: "Check codes from web, iOS, Android or Telegram — same inbox everywhere.",
  },
  {
    icon: imgRefresh,
    title: "Auto-renews from wallet",
    body: "Private numbers renew weekly on their own while your balance covers rent.",
  },
  {
    icon: imgSwap,
    title: "Release & swap anytime",
    body: "Done with a number? Release it and pick a new one in seconds.",
  },
  {
    icon: imgClock,
    title: "Real-time availability",
    body: "See live stock before you buy — no surprises at checkout.",
  },
  {
    icon: imgShield,
    title: "Free number transfers",
    body: "Send a private number to another ZEDSMS user for free, anytime.",
  },
  {
    icon: imgServices,
    title: "120+ supported services",
    body: "From Google to Uber, a scoped shared number for whatever you're verifying.",
  },
];

export default function CoreFeatures() {
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
              Core Features
            </span>
          </div>

          <div className="flex flex-col items-center gap-5">
            <h2 className="font-display font-semibold text-[30px] leading-[36px] sm:text-[36px] sm:leading-[40px] xl:text-[40px] xl:leading-[44px] tracking-[-0.015em] text-[#0f1013]">
              Everything you need to stay reachable
            </h2>
            <p className="font-sans text-base leading-6 text-[#494c52]">
              Built-in tools that come with every number, private or shared.
            </p>
          </div>
        </div>

        <ul className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,352px))] justify-between gap-x-10 gap-y-10 lg:gap-y-[60px]">
          {features.map((f) => (
            <li key={f.title} className="flex flex-col items-center text-center gap-5 sm:items-start sm:text-left lg:gap-6">
              <div className="relative flex items-center justify-center size-14 shrink-0 rounded-full bg-gradient-to-b from-[#2155f5] to-[#698dfb]">
                <img src={f.icon} alt="" className="size-6" />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full shadow-[inset_0_-3px_12px_rgba(255,255,255,0.24)]"
                />
              </div>
              <div className="flex flex-col items-center text-center gap-3 sm:items-start sm:text-left lg:gap-4">
                <h3 className="font-display font-medium text-xl leading-7 sm:text-2xl text-[#0f1013]">
                  {f.title}
                </h3>
                <p className="font-sans text-base leading-6 text-[#494c52] max-w-[320px] sm:max-w-none">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
