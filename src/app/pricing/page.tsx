import PricingPage from "../../views/Pricing";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  path: "/pricing",
  title: "Pricing — US, UK, Canada & Australia Numbers",
  description:
    "Simple, transparent pricing for private and shared virtual phone numbers. No setup fees, free inbound SMS on private numbers and up to 50% off longer plans.",
});

export default function Page() {
  return <PricingPage />;
}
