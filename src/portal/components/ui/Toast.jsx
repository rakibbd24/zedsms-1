import { Icon } from "../Icon";

// toast stack — centred with auto margins rather than left:50% + translate, which
// caps a shrink-to-fit box at half the viewport and squeezes long messages on phones
export const Toast = ({ toast }) => {
  if (!toast) return null;
  const tones = { success: "var(--success)", danger: "var(--danger)", accent: "var(--accent)" };
  return (
    <div role="status" aria-live="polite" style={{ position: "fixed", top: 16, left: 16, right: 16, margin: "0 auto", width: "fit-content", maxWidth: 440, zIndex: 300, display: "flex", alignItems: "center", gap: 11, padding: "12px 16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-pop)", animation: "popIn 0.2s ease both" }}>
      <span style={{ width: 22, height: 22, borderRadius: 99, background: tones[toast.tone] || tones.success, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={toast.tone === "danger" ? "info" : "check"} size={14} strokeWidth={2.4} />
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 450, lineHeight: 1.4, minWidth: 0, overflowWrap: "anywhere" }}>{toast.msg}</span>
    </div>
  );
};
