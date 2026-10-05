import Link from "next/link";

// images live in public/assets/ (served from the site root)
const imgLogoMark = "/assets/footer/logo-mark.svg";
const imgLogoText = "/assets/footer/logo-wordmark.svg";
const imgInstagram = "/assets/footer/social-instagram.svg";
const imgX = "/assets/footer/social-x.svg";
const imgYoutube = "/assets/footer/social-youtube.svg";
const imgTiktok = "/assets/footer/social-tiktok.svg";
const imgAppStore = "/assets/footer/badge-app-store.svg";
const imgGooglePlay = "/assets/footer/badge-google-play.svg";

// Fill in each profile URL to show its icon — icons without one stay hidden rather
// than linking to "#".
const socials = [
  { icon: imgInstagram, label: "Instagram", url: "" },
  { icon: imgX, label: "X", url: "" },
  { icon: imgYoutube, label: "YouTube", url: "" },
  { icon: imgTiktok, label: "TikTok", url: "" },
].filter((s) => s.url);

// Blog and Careers had no pages behind them, so they're left out until they exist.
const linkGroups = [
  { title: "COMPANY", links: [{ label: "Home", href: "/" }, { label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }, { label: "About", href: "/about" }] },
  { title: "LEGAL", links: [{ label: "Terms & Conditions", href: "/terms-of-service" }, { label: "Privacy Policy", href: "/privacy-policy" }] },
  { title: "SUPPORT", links: [{ label: "support@zedsms.com", href: "mailto:support@zedsms.com" }, { label: "FAQ", href: "/#faq" }, { label: "Contact", href: "mailto:support@zedsms.com" }] },
];

export default function Footer() {
  return (
    <footer className="relative w-full bg-white">
      <div className="px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] pt-12 pb-14 lg:pt-[60px] lg:pb-20">
        <div className="mx-auto max-w-[1290px] flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
          <div className="flex flex-col gap-8 lg:gap-10 w-full max-w-[320px] lg:shrink-0">
            <div className="flex flex-col gap-6">
              <Link href="/" className="flex items-center gap-3" aria-label="ZEDSMS home">
                <img src={imgLogoMark} alt="" className="size-[42px]" />
                <img src={imgLogoText} alt="" className="h-[23.6px] w-[128.2px]" />
              </Link>
              <p className="font-sans text-base leading-6 text-[#494c52]">
                Get instant private and shared phone numbers across the US, UK, Canada, and Australia for seamless SMS receiving.
              </p>
            </div>

            {socials.length > 0 && <ul className="flex items-center gap-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="lift group flex items-center justify-center size-[52px] sm:size-[60px] rounded-full bg-[#f3f4f6] hover:bg-[#2155f5] focus-visible:bg-[#2155f5]"
                  >
                    {/* Exported icon used as a mask so its colour can switch to white on hover */}
                    <span
                      aria-hidden
                      className="h-6 w-[23px] bg-[#494c52] group-hover:bg-white group-focus-visible:bg-white transition-colors"
                      style={{
                        maskImage: `url("${s.icon}")`,
                        WebkitMaskImage: `url("${s.icon}")`,
                        maskSize: "100% 100%",
                        WebkitMaskSize: "100% 100%",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                      }}
                    />
                  </a>
                </li>
              ))}
            </ul>}
          </div>

          <nav className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10 sm:gap-12 lg:flex lg:gap-12">
            {linkGroups.map((g) => (
              <div key={g.title} className="flex flex-col gap-4 sm:gap-6 lg:w-[180px]">
                <h2 className="font-display font-medium text-lg leading-[26px] text-[#0f1013]">{g.title}</h2>
                <ul className="flex flex-col gap-2.5">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      {l.href.startsWith("/") ? (
                        <Link href={l.href} className="font-sans text-base leading-6 text-[#494c52] hover:text-[#2155f5] transition-colors break-all sm:break-normal">
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className="font-sans text-base leading-6 text-[#494c52] hover:text-[#2155f5] transition-colors break-all sm:break-normal">
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="bg-white border-t border-[#e6e6e6] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-6 sm:py-7">
        <div className="mx-auto max-w-[1290px] flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-5">
          <p className="font-sans text-sm leading-5 sm:text-base sm:leading-6 text-[#494c52] text-center sm:text-left">
            © 2026 ZEDSMS. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href="https://apps.apple.com/gb/app/zedsms-second-phone-number/id6763044238" target="_blank" rel="noopener noreferrer">
              <img src={imgAppStore} alt="Download on the App Store" className="h-12 w-[163px]" />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.app.zedsms" target="_blank" rel="noopener noreferrer">
              <img src={imgGooglePlay} alt="Get it on Google Play" className="h-12 w-[163px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
