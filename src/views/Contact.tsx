"use client";

import { type CSSProperties, type ReactNode } from "react";
import Script from "next/script";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useReveal } from "../hooks/useReveal";
import { HELP_CENTER_URL } from "../lib/seo";

// images live in public/assets/ (served from the site root)
const imgBg = "/assets/shared/cloud-background.webp";

// Live chat is Chatwoot (app.chatwoot.com inbox). Its widget only loads on this page.
const CHATWOOT_URL = "https://app.chatwoot.com";
const CHATWOOT_TOKEN = "BDkcYuWFaSVQsCJRmzpoQwST";

type Chatwoot = { toggle: (state?: "open" | "close") => void };
declare global {
  interface Window {
    $chatwoot?: Chatwoot;
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (o: { websiteToken: string; baseUrl: string }) => void };
  }
}

function startChatwoot() {
  window.chatwootSettings = { position: "right", type: "standard", launcherTitle: "" };
  window.chatwootSDK?.run({ websiteToken: CHATWOOT_TOKEN, baseUrl: CHATWOOT_URL });
}

// The widget may still be loading when the card is clicked — open it as soon as it's ready.
function openChat() {
  if (window.$chatwoot) window.$chatwoot.toggle("open");
  else window.addEventListener("chatwoot:ready", () => window.$chatwoot?.toggle("open"), { once: true });
}

const icons: Record<string, ReactNode> = {
  telegram: (
    <path d="M21.9 4.3 18.8 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.9 13 2.3 11.6c-1-.3-1-1 .2-1.5l18-6.9c.8-.3 1.6.2 1.4 1.1Z" />
  ),
  whatsapp: (
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.3-5.1-4.5-.2-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5l.9 2.2c.1.2.1.4 0 .6l-.4.6-.4.5c-.2.2-.3.3-.1.7.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.6 1.6.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.3.7-.2l2.1 1c.3.2.5.2.6.4.1.1.1.7-.1 1.4Z" />
  ),
  chat: (
    <path d="M12 3C6.5 3 2 6.7 2 11.3c0 2.4 1.2 4.6 3.2 6.1L4.5 21l4-2c1.1.3 2.3.5 3.5.5 5.5 0 10-3.7 10-8.2S17.5 3 12 3Zm-4 9.5a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z" />
  ),
  email: (
    <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.2L4 7.3V17h16V7.3l-8 4.9Zm7.1-5.2H4.9l7.1 4.3L19.1 7Z" />
  ),
};

// Fill in each URL to show its card — channels without one stay hidden rather than
// linking to "#" (same rule as the footer's social icons). Live chat opens the widget instead.
const channels: { key: string; title: string; body: string; handle: string; url: string; chat?: boolean; cta: string; color: string }[] = [
  {
    key: "telegram",
    title: "Telegram",
    body: "Message our support team on Telegram for quick answers.",
    handle: "@zedsmshelp_bot",
    url: "https://t.me/zedsmshelp_bot",
    cta: "Open Telegram",
    color: "#229ED9",
  },
  {
    key: "whatsapp",
    title: "WhatsApp",
    body: "Chat with us on WhatsApp from your phone or desktop.",
    handle: "+44 7460 693896",
    url: "https://wa.me/447460693896",
    cta: "Open WhatsApp",
    color: "#25D366",
  },
  {
    key: "chat",
    title: "Live chat",
    body: "Talk to a support agent in real time, right in your browser.",
    handle: "",
    url: "",
    chat: true,
    cta: "Start live chat",
    color: "#2155f5",
  },
  {
    key: "email",
    title: "Email",
    body: "Write to us any time — we reply to every message.",
    handle: "support@zedsms.com",
    url: "mailto:support@zedsms.com",
    cta: "Send an email",
    color: "#0f1013",
  },
].filter((c) => c.url || c.chat);

export default function Contact() {
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

        <section className="relative pt-[112px] sm:pt-[136px] lg:pt-[148px] pb-12 lg:pb-[60px] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px]">
          <div className="mx-auto max-w-[1290px] flex flex-col gap-10 lg:gap-[60px]">
            <div className="flex flex-col gap-6 max-w-[860px] mx-auto text-center items-center">
              <h1 className="hero-in font-display font-semibold text-[40px] leading-[44px] sm:text-[56px] sm:leading-[60px] xl:text-[68px] xl:leading-[70px] tracking-[-0.015em] text-[#0f1013]">
                We're here to <span className="text-[#2155f5]">help.</span>
              </h1>
              <p
                style={{ "--i": 1 } as CSSProperties}
                className="hero-in font-sans text-base leading-6 sm:text-lg sm:leading-7 text-[#494c52]"
              >
                Pick the channel that suits you and our support team will get back to you. For quick answers, browse
                the{" "}
                <a href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer" className="text-[#2155f5] font-medium hover:underline">
                  Help Center
                </a>
                .
              </p>
            </div>

            <ul
              style={{ "--i": 2 } as CSSProperties}
              className="hero-in grid w-full grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-[30px] max-w-[1050px] mx-auto"
            >
              {channels.map((c) => {
                const cardClass = "lift group flex h-full w-full flex-col gap-6 text-left bg-white border border-[#e6e6e6] rounded-3xl p-6 sm:p-8";
                const card = (
                  <>
                    <span
                      aria-hidden
                      className="flex items-center justify-center size-14 rounded-2xl"
                      style={{ backgroundColor: `${c.color}14`, color: c.color }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">{icons[c.key]}</svg>
                    </span>
                    <div className="flex flex-col gap-3">
                      <h2 className="font-display font-medium text-xl leading-7 sm:text-2xl text-[#0f1013]">{c.title}</h2>
                      <p className="font-sans text-base leading-6 text-[#494c52]">{c.body}</p>
                      {c.handle && <p className="font-sans text-base leading-6 font-medium text-[#0f1013] break-all">{c.handle}</p>}
                    </div>
                    <span className="mt-auto inline-flex items-center gap-2 font-display font-medium text-base text-[#2155f5]">
                      {c.cta}
                      <img src="/assets/features/icon-arrow-right-blue.svg" alt="" className="size-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </>
                );
                return (
                  <li key={c.key}>
                    {c.chat ? (
                      <button type="button" onClick={openChat} className={`${cardClass} cursor-pointer`}>{card}</button>
                    ) : (
                      <a href={c.url} target={c.url.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className={cardClass}>
                        {card}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      <Footer />

      <Script id="chatwoot" src={`${CHATWOOT_URL}/packs/js/sdk.js`} strategy="afterInteractive" onLoad={startChatwoot} />
    </>
  );
}
