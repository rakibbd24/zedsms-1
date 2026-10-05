import { Fragment } from "react";
import imgDivider from "../assets/stats/divider.svg";

const stats = [
  // Figma reads "Sountries live" — typo corrected.
  { value: "04", label: "Countries live" },
  { value: "120+", label: "Supported services" },
  { value: "<10s", label: "Typical code delivery" },
  { value: "24/7", label: "Number availability" },
];

export default function Stats() {
  return (
    <section className="relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-12 lg:py-[60px]">
      <dl className="mx-auto max-w-[1290px] grid grid-cols-2 gap-x-6 gap-y-10 lg:flex lg:items-center lg:justify-between">
        {stats.map((s, i) => (
          <Fragment key={s.label}>
            {i > 0 && (
              <img src={imgDivider} alt="" aria-hidden className="hidden lg:block h-[42px] w-0.5 shrink-0" />
            )}
            <div className="flex flex-col-reverse items-center gap-2 text-center lg:w-[210px] lg:shrink-0">
              <dt className="font-sans text-sm leading-5 sm:text-base sm:leading-6 text-[#494c52]">{s.label}</dt>
              <dd className="font-display font-semibold text-[40px] leading-[44px] sm:text-[52px] sm:leading-[56px] tracking-[-0.02em] text-[#0f1013]">
                {s.value}
              </dd>
            </div>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
