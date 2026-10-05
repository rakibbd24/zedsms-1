import ReactDOM from "react-dom";
import { Icon } from "../Icon";

// generic modal — portaled to <body> so it escapes any transformed ancestor (view-enter transforms
// would otherwise trap position:fixed and clip the backdrop to the content area).
export const Modal = ({ open, onClose, title, subtitle, children, width = 430 }) => {
  if (!open) return null;
  const overlay = (
    <div onClick={onClose} className="modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,9,12,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="modal-card" style={{ width, maxWidth: "100%", maxHeight: "calc(100dvh - 32px)", overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, boxShadow: "var(--shadow-pop)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 20px 0" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 600, letterSpacing: "-0.015em" }}>{title}</h3>
            {subtitle && <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ color: "var(--text-faint)", display: "flex", marginTop: 2 }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(overlay, document.body);
};
