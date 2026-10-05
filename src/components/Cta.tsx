import Link from "next/link";

// images live in public/assets/ (served from the site root)
const imgBg = "/assets/cta/cta-background.webp";
const imgArrow = "/assets/cta/icon-arrow-right-blue.svg";
const imgAndroid = "/assets/cta/icon-android.svg";
const imgApple = "/assets/cta/icon-apple.svg";
const imgDesktop = "/assets/cta/icon-desktop.svg";
const imgTelegram = "/assets/cta/icon-telegram.svg";

export default function Cta() {
  return (
    <section className="relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-12 lg:py-[60px]">
      <div className="relative mx-auto max-w-[1290px] min-h-[380px] sm:min-h-[410px] flex items-center justify-center overflow-hidden rounded-[20px] sm:rounded-3xl px-5 sm:px-10 py-14">
        <img
          src={imgBg}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover pointer-events-none select-none"
        />

        <div data-reveal-target className="relative flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-5">
            <h2 className="font-display font-semibold text-[34px] leading-[40px] sm:text-[44px] sm:leading-[48px] lg:text-[52px] lg:leading-[56px] tracking-[-0.02em] text-white">
              Get your second number now.
            </h2>
            <p className="font-sans text-base leading-6 text-white/70">
              No name, no ID, no commitment - just an email.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/auth/signup"
              className="lift inline-flex items-center justify-center gap-2.5 bg-white hover:bg-[#eef1fb] border border-[#e6e6e6] rounded-full px-6 py-3 font-display font-medium text-sm leading-5 text-[#2155f5] whitespace-nowrap"
            >
              Get started free
              <img src={imgArrow} alt="" className="size-4" />
            </Link>
            <div className="flex flex-col items-center gap-2.5">
              <span className="font-sans text-sm leading-5 text-white/70">
                Phone, PC, Mac, Telegram bot apps
              </span>
              <div className="flex items-center gap-2">
                {[[imgAndroid, "Android"], [imgApple, "iPhone and Mac"], [imgDesktop, "Desktop"], [imgTelegram, "Telegram bot"]].map(([src, label]) => (
                  <img key={label} src={src} alt={label} title={label} className="size-6" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
