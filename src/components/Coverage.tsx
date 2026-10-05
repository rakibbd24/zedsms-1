import imgGlobe from "../assets/coverage/coverage-globe.webp";

export default function Coverage() {
  return (
    <section className="relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-12 lg:py-[60px]">
      <div className="mx-auto max-w-[1290px] flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10 lg:min-h-[634px] bg-white border border-[#e6e6e6] rounded-[20px] sm:rounded-[28px] overflow-hidden px-5 pt-8 pb-5 sm:px-10 sm:pt-12 sm:pb-8 lg:py-12 lg:pl-[60px] lg:pr-10 xl:pr-[60px]">
        <div className="flex flex-col gap-4 items-center text-center lg:items-start lg:text-left w-full max-w-[470px] lg:shrink-0 lg:w-[400px] xl:w-[470px]">
          <div
            className="inline-flex items-center justify-center gap-1.5 px-[13px] py-[9px] rounded-full border border-transparent"
            style={{
              background:
                "linear-gradient(#fff, #fff) padding-box, linear-gradient(92deg, #2155F5 1.96%, #7A9BFF 46.96%, #2155F5 92.83%) border-box",
            }}
          >
            <span className="font-sans font-semibold text-sm leading-4 text-[#2155f5] whitespace-nowrap">
              Coverage
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <h2 className="font-display font-semibold text-[30px] leading-[36px] sm:text-[36px] sm:leading-[40px] xl:text-[40px] xl:leading-[44px] tracking-[-0.015em] text-[#0f1013]">
              Live in 4 countries, growing every quarter
            </h2>
            <p className="font-sans text-base leading-6 text-[#494c52]">
              Pick a number from any live country — same inbox, same pricing model, same instant delivery.
            </p>
          </div>
        </div>

        <img
          data-reveal-target
          src={imgGlobe}
          loading="lazy"
          decoding="async"
          alt="Globe showing live numbers in the United Kingdom, Canada, United States and Australia"
          className="w-full max-w-[581px] aspect-[581/538] object-contain lg:flex-1 lg:min-w-0"
        />
      </div>
    </section>
  );
}
