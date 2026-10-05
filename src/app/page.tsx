import Home from "../views/Home";
import JsonLd from "../components/JsonLd";
import { faqs } from "../components/faqData";
import { APP_STORE_URL, PLAY_STORE_URL, SITE_NAME, pageMetadata } from "../lib/seo";

export const metadata = pageMetadata({
  path: "/",
  absoluteTitle: true,
  title: "Virtual Phone Number for SMS Verification — ZEDSMS",
  description:
    "Get a private or shared phone number in the US, UK, Canada or Australia in minutes. Receive SMS codes online, by email or Telegram — no SIM, no ID.",
});

// the FAQ section as it appears on the page (same source: components/faqData.ts)
const FAQ_PAGE = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};
const APPS = [
  { os: "iOS", url: APP_STORE_URL },
  { os: "Android", url: PLAY_STORE_URL },
].map(({ os, url }) => ({
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: `${SITE_NAME} — Second Phone Number`,
  operatingSystem: os,
  applicationCategory: "CommunicationApplication",
  url,
}));

export default function Page() {
  return (
    <>
      <JsonLd data={[FAQ_PAGE, ...APPS]} />
      <Home />
    </>
  );
}
