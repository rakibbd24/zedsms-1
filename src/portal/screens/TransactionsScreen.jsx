import React from "react";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Empty } from "../components/ui/Empty";
import { Pagination } from "../components/ui/Pagination";
import { copyText } from "../lib/clipboard";
import { useTransactions } from "../hooks/useTransactions";
import { TRANSACTION_STATUS } from "../api/transactions";
import { BuyNotice } from "./BuyParts";

const txDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const txTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

// Pagination is server-side, so the filter tabs narrow the page you're looking at.
const TxTab = ({ id, label, filter, onPick }) => (
  <button onClick={() => onPick(id)} style={{ height: 30, padding: "0 13px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
    background: filter === id ? "var(--surface)" : "transparent", color: filter === id ? "var(--text)" : "var(--text-muted)", boxShadow: filter === id ? "var(--shadow-sm)" : "none", border: filter === id ? "1px solid var(--border)" : "1px solid transparent" }}>{label}</button>
);

// Description in the phone list: two lines, with Show more only when the text is
// actually cut off — measured, since how much fits depends on the screen width.
const TxDesc = ({ text }) => {
  const ref = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [clamped, setClamped] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return undefined;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    // re-measure on rotation / resize
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [text, open]);
  return (
    <>
      <div ref={ref} style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.45, marginTop: 2, overflowWrap: "anywhere",
        ...(open ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }) }}>{text}</div>
      {(clamped || open) && (
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
          style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3, padding: "2px 0", fontSize: 12, fontWeight: 550, color: "var(--accent)" }}>
          {open ? "Show less" : "Show more"}
          <span style={{ display: "flex", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.16s" }}><Icon name="chevD" size={13} strokeWidth={2} /></span>
        </button>
      )}
    </>
  );
};

