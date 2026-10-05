import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  open: boolean;
  id?: string;
  children: ReactNode;
};

// Animates height via max-height, measured from the content so there's no magic number.
export default function Collapse({ open, id, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const [initialMaxHeight] = useState(open ? "none" : "0px");

  useLayoutEffect(() => {
    const el = ref.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!mounted.current || reduced) {
      mounted.current = true;
      el.style.maxHeight = open ? "none" : "0px";
      return;
    }

    if (open) {
      el.style.maxHeight = `${el.scrollHeight}px`;
      const release = (e: TransitionEvent) => {
        // Let content reflow freely once fully open (e.g. on resize)
        if (e.propertyName === "max-height" && el.getAttribute("aria-hidden") === "false") {
          el.style.maxHeight = "none";
        }
      };
      el.addEventListener("transitionend", release, { once: true });
      return () => el.removeEventListener("transitionend", release);
    }

    // Closing from "none": pin the current height first so the transition has a start value
    el.style.maxHeight = `${el.scrollHeight}px`;
    void el.offsetHeight;
    el.style.maxHeight = "0px";
  }, [open]);

  return (
    <div ref={ref} id={id} className="collapsible" aria-hidden={!open} inert={!open} style={{ maxHeight: initialMaxHeight }}>
      {children}
    </div>
  );
}
