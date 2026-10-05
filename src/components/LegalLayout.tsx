import { type CSSProperties, type ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Cta from "./Cta";
import imgBg from "../assets/shared/cloud-background.webp";

export type TocItem = { id: string; label: string };

type LegalLayoutProps = {
  title: string;
  intro: string;
  version: string;
  toc: TocItem[];
  children: ReactNode;
};

export function LegalLayout({ title, intro, version, toc, children }: LegalLayoutProps) {
  return (
    <>
      <div data-hero className="relative w-full bg-[#f9f9fa] overflow-hidden">
        <img
          src={imgBg}
          alt=""
          aria-hidden
          className="absolute inset-x-0 top-0 h-[588px] w-full object-cover pointer-events-none select-none"
        />

        <Navbar />

        <section className="relative pt-[112px] sm:pt-[136px] lg:pt-[148px] pb-10 lg:pb-14 px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px]">
          <div className="mx-auto max-w-[1290px] flex flex-col gap-4">
            <span className="text-sm font-display font-medium text-[#2155f5]">Legal</span>
            <h1 className="hero-in font-display font-semibold text-[40px] leading-[44px] sm:text-[56px] sm:leading-[60px] xl:text-[68px] xl:leading-[70px] tracking-[-0.015em] text-[#0f1013]">
              {title}
            </h1>
            <p
              style={{ "--i": 1 } as CSSProperties}
              className="hero-in font-sans text-base leading-6 sm:text-lg sm:leading-7 text-[#494c52] max-w-[720px]"
            >
              {intro}
            </p>
            <p className="font-sans text-sm text-[#494c52]">{version}</p>
          </div>
        </section>
      </div>

      <section className="w-full bg-white px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-12 lg:py-16">
        <div className="mx-auto max-w-[1290px] grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-10 lg:gap-16">
          <aside className="lg:sticky lg:top-28 self-start">
            <nav
              aria-label="On this page"
              className="rounded-2xl border border-[#e6e6e6] bg-[#f9f9fa] p-5"
            >
              <p className="font-display font-semibold text-sm text-[#0f1013] mb-3">On this page</p>
              <ol className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-lg px-3 py-1.5 font-sans text-sm text-[#494c52] hover:bg-white hover:text-[#2155f5] transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0 max-w-[820px] flex flex-col gap-12">{children}</article>
        </div>
      </section>

      <Cta />
      <Footer />
    </>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 flex flex-col gap-4">
      <h2 className="font-display font-semibold text-[26px] sm:text-[30px] leading-[1.15] tracking-[-0.02em] text-[#0f1013]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="font-display font-semibold text-lg leading-6 text-[#0f1013] mt-2">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="font-sans text-base leading-7 text-[#494c52]">{children}</p>;
}

const markers = {
  dot: "text-[#2155f5]",
  check: "text-[#2155f5]",
  cross: "text-red-500",
  warn: "text-[#e9a320]",
  danger: "text-red-500",
} as const;
const markerChars = { dot: "•", check: "✓", cross: "✗", warn: "⚠", danger: "•" } as const;

export function Bullets({
  items,
  marker = "dot",
}: {
  items: ReactNode[];
  marker?: keyof typeof markers;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 font-sans text-base leading-7 text-[#494c52]">
          <span aria-hidden className={`${markers[marker]} font-bold w-4 shrink-0 text-center`}>
            {markerChars[marker]}
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const tones = {
  info: "bg-[#f0f4ff] border-[#d4e3ff]",
  neutral: "bg-[#f9f9fa] border-[#e6e6e6]",
  danger: "bg-[#fef3f3] border-[#ffd4d4]",
  warn: "bg-[#fff8f3] border-[#ffe0cc]",
} as const;

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-6 sm:p-7 ${tones[tone]}`}>
      {title && (
        <h2 className="font-display font-semibold text-xl leading-7 text-[#0f1013] mb-4">{title}</h2>
      )}
      <div className="font-sans text-base leading-7 text-[#0f1013]">{children}</div>
    </div>
  );
}

export function NumberedList({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 font-sans text-base leading-7 text-[#0f1013]">
          <span className="text-[#2155f5] font-bold w-5 shrink-0">{i + 1}.</span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ol>
  );
}