const TxRef = ({ id }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = () => copyText(id).then((ok) => {
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, minWidth: 0 }}>
      <span style={{ fontSize: 11.5, color: "var(--text-faint)", flexShrink: 0 }}>Ref</span>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-muted)", minWidth: 0, overflowWrap: "anywhere" }}>{id}</span>
      <button onClick={copy} title="Copy reference" aria-label="Copy reference"
        style={{ display: "flex", flexShrink: 0, padding: 3, margin: -3, color: copied ? "var(--success)" : "var(--text-faint)" }}>
        <Icon name={copied ? "check" : "copy"} size={13} strokeWidth={copied ? 2.3 : 1.8} />
      </button>
    </div>
  );
};

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export const TransactionsScreen = () => {
  const [filter, setFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isFetching, error, refetch } = useTransactions(page);

  const allRows = data?.rows || [];
  const rows = allRows.filter((t) => (filter === "all" ? true : filter === "in" ? t.amount > 0 : t.amount < 0));
  const lastPage = data?.lastPage || 1;
  const total = data?.total ?? 0;
  const curPage = data?.page || page;
  const perPage = data?.perPage || allRows.length || 0;
  const rangeStart = total === 0 ? 0 : (curPage - 1) * perPage + 1;
  const rangeEnd = Math.min(rangeStart + allRows.length - 1, total);
  const setFilterReset = (id) => setFilter(id);

  const exportCsv = () => {
    const header = ["Date", "Time", "Action", "Description", "Reference", "Amount", "Status"];
    const lines = [header.map(csvCell).join(",")].concat(
      rows.map((t) => [txDate(t.date), txTime(t.date), t.action, t.desc, t.trxId || "", t.amount.toFixed(2), (TRANSACTION_STATUS[t.status] || {}).label || t.status].map(csvCell).join(","))
    );
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `zedsms-transactions-page-${curPage}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-enter">
      <Card style={{ overflow: "hidden" }}>
        <div className="tx-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
          <div className="tx-tabs" style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", borderRadius: 10 }}>
            <TxTab id="all" label="All" filter={filter} onPick={setFilterReset} />
            <TxTab id="in" label="Incoming" filter={filter} onPick={setFilterReset} />
            <TxTab id="out" label="Outgoing" filter={filter} onPick={setFilterReset} />
          </div>
          <Button variant="ghost" size="sm" icon="receipt" onClick={exportCsv} disabled={rows.length === 0} aria-label="Export CSV" title="Export CSV"><span className="tx-export-label">Export CSV</span></Button>
        </div>

        {isLoading ? (
          <div style={{ padding: 18 }}><BuyNotice tone="accent">Loading your transactions…</BuyNotice></div>
        ) : error ? (
          <div style={{ padding: 18 }}><BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => refetch()}>Retry</Button>}>{error.message || "Could not load transactions"}</BuyNotice></div>
        ) : allRows.length === 0 ? (
          <Empty icon="receipt" label="No transactions yet — top-ups, purchases and transfers appear here" />
        ) : rows.length === 0 ? (
          <div style={{ padding: 18 }}><BuyNotice icon="search">No {filter === "in" ? "incoming" : "outgoing"} entries on this page.</BuyNotice></div>
        ) : (
          <>
          {/* phones: the table needs 600px, so the same rows render as a list instead (CSS swaps them) */}
          <div className="tx-list" style={{ opacity: isFetching ? 0.6 : 1, transition: "opacity 0.15s" }}>
            {rows.map((t) => {
              const s = TRANSACTION_STATUS[t.status] || { label: "—", tone: "neutral" };
              const incoming = t.amount > 0;
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: incoming ? "var(--success-soft)" : "var(--surface-2)", color: incoming ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={incoming ? "arrowDown" : "arrowUp"} size={15} strokeWidth={2} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.action}</span>
                      <span className="mono tnum" style={{ fontSize: 14, fontWeight: 600, color: incoming ? "var(--success)" : "var(--text)", whiteSpace: "nowrap", flexShrink: 0 }}>{incoming ? "+" : "−"}${Math.abs(t.amount).toFixed(2)}</span>
                    </div>
                    {t.desc && <TxDesc text={t.desc} />}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
                      <span className="tnum" style={{ fontSize: 11.5, color: "var(--text-faint)", whiteSpace: "nowrap" }}>{txDate(t.date)} · {txTime(t.date)}</span>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </div>
                    {/* the full reference (e.g. ZS…) on its own line — it's what support asks for */}
                    {t.trxId && <TxRef id={t.trxId} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="tx-table" style={{ overflowX: "auto", opacity: isFetching ? 0.6 : 1, transition: "opacity 0.15s" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Action", "Description", "Amount", "Status"].map((h, i) => (
                    <th key={h} style={{ textAlign: i >= 3 ? "right" : "left", padding: "11px 18px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-faint)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const s = TRANSACTION_STATUS[t.status] || { label: "—", tone: "neutral" };
                  const incoming = t.amount > 0;
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="mono tnum" style={{ padding: "14px 18px", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {txDate(t.date)}
                        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{txTime(t.date)}</div>
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: incoming ? "var(--success-soft)" : "var(--surface-2)", color: incoming ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon name={incoming ? "arrowDown" : "arrowUp"} size={14} strokeWidth={2} />
                          </span>
                          <span style={{ whiteSpace: "nowrap" }}>{t.action}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 12.5, color: "var(--text-muted)", maxWidth: 420 }}>
                        <div style={{ lineHeight: 1.5 }}>{t.desc}</div>
                        {t.trxId && <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3 }}>Ref {t.trxId}</div>}
                      </td>
                      <td className="mono tnum" style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, textAlign: "right", color: incoming ? "var(--success)" : "var(--text)", whiteSpace: "nowrap" }}>{incoming ? "+" : "−"}${Math.abs(t.amount).toFixed(2)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}><Badge tone={s.tone}>{s.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        {allRows.length > 0 && (
          <div className="tx-foot" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
            <span className="tnum" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              Showing <span style={{ fontWeight: 600, color: "var(--text)" }}>{rangeStart}–{rangeEnd}</span> of {total}
              {filter !== "all" && <span style={{ color: "var(--text-faint)" }}> · {rows.length} {filter === "in" ? "incoming" : "outgoing"} on this page</span>}
            </span>
            <Pagination page={curPage} lastPage={lastPage} onChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
};
