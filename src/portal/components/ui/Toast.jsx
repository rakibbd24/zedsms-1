import { Icon } from "../Icon";

// toast stack
export const Toast = ({ toast }) => {
  if (!toast) return null;
  const tones = { success: "var(--success)", danger: "var(--danger)", accent: "var(--accent)" };
  return (
    <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 300, display: "flex", alignItems: "center", gap: 11, padding: "12px 17px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-pop)", animation: "popIn 0.2s ease both", maxWidth: "calc(100vw - 40px)" }}>
      <span style={{ width: 22, height: 22, borderRadius: 99, background: tones[toast.tone] || tones.success, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={toast.tone === "danger" ? "info" : "check"} size={14} strokeWidth={2.4} />
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 450 }}>{toast.msg}</span>
    </div>
  );
};
