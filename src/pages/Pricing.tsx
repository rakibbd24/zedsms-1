import Navbar from "../components/Navbar";
import PricingCalculator from "../components/PricingCalculator";
import Faq from "../components/Faq";
import Cta from "../components/Cta";
import Footer from "../components/Footer";
import { useReveal } from "../hooks/useReveal";
import imgBg from "../assets/shared/cloud-background.webp";

export default function PricingPage() {
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

        <section className="relative pt-[112px] sm:pt-[136px] lg:pt-[150px] pb-10 lg:pb-10 px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px]">
          <div className="mx-auto max-w-[1290px] flex flex-col items-center gap-5 text-center">
            <h1 className="hero-in font-display font-semibold text-[40px] leading-[44px] sm:text-[56px] sm:leading-[60px] xl:text-[68px] xl:leading-[70px] tracking-[-0.015em] text-[#0f1013]">
              Simple, transparent pricing
            </h1>
            <p className="hero-in font-sans text-base leading-6 sm:text-lg sm:leading-7 text-[#494c52] max-w-[600px]">
              No hidden fees, no surprise charges. Pay only for the number you need — private or shared.
            </p>
          </div>
        </section>
      </div>

      {/* Rendered outside the hero's `overflow-hidden` wrapper (which exists only to mask
          the absolutely-positioned background image) so the service dropdown's open panel
          isn't clipped by that ancestor when it extends past the wrapper's bottom edge. */}
      <PricingCalculator />

      <Faq />
      <Cta />
      <Footer />
    </>
  );
}
