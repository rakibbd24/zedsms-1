import About from "../../views/About";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  path: "/about",
  title: "About Us",
  description:
    "ZEDSMS gives you private and shared phone numbers for SMS and calls, so you can sign up, verify and stay reachable without exposing your personal line.",
});

export default function Page() {
  return <About />;
}
