

// Placeholder rows shown while a number's messages load, so the panel keeps its
// shape instead of flashing an empty state and then jumping to content.
export const MessageSkeleton = ({ rows = 4 }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border)", opacity: 1 - i * 0.18 }}>
        <div className="loading-shimmer" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="loading-shimmer" style={{ height: 11, width: `${38 + (i % 3) * 12}%`, borderRadius: 6, marginBottom: 9 }} />
          <div className="loading-shimmer" style={{ height: 9, width: "92%", borderRadius: 6, marginBottom: 6 }} />
          <div className="loading-shimmer" style={{ height: 9, width: `${55 + (i % 2) * 20}%`, borderRadius: 6 }} />
        </div>
      </div>
    ))}
  </div>
);
