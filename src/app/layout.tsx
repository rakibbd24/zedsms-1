import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";
import JsonLd from "../components/JsonLd";
import { APP_STORE_URL, PLAY_STORE_URL, SITE_NAME, SITE_URL } from "../lib/seo";
import "../index.css";

// Site-wide defaults (from the original index.html). Landing pages set their own title,
// description and canonical URL via lib/seo.ts pageMetadata(); "%s | ZEDSMS" is the title template.
const OG_TITLE = "ZEDSMS — Your second phone number, ready in minutes";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ZEDSMS — Second phone number for SMS verification", template: `%s | ${SITE_NAME}` },
  applicationName: SITE_NAME,
  description:
    "Get a private or shared phone number in the US, UK, Canada or Australia in minutes. Receive SMS codes online, by email or Telegram — no SIM, no ID.",
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
  openGraph: {
    type: "website",
    siteName: "ZEDSMS",
    title: OG_TITLE,
    description: "Private & shared numbers for SMS verification in the US, UK, Canada and Australia. No SIM, no ID — just an email.",
    url: "https://zedsms.com/",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: OG_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: "Private & shared numbers for SMS verification in the US, UK, Canada and Australia.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2155f5",
};

// who runs the site — read by search engines for the brand panel / logo
const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  email: "support@zedsms.com",
  sameAs: [APP_STORE_URL, PLAY_STORE_URL],
};
const WEBSITE = { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={[ORGANIZATION, WEBSITE]} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
