import React from "react";
import { Icon } from "../Icon";
import { copyText } from "../../lib/clipboard";

// Copyable verification code chip — the centerpiece UX
export const CodeChip = ({ code, size = "md" }) => {
  const [copied, setCopied] = React.useState(false);
  if (!code) return null;
  const copy = (e) => {
    e.stopPropagation();
    copyText(code).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  const dims = size === "lg" ? { h: 40, fs: 18, px: 14 } : { h: 32, fs: 14.5, px: 11 };
  return (
    <button onClick={copy} title="Copy code"
      style={{ display: "inline-flex", alignItems: "center", gap: 9, height: dims.h, padding: `0 ${dims.px}px`, borderRadius: 10,
        background: copied ? "var(--success-soft)" : "var(--accent-soft)", border: `1px solid ${copied ? "transparent" : "var(--accent-border)"}`,
        color: copied ? "var(--success)" : "var(--accent)", transition: "all 0.18s ease" }}>
      <span className="mono" style={{ fontSize: dims.fs, fontWeight: 600, letterSpacing: "0.08em" }}>{code}</span>
      <span style={{ display: "flex", opacity: 0.85 }}>
        <Icon name={copied ? "check" : "copy"} size={size === "lg" ? 16 : 14} strokeWidth={2} />
      </span>
    </button>
  );
};
