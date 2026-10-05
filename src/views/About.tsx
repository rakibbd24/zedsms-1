"use client";

import { type CSSProperties } from "react";
import Navbar from "../components/Navbar";
import Stats from "../components/Stats";
import Cta from "../components/Cta";
import Footer from "../components/Footer";
import { useReveal } from "../hooks/useReveal";

// images live in public/assets/ (served from the site root)
const imgBg = "/assets/shared/cloud-background.webp";
const imgHero = "/assets/about/about-hero-woman-with-app.webp";
const imgPrivacy = "/assets/about/privacy-shield.png";
const imgSpeed = "/assets/about/speed-gauge.png";
const imgPricing = "/assets/about/fair-pricing-wallet.png";

const values = [
  {
    title: "Privacy first",
    body: "A real local number in the UK, US, Canada or Australia — no second phone needed.",
    image: imgPrivacy,
    alt: "Blue shield with a padlock protecting a phone number marked as verified",
    imageClass: "h-[264px]",
  },
  {
    title: "Built for speed",
    body: "Codes and calls should arrive instantly — every part of the system is built around that.",
    image: imgSpeed,
    alt: "Speed gauge at full with a call icon and a check mark",
    imageClass: "h-[264px] rounded-xl",
  },
  {
    title: "Fair pricing",
    body: "Pay only for what you use, from your wallet, with no hidden fees or lock-in.",
    image: imgPricing,
    alt: "Wallet with coins and a shield, labelled “You're in control — transparent, simple, fair”",
    imageClass: "h-[240px] rounded-xl",
  },
];

export default function About() {
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
          <div className="mx-auto max-w-[1290px] flex flex-col gap-10 lg:gap-9">
            <div className="flex flex-col gap-6 max-w-[1050px] text-center lg:text-left items-center lg:items-start">
              <h1 className="hero-in font-display font-semibold text-[40px] leading-[44px] sm:text-[56px] sm:leading-[60px] xl:text-[68px] xl:leading-[70px] tracking-[-0.015em] text-[#0f1013]">
                We're building the simplest way to keep your real{" "}
                <span className="text-[#2155f5]">number to yourself.</span>
              </h1>
              <p
                style={{ "--i": 1 } as CSSProperties}
                className="hero-in font-sans text-base leading-6 sm:text-lg sm:leading-7 text-[#494c52]"
              >
                ZEDSMS gives you private and shared phone numbers for SMS and calls, so you can sign up, verify, and stay
                reachable without exposing your personal line.
              </p>
            </div>

            <img
              src={imgHero}
              alt="Woman holding a phone next to the ZEDSMS app, with UK, Canada, Australia and US flags"
              style={{ "--i": 2 } as CSSProperties}
              className="hero-in w-full aspect-[4/3] sm:aspect-[1290/478] object-cover rounded-2xl"
            />
          </div>
        </section>
      </div>

      <Stats />

      <section className="relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-12 lg:py-[50px]">
        <div className="mx-auto max-w-[1290px] flex flex-col gap-10 lg:gap-[60px]">
          <h2 className="text-center font-display font-semibold text-[36px] leading-[40px] sm:text-[44px] sm:leading-[48px] lg:text-[52px] lg:leading-[56px] tracking-[-0.02em] text-[#0f1013]">
            What we care about
          </h2>
          <ul className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-[30px]">
            {values.map((v) => (
              <li
                key={v.title}
                className="lift flex flex-col gap-6 lg:h-[424px] bg-white border border-[#e6e6e6] rounded-3xl p-6 overflow-hidden"
              >
                <div className="flex flex-col gap-3">
                  <h3 className="font-display font-medium text-xl leading-7 sm:text-2xl text-[#0f1013]">{v.title}</h3>
                  <p className="font-sans text-base leading-6 text-[#494c52]">{v.body}</p>
                </div>
                <img src={v.image} alt={v.alt} loading="lazy" decoding="async" className={`mt-auto w-full object-cover ${v.imageClass}`} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Cta />
      <Footer />
    </>
  );
}
