import { useState } from "react";
import Collapse from "./Collapse";
import imgChevron from "../assets/faq/icon-chevron-down.svg";

const faqs = [
  {
    q: "What's the difference between a private number and a shared number?",
    a: "A private number is yours alone and works with any service. A shared number is tied to one specific service (like WhatsApp or Google) and drawn from a shared pool — it's cheaper, but only receives codes for that one service.",
  },
  {
    q: "What is Zedsms?",
    a: "Zedsms is a virtual phone number app that lets you get a real phone number in the US, UK, Canada, or Australia — without a SIM card. Make and receive calls and SMS from anywhere using the web, app on iOS, Android.",
  },
  {
    q: "Can I use my number for both calls and texts?",
    a: "Private numbers support both SMS and voice. Shared numbers are SMS-only, since they're optimized for one-time verification codes.",
  },
  {
    q: "Which countries are supported?",
    a: "United Kingdom, United States, Canada and Australia today, with US numbers available by state. More countries are added regularly — sign up to see live availability.",
  },
  {
    q: "Does it work when I travel?",
    a: "Yes. Your virtual number works anywhere with an internet connection. There are no roaming fees — just connect via Wi-Fi or mobile data and you're ready to call, text, and receive messages.",
  },
  {
    q: "Will it work for SMS verification on apps and websites?",
    a: "Yes. Zedsms numbers work with most platforms and services for SMS verification. Some financial institutions may have restrictions on virtual numbers.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-12 lg:py-[60px]">
      <div className="mx-auto max-w-[1290px] flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
        <div className="flex flex-col gap-4 items-start lg:w-[320px] xl:w-[367px] lg:shrink-0">
          <div
            className="inline-flex items-center justify-center gap-1.5 px-[13px] py-[9px] rounded-full border border-transparent"
            style={{
              background:
                "linear-gradient(#fff, #fff) padding-box, linear-gradient(92deg, #2155F5 1.96%, #7A9BFF 46.96%, #2155F5 92.83%) border-box",
            }}
          >
            <span className="font-sans font-semibold text-sm leading-4 text-[#2155f5] whitespace-nowrap">
              FAQS
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <h2 className="font-display font-semibold text-[30px] leading-[36px] sm:text-[36px] sm:leading-[40px] xl:text-[40px] xl:leading-[44px] tracking-[-0.015em] text-[#0f1013]">
              Frequently asked questions
            </h2>
            <p className="font-sans text-base leading-6 text-[#494c52] max-w-[367px]">
              Find quick answers about setting up your virtual number, plans, and feature availability.
            </p>
          </div>
        </div>

        <ul className="w-full lg:max-w-[777px] lg:flex-1 border-b border-[#e6e6e6]">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            const id = `faq-${i}`;
            return (
              <li key={f.q} className="border-t border-[#e6e6e6]">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 sm:py-6 text-left font-display font-normal text-lg leading-6 sm:text-2xl sm:leading-7 text-[#0f1013] hover:text-[#2155f5] transition-colors"
                  >
                    {f.q}
                    <img
                      src={imgChevron}
                      alt=""
                      className={`size-5 shrink-0 transition-transform ${isOpen ? "-rotate-90" : "rotate-90"}`}
                    />
                  </button>
                </h3>
                <Collapse open={isOpen} id={id}>
                  <p className="pt-1 pb-6 sm:pb-8 pl-0.5 pr-9 lg:pr-[68px] font-sans text-base leading-6 text-[#494c52]">
                    {f.a}
                  </p>
                </Collapse>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
