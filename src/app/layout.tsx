import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";
import "../index.css";

// Site-wide defaults, copied from index.html (the Vite entry) so both builds ship the same
// head. Pages override title/description in stage 5 (SEO).
const OG_TITLE = "ZEDSMS — Your second phone number, ready in minutes";

export const metadata: Metadata = {
  metadataBase: new URL("https://zedsms.com"),
  title: "ZEDSMS — Second phone number for SMS verification",
  description:
    "Get a private or shared phone number in the US, UK, Canada or Australia in minutes. Receive SMS codes online, by email or Telegram — no SIM, no ID, just an email.",
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
