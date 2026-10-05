"use client";

import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import NumberTypes from "../components/NumberTypes";
import UseCases from "../components/UseCases";
import Coverage from "../components/Coverage";
import CoreFeatures from "../components/CoreFeatures";
import Pricing from "../components/Pricing";
import Stats from "../components/Stats";
import Faq from "../components/Faq";
import Cta from "../components/Cta";
import Footer from "../components/Footer";
import { useEffect } from "react";
import { useReveal } from "../hooks/useReveal";

export default function Home() {
  useReveal();
  // /#faq (footer link): scroll to the section once the page has rendered
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Hero />
      <HowItWorks />
      <NumberTypes />
      <UseCases />
      <Coverage />
      <CoreFeatures />
      <Pricing />
      <Stats />
      <Faq />
      <Cta />
      <Footer />
    </>
  );
}
