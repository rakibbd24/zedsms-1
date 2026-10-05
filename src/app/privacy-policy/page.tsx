import PrivacyPolicy from "../../views/PrivacyPolicy";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  path: "/privacy-policy",
  title: "Privacy Policy",
  description: "How ZEDSMS collects, uses and protects your personal data when you use our virtual phone numbers, website and apps.",
});

export default function Page() {
  return <PrivacyPolicy />;
}
