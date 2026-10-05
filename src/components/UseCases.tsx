import { useState } from "react";
import Collapse from "./Collapse";
import imgMeeting from "../assets/use-cases/use-case-meeting-new-people.webp";
import imgMarketplace from "../assets/use-cases/use-case-marketplace.webp";
import imgFamily from "../assets/use-cases/use-case-family.webp";
import imgTravel from "../assets/use-cases/use-case-travel.webp";
import imgVerification from "../assets/use-cases/use-case-verification.webp";

const useCases = [
  {
    title: "Meeting new people",
    body: "Swap numbers with someone you just met online without swapping your actual line. Keep a private zedsms number for dating apps and let it go whenever you want.",
    image: imgMeeting,
    alt: "Woman smiling at a message on her phone while sitting in a café",
  },
  {
    title: "Marketplace listings",
    body: "Listing a couch or a spare room? Put a private number on the ad instead of your real one, and stop taking calls about it once it's sold.",
    image: imgMarketplace,
    alt: "Phone showing a buyer and seller chatting about a sofa listing, with the sofa in the room behind",
  },
  {
    title: "Family abroad",
    body: "Get a local number in a parent or sibling's country so calls home connect like a local call, not an international one.",
    image: imgFamily,
    alt: "Grandmother smiling on a video call with her family on her phone",
  },
  {
    title: "Traveling somewhere new",
    body: "Pick up a local number for the trip so hotels, drivers and rentals can reach you — no roaming charges, no giving out your home number.",
    image: imgTravel,
    alt: "Traveller in a sun hat with a camera, checking her phone in a new city",
  },
  {
    title: "One-time verification codes",
    body: "Signing up for something you'll use once? Rent a shared number just for the code, and keep your main number out of every app's database.",
    image: imgVerification,
    alt: "Hand holding a phone showing a verification code screen",
  },
];

export default function UseCases() {
  const [active, setActive] = useState(0);

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
              Use Case
            </span>
          </div>

          <div className="flex flex-col items-center gap-5 max-w-[730px]">
            <h2 className="font-display font-semibold text-[36px] leading-[40px] sm:text-[44px] sm:leading-[48px] lg:text-[52px] lg:leading-[56px] tracking-[-0.02em] text-[#0f1013]">
              A number for every situation
            </h2>
            <p className="font-sans text-base leading-6 sm:text-lg sm:leading-7 text-[#494c52]">
              Pick a scenario to see how a second number helps.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col lg:flex-row lg:items-center gap-6 lg:gap-[30px]">
          <div
            data-reveal-target
            className="relative w-full aspect-[740/580] lg:aspect-auto lg:h-[580px] lg:w-auto lg:flex-1 lg:min-w-0 overflow-hidden rounded-2xl border-2 border-white"
          >
            {useCases.map((u, i) => (
              <img
                key={u.title}
                src={u.image}
                alt={i === active ? u.alt : ""}
                aria-hidden={i !== active}
                loading={i === 0 ? undefined : "lazy"}
                decoding="async"
                className={`crossfade absolute inset-0 size-full object-cover ${
                  i === active ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>

          <ul className="flex flex-col gap-3 sm:gap-4 w-full lg:w-[420px] xl:w-[520px] lg:shrink-0">
            {useCases.map((u, i) => {
              const open = i === active;
              return (
                <li key={u.title}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setActive(i)}
                    className={`lift w-full text-left bg-white border rounded-2xl px-5 sm:px-6 py-5 sm:py-7 ${
                      open
                        ? "border-[#2155f5] ring-1 ring-inset ring-[#2155f5] pointer-events-none"
                        : "border-[#e6e6e6] hover:border-[#2155f5]/40"
                    }`}
                  >
                    <span
                      className={`block font-display font-medium text-xl leading-7 sm:text-2xl ${
                        open ? "text-[#0f1013]" : "text-[#494c52]"
                      }`}
                    >
                      {u.title}
                    </span>
                    <Collapse open={open}>
                      <span className="block pt-4 font-sans text-base leading-6 text-[#494c52]">
                        {u.body}
                      </span>
                    </Collapse>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
