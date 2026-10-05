import Features from "../../views/Features";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  path: "/features",
  title: "Features — Private Numbers for SMS & Calls",
  description:
    "Send and receive SMS and calls on a private ZEDSMS number, kept separate from your personal line. Codes arrive in under 10 seconds, on every device.",
});

export default function Page() {
  return <Features />;
}
