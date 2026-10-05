import { type CSSProperties } from "react";
import Navbar from "./Navbar";
import imgBg from "../assets/hero/hero-cloud-background.webp";
// Placeholder — swap this file for the final hero image
import imgHero from "../assets/hero/hero-woman-four-countries.webp";
import imgShieldSmall from "../assets/hero/icon-shield-small.svg";
import imgAppStore from "../assets/hero/badge-app-store.svg";
import imgGooglePlay from "../assets/hero/badge-google-play.svg";
import imgAndroid from "../assets/hero/icon-android.svg";
import imgApple from "../assets/hero/icon-apple.svg";
import imgDesktop from "../assets/hero/icon-desktop.svg";
import imgTelegram from "../assets/hero/icon-telegram.svg";
import imgLocation from "../assets/hero/icon-location.svg";
import imgShield from "../assets/hero/icon-shield.svg";
import imgDollar from "../assets/hero/icon-dollar.svg";
import imgFlash from "../assets/hero/icon-flash.svg";

const features = [
  {
    icon: imgLocation,
    title: "Local numbers",
    body: "A real local number in the UK, US, Canada or Australia — no second phone needed.",
  },
  {
    icon: imgShield,
    title: "Improved privacy",
    body: "Keep your real number private behind a virtual one you can drop anytime.",
  },
  {
    icon: imgDollar,
    title: "Low rates",
    body: "Pay from your wallet - private numbers from $2.50/mo, shared codes from $0.45.",
  },
  {
    icon: imgFlash,
    title: "Instant delivery",
    body: "Codes and calls land in your inbox in real time, no waiting around.",
  },
];

export default function Hero() {
  return (
    <div data-hero className="relative w-full min-h-[900px] bg-[#f9f9fa] overflow-hidden">
      <img
        src={imgBg}
        alt=""
        aria-hidden
        className="absolute inset-x-0 top-0 h-[820px] w-full object-cover pointer-events-none select-none"
      />

      <Navbar />

      <section className="relative pt-[112px] sm:pt-[136px] lg:pt-[148px] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px]">
        <div className="mx-auto max-w-[1290px] flex flex-col lg:flex-row items-center lg:justify-between gap-12 lg:gap-10 xl:gap-16">
        <div className="flex flex-col gap-8 lg:gap-10 w-full max-w-[584px] lg:flex-1 min-[1440px]:w-[584px] min-[1440px]:flex-none shrink-0 items-center text-center lg:items-start lg:text-left">
          <div className="flex flex-col gap-3 items-center lg:items-start">
            <div
              className="hero-in inline-flex items-center justify-center gap-1.5 px-[13px] py-[9px] rounded-full border border-transparent"
              style={{
                "--i": 0,
                background:
                  "linear-gradient(#fff, #fff) padding-box, linear-gradient(92deg, #2155F5 1.96%, #7A9BFF 46.96%, #2155F5 92.83%) border-box",
              } as CSSProperties}
            >
              <img src={imgShieldSmall} alt="" className="size-4" />
              <span className="font-sans font-semibold text-sm leading-4 text-[#2155f5] whitespace-nowrap">
                Live in 4 countries, 120+ apps
              </span>
            </div>

            <h1 style={{ "--i": 1 } as CSSProperties} className="hero-in font-display font-semibold text-[40px] leading-[44px] sm:text-[56px] sm:leading-[60px] lg:text-[54px] lg:leading-[58px] xl:text-[68px] xl:leading-[70px] tracking-[-0.015em] text-[#0f1013]">
              Get a virtual phone number,{" "}
              <span className="text-[#2155f5]">instantly.</span>
            </h1>
            <p style={{ "--i": 2 } as CSSProperties} className="hero-in font-sans text-base leading-6 sm:text-lg sm:leading-7 text-[#494c52] max-w-[566px]">
              Get a real phone number you can use across every device. No SIM
              card, no second phone — just SMS and calls, ready in seconds.
            </p>
          </div>

          <div style={{ "--i": 3 } as CSSProperties} className="hero-in flex flex-col gap-5 items-center lg:items-start">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <a href="https://apps.apple.com/gb/app/zedsms-second-phone-number/id6763044238" target="_blank" rel="noopener noreferrer">
                <img src={imgAppStore} alt="Download on the App Store" className="h-12 w-[163px]" />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.app.zedsms"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={imgGooglePlay} alt="Get it on Google Play" className="h-12 w-[163px]" />
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <span className="font-sans text-sm text-[#494c52]">
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

        <img
          src={imgHero}
          alt="Smiling woman holding her phone, with the flags of the UK, Australia, the US and Canada — the four countries ZEDSMS numbers cover"
          // the largest image above the fold: fetch it first
          fetchPriority="high"
          style={{ "--i": 4 } as CSSProperties}
          className="hero-in w-full max-w-[570px] lg:w-[44%] xl:w-[570px] lg:shrink-0 aspect-square object-cover rounded-[20px] sm:rounded-[28px] bg-[#eef1fb]"
        />
        </div>
      </section>

      <div className="relative mt-10 lg:mt-[52px] mb-10 lg:mb-0 px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px]">
      <div data-hero-features className="mx-auto max-w-[1290px] bg-white rounded-3xl shadow-[0px_24px_64px_0px_rgba(193,193,214,0.16)] grid grid-cols-1 sm:grid-cols-2 lg:flex items-start lg:items-center justify-center gap-x-10 gap-y-8 lg:gap-[52px] px-6 sm:px-10 py-8 lg:py-7">
        {features.map((f) => (
          <div key={f.title} className="flex-1 flex flex-col items-center gap-4 lg:gap-6 text-center">
            <div className="relative flex items-center justify-center size-16 rounded-full bg-gradient-to-b from-[#2155f5] to-[#698dfb]">
              <img src={f.icon} alt="" className="size-7" />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full shadow-[inset_0_-3px_12px_rgba(255,255,255,0.24)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-display font-medium text-xl leading-7 text-[#0f1013]">
                {f.title}
              </h3>
              <p className="font-sans text-sm leading-5 text-[#494c52]">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
