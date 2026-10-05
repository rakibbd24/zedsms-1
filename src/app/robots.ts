import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

// Keep crawlers out of the signed-in portal and payment returns. The /auth pages stay
// crawlable on purpose: they carry a noindex tag, which Google can only see if it may fetch them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/app", "/verification-success", "/stripe/", "/crypto/", "/mixpay/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
