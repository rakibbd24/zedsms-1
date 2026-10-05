import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import imgChevron from "../assets/pricing/calc/icon-chevron-down.svg";

export type Country = {
  code: string;
  name: string;
  flag: string;
};

type Props<T extends Country> = {
  countries: T[];
  value: T;
  onChange: (country: T) => void;
  /** Defaults to rendering `flag` as an <img src>. Pass this to render emoji flags, logos, or anything else instead. */
  renderFlag?: (country: T) => ReactNode;
  /** Extra text to match against when searching (e.g. a category), beyond name/code. */
  searchText?: (country: T) => string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Tailwind max-height class for the scrollable list — defaults to a short list; pass a taller one for long datasets. */
  listMaxHeightClass?: string;
  /** Controlled open state, so a parent can ensure only one dropdown in a group is open at a time. Falls back to internal state when omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const defaultRenderFlag = (c: Country) => (
  <img src={c.flag} alt="" className="size-6 shrink-0 rounded-full object-cover" />
);

export default function CountrySelect<T extends Country>({
  countries,
  value,
  onChange,
  renderFlag,
  searchText,
  searchPlaceholder = "Search countries...",
  emptyMessage = "No countries found",
  listMaxHeightClass = "max-h-[240px]",
  open: openProp,
  onOpenChange,
}: Props<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setInternalOpen(next));

  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const flag = renderFlag ?? defaultRenderFlag;

  const q = query.trim().toLowerCase();
  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (searchText?.(c).toLowerCase().includes(q) ?? false),
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
    else setQuery("");
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen(!open)}
        className="bg-white border border-[#e6e6e6] flex h-[60px] w-full items-center justify-between p-3 rounded-xl transition-colors hover:border-[#2155f5]/40"
      >
        <span className="flex gap-3 items-center min-w-0">
          {flag(value)}
          <span className="font-sans font-medium text-base leading-6 text-[#0f1013] truncate">{value.name}</span>
        </span>
        <img
          src={imgChevron}
          alt=""
          className={`size-4 shrink-0 transition-transform duration-200 ${open ? "-rotate-90" : "rotate-90"}`}
        />
      </button>

      <div
        id={listboxId}
        role="listbox"
        aria-label="Select an option"
        className={`absolute left-0 top-[calc(100%+12px)] z-[100] w-full origin-top rounded-2xl border border-[#e6e6e6] bg-white p-2 shadow-[0px_24px_32px_0px_rgba(193,193,214,0.16)] transition-all duration-200 ease-out ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative mb-2">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8d94]"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 14L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-[#e6e6e6] bg-[#f9f9fa] py-2.5 pl-9 pr-3 font-sans text-sm leading-5 text-[#0f1013] outline-none placeholder:text-[#8a8d94] focus:border-[#2155f5]/50"
          />
        </div>

        <ul className={`flex ${listMaxHeightClass} flex-col gap-0.5 overflow-y-auto`}>
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center font-sans text-sm text-[#8a8d94]">{emptyMessage}</li>
          )}
          {filtered.map((c) => {
            const selected = c.code === value.code;
            return (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    selected ? "bg-[#eef1fb]" : "hover:bg-[#f9f9fa]"
                  }`}
                >
                  {flag(c)}
                  <span className="font-sans font-medium text-base leading-6 text-[#0f1013] truncate">{c.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
