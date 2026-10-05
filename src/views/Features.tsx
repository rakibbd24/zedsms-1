import { type CSSProperties } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Coverage from "../components/Coverage";
import Cta from "../components/Cta";
import Footer from "../components/Footer";
import { useReveal } from "../hooks/useReveal";

// images live in public/assets/ (served from the site root)
const imgBg = "/assets/shared/cloud-background.webp";
const imgPhoto = "/assets/features/woman-checking-phone.webp";
const imgLockBubble = "/assets/features/secure-message-bubble.webp";
const imgMessageLock = "/assets/features/icon-message-lock.svg";
const imgCall = "/assets/features/icon-call.svg";
const imgLockPassword = "/assets/features/icon-lock-password.svg";
const imgFlash = "/assets/features/icon-flash.svg";
const imgDevices = "/assets/features/icon-devices.svg";
const imgRefresh = "/assets/features/icon-refresh.svg";
const imgArrowUpDown = "/assets/features/icon-arrow-up-down.svg";
const imgDollarSend = "/assets/features/icon-dollar-send.svg";
const imgShare = "/assets/features/icon-share.svg";
const imgArrowWhite = "/assets/features/icon-arrow-right-white.svg";
const imgArrowBlue = "/assets/features/icon-arrow-right-blue.svg";

const features = [
  {
    icon: imgMessageLock,
    title: "Secure texting",
    body: "Send and receive SMS on your own number, kept separate from your personal line.",
  },
  {
    icon: imgCall,
    title: "Calling",
    body: "Make and receive calls on your ZEDSMS number, kept separate from your personal line.",
  },
  {
    icon: imgLockPassword,
    title: "Private numbers",
    body: "Separate each area of your life with a private number from ZEDSMS — the perfect way to stay reachable without sharing your real one.",
  },
  {
    icon: imgFlash,
    title: "Instant delivery",
    body: "Codes and calls land in your inbox in real time, typically under 10 seconds.",
  },
  {
    icon: imgDevices,
    title: "Multiple devices",
    body: "Check your ZEDSMS inbox from the web app, iOS, Android or Telegram — everything stays in sync.",
  },
  {
    icon: imgRefresh,
    title: "Renew or release anytime",
    body: "Private numbers auto-renew weekly from your wallet. Done with one? Release it and pick a new number in seconds.",
  },
  {
    icon: imgArrowUpDown,
    title: "Number transfers",
    body: "Send a private number to another ZEDSMS user for free — no extra fees, no waiting.",
  },
  {
    icon: imgDollarSend,
    title: "Balance transfers",
    body: "Move wallet balance between ZEDSMS accounts for free, anytime you need to.",
  },
  {
    icon: imgShare,
    title: "Shared numbers",
    body: "Get a cheap number scoped to a single app or service, shared with other users — perfect for one-off signups and verification codes.",
    iconSize: "size-7",
  },
];

export default function Features() {
  useReveal();

  return (
    <>
      <div data-hero className="relative w-full bg-[#f9f9fa] overflow-hidden">
        <img
          src={imgBg}
          alt=""
          aria-hidden
          className="absolute inset-x-0 top-0 h-[588px] w-full object-cover pointer-events-none select-none"
        />

        <Navbar />

        <section className="relative pt-[112px] sm:pt-[136px] lg:pt-[150px] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px]">
          <div className="mx-auto max-w-[1290px] flex flex-col lg:flex-row items-center lg:justify-between gap-10 lg:gap-12 xl:gap-[127px]">
            <h1 className="hero-in w-full max-w-[593px] lg:flex-1 text-center lg:text-left font-display font-semibold text-[36px] leading-[40px] sm:text-[44px] sm:leading-[48px] xl:text-[52px] xl:leading-[56px] tracking-[-0.02em] text-[#0f1013]">
              <span className="text-[#2155f5]">A private ZEDSMS</span> number is flexible to your lifestyle and gives
              you the freedom to connect how you want.
            </h1>

            <div
              style={{ "--i": 1 } as CSSProperties}
              className="hero-in relative w-full max-w-[570px] lg:w-[44%] xl:w-[570px] lg:shrink-0 aspect-[570/424] overflow-hidden rounded-[20px] bg-[#eef1fb]"
            >
              <div className="absolute top-0 left-[-3.16%] w-[104.04%] h-[102.36%] overflow-hidden">
                <img
                  src={imgPhoto}
                  alt="Woman holding a laptop, smiling as she checks messages on her phone outside an office"
                  className="absolute top-0 left-[-0.06%] w-[126.25%] h-[114.98%] max-w-none"
                />
              </div>
              <img
                src={imgLockBubble}
                alt=""
                aria-hidden
                className="absolute left-[8.07%] top-[18.4%] w-[24.04%] h-[33.73%] object-cover object-bottom"
              />
            </div>
          </div>
        </section>
      </div>

      <section className="relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] pt-12 lg:pt-[66px] pb-12 lg:pb-[60px]">
        <div className="mx-auto max-w-[1290px] flex flex-col items-center gap-10 lg:gap-12">
          <ul className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-[30px]">
            {features.map((f) => (
              <li
                key={f.title}
                className="lift flex flex-col gap-6 bg-white border border-[#e6e6e6] rounded-3xl p-6"
              >
                <div className="relative flex items-center justify-center size-14 shrink-0 rounded-full bg-gradient-to-b from-[#2155f5] to-[#698dfb]">
                  <img src={f.icon} alt="" className={f.iconSize ?? "size-6"} />
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full shadow-[inset_0_-3px_12px_rgba(255,255,255,0.24)]"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <h3 className="font-display font-medium text-xl leading-7 sm:text-2xl text-[#0f1013]">
                    {f.title}
                  </h3>
                  <p className="font-sans text-sm leading-5 text-[#494c52]">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/auth/signup"
              className="lift inline-flex items-center justify-center gap-2.5 bg-[#2155f5] hover:bg-[#1a46d1] rounded-full px-6 py-3 font-display font-medium text-sm leading-5 text-white whitespace-nowrap"
            >
              Get Started
              <img src={imgArrowWhite} alt="" className="size-4" />
            </Link>
            <Link
              to="/pricing"
              className="lift inline-flex items-center justify-center gap-2.5 bg-white hover:bg-[#eef1fb] border border-[#e6e6e6] rounded-full px-6 py-3 font-display font-medium text-sm leading-5 text-[#2155f5] whitespace-nowrap"
            >
              See pricing
              <img src={imgArrowBlue} alt="" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <Coverage />
      <Cta />
      <Footer />
    </>
  );
}
