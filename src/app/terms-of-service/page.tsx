import TermsOfService from "../../views/TermsOfService";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  path: "/terms-of-service",
  title: "Terms & Conditions",
  description:
    "The terms for using ZEDSMS virtual phone numbers: who can use the service, acceptable use, credit and payments, refunds, disputes and account suspension.",
});

export default function Page() {
  return <TermsOfService />;
}
