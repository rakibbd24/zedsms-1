import type { Metadata } from "next";

// Production origin — canonical URLs, sitemap, Open Graph and structured data all use it.
export const SITE_URL = "https://zedsms.com";
export const SITE_NAME = "ZEDSMS";
export const APP_STORE_URL = "https://apps.apple.com/gb/app/zedsms-second-phone-number/id6763044238";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.app.zedsms";

const OG_IMAGE = { url: "/og-image.jpg", width: 1200, height: 630, alt: "ZEDSMS — Your second phone number, ready in minutes" };

/**
 * Metadata for an indexable landing page: title, description, canonical URL and matching
 * Open Graph / Twitter tags. (Next replaces — not merges — a parent's openGraph object, so
 * the share image is repeated here rather than inherited from the layout.)
 * `title` goes through the layout's "%s | ZEDSMS" template unless `absoluteTitle` is set.
 */
export function pageMetadata({ path, title, description, absoluteTitle = false }: {
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, url: path, title: fullTitle, description, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [OG_IMAGE.url] },
  };
}

/** Pages that must never appear in search results (portal, sign-in flow, payment returns). */
export const NO_INDEX: Metadata = { robots: { index: false, follow: false } };
/** Sign-in / sign-up: kept out of results, but links on them may still be followed. */
export const NO_INDEX_FOLLOW: Metadata = { robots: { index: false, follow: true } };
