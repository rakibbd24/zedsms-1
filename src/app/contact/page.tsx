import Contact from "../../views/Contact";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  path: "/contact",
  title: "Contact Us",
  description:
    "Get in touch with ZEDSMS support by Telegram, WhatsApp, live chat or email, or find quick answers in the Help Center.",
});

export default function Page() {
  return <Contact />;
}
