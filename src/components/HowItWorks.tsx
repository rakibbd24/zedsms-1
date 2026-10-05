import imgCountry from "../assets/how-it-works/step-choose-country.png";
import imgNumber from "../assets/how-it-works/step-pick-number.png";
import imgPlan from "../assets/how-it-works/step-choose-plan.png";

const steps = [
  {
    title: "Pick a country",
    body: "Search the UK, US, Canada, Australia - for US numbers, choose a state for a local area code.",
    image: imgCountry,
    imageAspect: "aspect-[362/264]",
    alt: "Country list with United States selected",
  },
  {
    title: "Choose your number",
    body: "Browse a list of available numbers for that country and pick the one you want.",
    image: imgNumber,
    imageAspect: "aspect-[362/264]",
    alt: "List of available phone numbers with one selected",
  },
  {
    title: "Pick a plan & pay",
    body: "Choose 1 month, 3, 6 or 12 months — longer plans unlock bigger discounts — then pay from your wallet.",
    image: imgPlan,
    imageAspect: "aspect-[362/240]",
    alt: "Plan selector with 3 month plan selected and a Pay Now button",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative w-full bg-[#f9f9fa] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] pt-12 pb-14 lg:pt-[60px] lg:pb-[70px]">
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
              How it works
            </span>
          </div>

          <div className="flex flex-col items-center gap-5 max-w-[590px]">
            <h2 className="font-display font-semibold text-[36px] leading-[40px] sm:text-[44px] sm:leading-[48px] lg:text-[52px] lg:leading-[56px] tracking-[-0.02em] text-[#0f1013]">
              Get a second phone number in 60 seconds
            </h2>
            <p className="font-sans text-base leading-6 sm:text-lg sm:leading-7 text-[#494c52]">
              No paperwork, no waiting on a carrier.
            </p>
          </div>
        </div>

        <ol className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-[30px]">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className={`lift flex flex-col gap-6 lg:h-[500px] p-6 bg-white border border-[#e6e6e6] rounded-3xl overflow-hidden ${
                i === 2 ? "md:col-span-2 md:max-w-[calc(50%-10px)] md:justify-self-center md:w-full lg:col-span-1 lg:max-w-none" : ""
              }`}
            >
              <div className="flex items-center justify-center size-[52px] shrink-0 rounded-full bg-[#2155f5]">
                <span className="font-display font-medium text-xl leading-7 text-white">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="font-display font-medium text-2xl leading-7 text-[#0f1013]">
                  {s.title}
                </h3>
                <p className="font-sans text-base leading-6 text-[#494c52]">{s.body}</p>
              </div>
              <img
                src={s.image}
                alt={s.alt}
                loading="lazy"
                decoding="async"
                className={`mt-auto w-full ${s.imageAspect} object-cover`}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
