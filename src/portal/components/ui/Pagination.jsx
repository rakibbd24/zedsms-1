import { Icon } from "../Icon";

const PageBtn = ({ children, onClick, disabled, active, label }) => (
  <button onClick={onClick} disabled={disabled} aria-label={label} aria-current={active ? "page" : undefined} style={{ minWidth: 32, height: 32, padding: "0 8px", borderRadius: 8, fontSize: 13, fontWeight: 550,
    background: active ? "var(--accent)" : "var(--surface)", color: active ? "#fff" : "var(--text)", border: `1px solid ${active ? "transparent" : "var(--border)"}`,
    display: "inline-flex", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer", pointerEvents: disabled ? "none" : undefined }}>{children}</button>
);

// A window of page numbers around the current one — histories can run to many pages.
const pageWindow = (current, last, span = 2) => {
  const from = Math.max(1, Math.min(current - span, last - span * 2));
  const to = Math.min(last, Math.max(current + span, span * 2 + 1));
  const out = [];
  for (let p = from; p <= to; p++) out.push(p);
  return out;
};

// prev · numbered pages · next; renders nothing for a single page
export const Pagination = ({ page, lastPage, onChange }) => {
  if (lastPage <= 1) return null;
  return (
    <div className="tnum" style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <PageBtn label="Previous page" onClick={() => onChange(page - 1)} disabled={page <= 1}><Icon name="chevL" size={15} /></PageBtn>
      {pageWindow(page, lastPage).map((p) => (
        <PageBtn key={p} onClick={() => onChange(p)} active={p === page}>{p}</PageBtn>
      ))}
      <PageBtn label="Next page" onClick={() => onChange(page + 1)} disabled={page >= lastPage}><Icon name="chevR" size={15} /></PageBtn>
    </div>
  );
};
