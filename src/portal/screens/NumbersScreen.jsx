import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FlagAvatar } from "../components/ui/Avatars";
import { CodeChip } from "../components/ui/CodeChip";
import { Empty } from "../components/ui/Empty";
import { Toast } from "../components/ui/Toast";
import { Pagination } from "../components/ui/Pagination";
import { useNumbers, useNumberSearch, useExtendNumber, useRestoreNumber, useRestoreNumberPrice, useTransferNumber, useRenameNumber, useReleaseNumber, useUpdateAutoRenew, useSendSmsFromNumber, useNumberExtensionPlans } from "../hooks/useNumbers";
import { useMessages } from "../hooks/useMessages";
import { useBalance } from "../hooks/useBalance";
import { numberKeyOf, numberIdOfKey } from "../lib/numberKey";
import { copyText } from "../lib/clipboard";
import { MessageSkeleton } from "./MessageSkeleton";
import { ComposeModal, ExtendModal, ReleaseModal, RenameModal, RestoreModal, TransferModal } from "./NumberModals";
import { RESTORE_WINDOW_DAYS, formatExpiryDate, isLapsed, restoreDaysLeftOf, restoreDeadlineOf } from "./numberHelpers";

export const NumbersScreen = () => {
  const navigate = useNavigate();
  const { numberKey } = useParams();
  const [filter, setFilter] = React.useState("active");
  const [typeFilter, setTypeFilter] = React.useState("all"); // 'all' | 'Private' | 'Shared'
  const { data: apiNumbers = [], isLoading: numbersLoading } = useNumbers();
  const { data: balanceData } = useBalance();
  // ?q= comes from the top-bar search
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = React.useState(urlQuery);
  React.useEffect(() => { if (urlQuery) setQuery(urlQuery); }, [urlQuery]);
  // the backend searches country, service and number across every page; debounce so typing
  // doesn't fire a request per keystroke
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);
  const { data: serverMatches } = useNumberSearch(debouncedQuery);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [modal, setModal] = React.useState(null); // 'renew' | 'restore' | 'transfer' | 'rename' | 'release' | 'compose'
  const [msgTab, setMsgTab] = React.useState("inbox"); // 'inbox' | 'sent'
  const [msgQuery, setMsgQuery] = React.useState("");
  const [msgPage, setMsgPage] = React.useState(1);
  const msgCardRef = React.useRef(null);
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const showToast = (msg, tone = "success") => { clearTimeout(toastTimer.current); setToast({ msg, tone }); toastTimer.current = setTimeout(() => setToast(null), 2600); };

  // Calculate days remaining from expiry timestamp
  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Get formatted time remaining (days, hours, or minutes)
  const getTimeRemaining = (expiryDate) => {
    if (!expiryDate) return "0d";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - today;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMinutes > 0) return `${diffMinutes}m`;
    if (diffMs > 0) return "1m";
    return "expired";
  };

  // Format time as relative (e.g., "2 min ago")
  const getRelativeTime = (dateString) => {
    if (!dateString) return "now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Normalize API numbers to component format
  const numbers = React.useMemo(() => {
    return apiNumbers.map((n) => {
      const expiryTs = n.expires_at || n.expiry;
      const daysLeft = getDaysRemaining(expiryTs);
      // Use total_sms_count from API (new endpoint has this built-in)
      const messageCount = n.total_sms_count || 0;

      // Determine type ID: check multiple possible field names
      let typeId = n.mobile_number_type_id;
      if (!typeId) {
        // Map from type field: "private" → 2, "shared" → 1
        const typeStr = (n.type || "").toLowerCase();
        typeId = typeStr.includes("private") ? 2 : 1;
      }

      const isPrivate = typeId === 2;

      const normalized = {
        id: n.id,
        // ids are per-table, so a shared and a private number can share one — select by uid
        uid: `${isPrivate ? "private" : "shared"}:${n.id}`,
        iso: n.iso || "GB",
        number: n.number || "",
        service: n.service_name || (isPrivate ? "Private" : "SMS"),
        type: isPrivate ? "Private" : "Shared",
        mobile_number_type_id: typeId,
        country: n.country || "Unknown",
        days: daysLeft,
        timeRemaining: getTimeRemaining(expiryTs),
        expiresAt: expiryTs,
        status: n.status || (daysLeft > 0 ? "active" : "expired"),
        label: n.label && n.label.trim() !== "" ? n.label : null,
        autoRenew: n.auto_renew === true || n.auto_renew === 1 || false,
        unread: messageCount
      };

      // lapsed numbers keep a grace window in which they can be reactivated
      const lapsed = isLapsed(normalized.status);
      normalized.restoreDeadline = lapsed ? restoreDeadlineOf(expiryTs) : null;
      normalized.restoreDaysLeft = lapsed ? restoreDaysLeftOf(expiryTs) : 0;
      normalized.canRestore = lapsed && !!normalized.restoreDeadline && normalized.restoreDaysLeft > 0;

      return normalized;
    });
  }, [apiNumbers]);

  // the open number lives in the URL; once one is open, switching numbers replaces
  // the history entry so Back returns to the list instead of every number viewed
  const openNumber = (n) => navigate(`/app/numbers/${numberKeyOf(n.uid)}`, { replace: !!numberKey });
  const backToList = () => navigate("/app/numbers");

  // on small screens the detail is its own page, so start it at the top
  React.useEffect(() => {
    if (numberKey && window.matchMedia("(max-width: 1080px)").matches) window.scrollTo(0, 0);
  }, [numberKey]);

  // A search looks through every number, whatever the status tab or type chip says — otherwise
  // a match sitting in another tab shows as "nothing found". The tabs return when it's cleared.
  const searchTerm = query.trim();
  const searching = searchTerm !== "";
  const needle = searchTerm.toLowerCase();
  const list = numbers
    .filter((n) => {
      if (searching || filter === "all") return true;
      if (filter === "expired") return n.status === "expired" || n.status === "disconnected";
      return n.status === filter;
    })
    .filter((n) => (searching || typeFilter === "all" ? true : n.type === typeFilter))
    .filter((n) => !searching || serverMatches?.has(n.uid) || n.number.includes(searchTerm) || n.country.toLowerCase().includes(needle) || (n.service || "").toLowerCase().includes(needle) || (n.label || "").toLowerCase().includes(needle));
  // keys are uids; plain ids still come in from the home screen shortcuts.
  // With nothing in the URL the desktop split view previews the first number.
  const current = numberKey
    ? numbers.find((n) => n.uid === numberIdOfKey(numberKey)) || numbers.find((n) => String(n.id) === numberKey)
    : list[0];

  // Get messages for current number
  const { data: msgData, isLoading: messagesLoading, isFetching: messagesFetching } = useMessages(current?.id, msgPage, current?.mobile_number_type_id);
  const rawMessages = React.useMemo(() => msgData?.rows || [], [msgData]);
  const msgLastPage = msgData?.lastPage || 1;
  const msgTotal = msgData?.total || 0;
  const goMsgPage = (p) => {
    setMsgPage(p);
    msgCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Normalize messages from API - separate incoming and outgoing
  const { incomingMessages, outgoingMessages } = React.useMemo(() => {
    const incoming = [];
    const outgoing = [];

    const extractCode = (body) => {
      if (!body) return "";
      // Match 4-6 digit codes, or codes with dashes like "729-301"
      const codeMatch = body.match(/(\d{4,6}|\d{3}-\d{3}|\d{2}-\d{4})/);
      return codeMatch ? codeMatch[0] : "";
    };

    rawMessages.forEach((m) => {
      const bodyText = m.sms_content || m.message_body || m.body || "";
      const normalized = {
        id: m.id,
        numberId: current?.id,
        body: bodyText,
        time: getRelativeTime(m.created_at || m.date_time),
        code: m.otp_code || m.code || extractCode(bodyText),
        unread: !m.is_read,
        color: m.color
      };

      // Separate based on direction
      if (m.direction === "outgoing") {
        outgoing.push({
          ...normalized,
          to: m.to_number || "Unknown",
          status: m.status === 1 ? "delivered" : "sending"
        });
      } else {
        // For incoming messages, try to extract service name
        const serviceName = m.service_name ||
                           (bodyText?.toLowerCase().includes("whatsapp") ? "WhatsApp" :
                            bodyText?.toLowerCase().includes("instagram") ? "Instagram" :
                            bodyText?.toLowerCase().includes("uber") ? "Uber" :
                            bodyText?.toLowerCase().includes("code") || bodyText?.toLowerCase().includes("verification") ? "Verification" :
                            (m.from_number || m.sms_from || m.from || "Unknown"));

        incoming.push({
          ...normalized,
          from: serviceName,
          letter: serviceName[0].toUpperCase()
        });
      }
    });

    return { incomingMessages: incoming, outgoingMessages: outgoing };
  }, [rawMessages, current?.id]);

  const thread = incomingMessages;
  const sentThread = outgoingMessages;
  const isPrivate = !!current && current.type === "Private";
  // reset the message view whenever the selected number changes
  React.useEffect(() => { setMsgTab("inbox"); setMsgQuery(""); setMsgPage(1); }, [numberKey]);

  // Initialize mutations and queries
  const extendMutation = useExtendNumber();
  const restoreMutation = useRestoreNumber();
  const transferMutation = useTransferNumber();
  const renameMutation = useRenameNumber();
  const releaseMutation = useReleaseNumber();
  const autoRenewMutation = useUpdateAutoRenew();
  const sendSmsMutation = useSendSmsFromNumber();
  const { data: extensionPlans = [], isLoading: extensionPlansLoading } = useNumberExtensionPlans(modal === "renew" ? current?.id : null, current?.mobile_number_type_id);
  const { data: restorePrice, isLoading: restorePriceLoading, error: restorePriceError } = useRestoreNumberPrice(modal === "restore" ? current?.id : null);

  // ---- actions ----
  const doExtend = (rentTimeId) => {
    if (current) {
      extendMutation.mutate({ numberId: current.id, plan: rentTimeId, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setModal(null);
          showToast(`${current.label || current.number} extended`);
        },
        onError: (err) => showToast(err?.message || "Failed to extend number", "danger")
      });
    }
  };

  const doRestore = () => {
    if (current) {
      const lbl = current.label || current.number;
      restoreMutation.mutate(current.id, {
        onSuccess: () => {
          setModal(null);
          showToast(`${lbl} reactivated`);
        },
        onError: (err) => showToast(err?.message || "Failed to reactivate number", "danger")
      });
    }
  };

  const doTransfer = (to) => {
    if (current && isLapsed(current.status)) {
      showToast("Expired numbers can't be transferred — reactivate it first", "danger");
      return;
    }
    if (current) {
      const lbl = current.number;
      transferMutation.mutate({ numberId: current.id, toZedId: to, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setModal(null);
          showToast(`${lbl} transferred to ${to}`, "accent");
        },
        onError: (err) => showToast(err?.message || "Failed to transfer number", "danger")
      });
    }
  };

  const doRename = (label) => {
    if (current) {
      renameMutation.mutate({ numberId: current.id, label, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setModal(null);
          showToast(label ? `Label saved` : `Label removed`);
        },
        onError: (err) => showToast(err?.message || "Failed to rename number", "danger")
      });
    }
  };

  const doRelease = () => {
    if (current) {
      const lbl = current.number;
      releaseMutation.mutate({ numberId: current.id, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setModal(null);
          showToast(`${lbl} released`, "danger");
          backToList();
        },
        onError: (err) => showToast(err?.message || "Failed to release number", "danger")
      });
    }
  };

  const toggleAuto = () => {
    if (current) {
      const next = !current.autoRenew;
      autoRenewMutation.mutate({ numberId: current.id, enabled: next, typeId: current.mobile_number_type_id }, {
        onSuccess: () => {
          setMenuOpen(false);
          showToast(next ? "Auto-renew turned on" : "Auto-renew turned off", next ? "success" : "danger");
        },
        onError: (err) => showToast(err?.message || "Failed to update auto-renew", "danger")
      });
    }
  };

  const doSend = ({ to, body }) => {
    if (current) {
      sendSmsMutation.mutate({ numberId: current.id, to, body }, {
        onSuccess: () => {
          setModal(null);
          setMsgTab("inbox");
          showToast(`Message sent to ${to}`);
        },
        onError: () => showToast("Failed to send SMS", "danger")
      });
    }
  };

  const Tab = ({ id, label, count }) => (
    <button onClick={() => setFilter(id)} style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
      background: filter === id ? "var(--surface)" : "transparent", color: filter === id ? "var(--text)" : "var(--text-muted)", boxShadow: filter === id ? "var(--shadow-sm)" : "none", border: filter === id ? "1px solid var(--border)" : "1px solid transparent" }}>
      {label} <span className="tnum" style={{ fontSize: 11, color: "var(--text-faint)" }}>{count}</span>
    </button>
  );

  const MsgTab = ({ id, label, count, icon }) => (
    <button onClick={() => setMsgTab(id)} style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
      background: msgTab === id ? "var(--surface)" : "transparent", color: msgTab === id ? "var(--text)" : "var(--text-muted)", boxShadow: msgTab === id ? "var(--shadow-sm)" : "none", border: msgTab === id ? "1px solid var(--border)" : "1px solid transparent" }}>
      <Icon name={icon} size={14} /> {label} <span className="tnum" style={{ fontSize: 11, color: "var(--text-faint)" }}>{count}</span>
    </button>
  );

  const TypeChip = ({ id, label, count }) => {
    const sel = typeFilter === id;
    return (
      <button onClick={() => setTypeFilter(id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 11px", borderRadius: 99, fontSize: 12, fontWeight: 500,
        background: sel ? "var(--accent-soft)" : "transparent", color: sel ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${sel ? "var(--accent-border)" : "var(--border)"}`, transition: "all 0.14s" }}
        onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = "var(--surface-2)"; }} onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
        {label}<span className="tnum" style={{ fontSize: 11, fontWeight: 600, opacity: sel ? 0.75 : 0.55 }}>{count}</span>
      </button>
    );
  };

  const MenuRow = ({ icon, label, sub, danger, right, onClick, disabled }) => (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} title={disabled ? sub : undefined}
      style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 11px", borderRadius: 9, textAlign: "left",
        color: disabled ? "var(--text-faint)" : danger ? "var(--danger)" : "var(--text)", cursor: disabled ? "not-allowed" : "pointer" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = danger ? "var(--danger-soft)" : "var(--surface-2)"; }}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      <Icon name={icon} size={16} />
      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 450 }}>{label}</div>{sub && <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{sub}</div>}</div>
      {right}
    </button>
  );

  return (
    <>
    <div className="view-enter numbers-layout" data-view={numberKey ? "detail" : "list"} style={{ display: "grid", gridTemplateColumns: "340px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
      {/* list pane */}
      <Card className="numbers-list" style={{ overflow: "hidden", position: "sticky", top: 82 }}>
        <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 10, color: "var(--text-faint)" }}>
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search numbers" style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 13, width: "100%" }} />
            {query && <button onClick={() => setQuery("")} aria-label="Clear search" style={{ display: "flex", color: "var(--text-faint)" }}><Icon name="x" size={14} /></button>}
          </div>
          {searching && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
              <span>{list.length} {list.length === 1 ? "result" : "results"} across all numbers</span>
              <button onClick={() => setQuery("")} style={{ fontSize: 12, fontWeight: 500, color: "var(--accent)" }}>Clear</button>
            </div>
          )}
          {!searching && <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", borderRadius: 10 }}>
            <Tab id="active" label="Active" count={numbers.filter((n) => n.status === "active").length} />
            <Tab id="expired" label="Expired" count={numbers.filter((n) => n.status === "expired" || n.status === "disconnected").length} />
            <Tab id="all" label="All" count={numbers.length} />
          </div>}
          {!searching && (() => {
            const inStatus = numbers.filter((n) => {
              if (filter === "all") return true;
              if (filter === "expired") return n.status === "expired" || n.status === "disconnected";
              return n.status === filter;
            });
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-faint)", marginRight: 1 }}>Type</span>
                <TypeChip id="all" label="All" count={inStatus.length} />
                <TypeChip id="Private" label="Private" count={inStatus.filter((n) => n.type === "Private").length} />
                <TypeChip id="Shared" label="Shared" count={inStatus.filter((n) => n.type === "Shared").length} />
              </div>
            );
          })()}
        </div>
        <div className="numbers-list-scroll" style={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto", padding: 8 }}>
          {list.length === 0 && (
            <div style={{ textAlign: "center" }}>
              <Empty icon={searching ? "search" : "grid"} label={searching ? `No numbers match “${searchTerm}”` : "No numbers here"} />
              {searching && <button onClick={() => setQuery("")} style={{ fontSize: 12.5, fontWeight: 500, color: "var(--accent)", paddingBottom: 12 }}>Clear search</button>}
            </div>
          )}
          {list.map((n) => {
            // only mark a number selected when its page is open, not the desktop preview
            const isSel = !!numberKey && current && n.uid === current.uid;
            return (
              <button key={n.uid} onClick={() => openNumber(n)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "11px 11px", borderRadius: 11, textAlign: "left", marginBottom: 2,
                background: isSel ? "var(--accent-soft)" : "transparent", border: isSel ? "1px solid var(--accent-border)" : "1px solid transparent", transition: "background 0.12s" }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--surface-2)"; }} onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                <FlagAvatar iso={n.iso || "GB"} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono tnum" style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: n.status === "expired" ? 0.55 : 1 }}>{n.number}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {n.label ? (
                      <>
                        <span style={{ color: "var(--text-faint)" }}>{n.type || "Shared"}</span>
                        <span style={{ margin: "0 3px", color: "var(--text-faint)" }}>·</span>
                        <Badge tone="accent" style={{ flexShrink: 0 }}>{n.label}</Badge>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "var(--text-faint)" }}>{n.service || "Private"}</span>
                        <span style={{ margin: "0 3px", color: "var(--text-faint)" }}>·</span>
                        <span style={{ color: "var(--text-faint)" }}>{n.country}</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                  {n.unread > 0 && (
                    <span className="tnum" title={`${n.unread} new ${n.unread === 1 ? "message" : "messages"}`} style={{ display: "inline-flex", alignItems: "center", gap: 3, height: 18, padding: "0 6px 0 5px", borderRadius: 99, background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 600 }}>
                      <Icon name="msg" size={11} strokeWidth={2.2} />{n.unread}
                    </span>
                  )}
                  {isLapsed(n.status)
                    ? <>
                        <Badge tone="neutral">Expired</Badge>
                        {n.canRestore && <span className="tnum" style={{ fontSize: 11, color: "var(--warning)" }}>{n.restoreDaysLeft}d to reactivate</span>}
                      </>
                    : <Badge tone={n.days <= 7 ? "warning" : "success"} className="tnum">{n.timeRemaining} left</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* detail pane */}
      <div className="numbers-detail" style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <button onClick={backToList} className="numbers-back" style={{ alignItems: "center", gap: 4, alignSelf: "flex-start", height: 32, padding: "0 10px 0 4px", marginBottom: -4, borderRadius: 9, fontSize: 13.5, fontWeight: 500, color: "var(--text-muted)" }}>
          <Icon name="chevL" size={18} /> All numbers
        </button>
        {numbersLoading ? <div className="skel" style={{ height: 180 }} />
          : !current ? <Card style={{ padding: 18 }}><Empty icon="grid" label={numberKey ? "This number is no longer in your account" : "No number selected"} /></Card> : (
          <>
            <Card style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <FlagAvatar iso={current?.iso || "GB"} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
                    <span className="mono tnum" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", overflowWrap: "anywhere" }}>{current.number}</span>
                    <button onClick={() => copyText(current.number.replace(/\s/g, "")).then((ok) => showToast(ok ? "Number copied" : "Couldn't copy — press and hold to copy instead", ok ? "success" : "danger"))} title="Copy number" style={{ color: "var(--text-faint)", display: "flex", flexShrink: 0 }}><Icon name="copy" size={15} /></button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    {current.service && <Badge tone="neutral">{current.service}</Badge>}
                    <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{current.country}</span>
                  </div>
                  {current.label && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 12.5, fontWeight: 500, color: "var(--accent)", minWidth: 0 }}>
                      <Icon name="user" size={13} strokeWidth={2} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current.label}</span>
                    </div>
                  )}
                </div>
                <div className="num-actions" style={{ display: "flex", gap: 8, position: "relative" }}>
                  {isLapsed(current.status)
                    ? <Button variant="ghost" size="sm" icon="refresh" onClick={() => setModal("restore")} title={current.canRestore ? `Reactivate on the same number — ${current.restoreDaysLeft} day${current.restoreDaysLeft === 1 ? "" : "s"} left` : `The ${RESTORE_WINDOW_DAYS}-day reactivation window has closed`}>Reactivate</Button>
                    : <Button variant="ghost" size="sm" icon="refresh" onClick={() => setModal("renew")}>Extend</Button>}
                  <Button variant="subtle" size="sm" icon="sliders" iconRight="chevD" onClick={() => setMenuOpen((v) => !v)}>Manage</Button>
                  {menuOpen && (
                    <>
                      <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
                      <div style={{ position: "absolute", top: 44, right: 0, width: 252, maxWidth: "calc(100vw - 32px)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 13, boxShadow: "var(--shadow-pop)", zIndex: 70, padding: 6, animation: "popIn 0.15s ease both" }}>
                        <MenuRow icon="user" label="Rename / add label" sub={current.label || "No label set"} onClick={() => { setMenuOpen(false); setModal("rename"); }} />
                        <MenuRow icon="refresh" label="Auto-renew" sub={autoRenewMutation.isPending ? "Updating..." : (current.autoRenew ? "On — renews before expiry" : "Off")} onClick={toggleAuto} disabled={autoRenewMutation.isPending}
                          right={autoRenewMutation.isPending ? (
                            <span style={{ width: 34, height: 20, borderRadius: 99, background: "var(--surface-3)", padding: 2.5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                            </span>
                          ) : (
                            <span style={{ width: 34, height: 20, borderRadius: 99, background: current.autoRenew ? "var(--accent)" : "var(--surface-3)", padding: 2.5, flexShrink: 0, transition: "background 0.18s" }}><span style={{ display: "block", width: 15, height: 15, borderRadius: 99, background: "#fff", transform: current.autoRenew ? "translateX(14px)" : "none", transition: "transform 0.18s" }} /></span>
                          )} />
                        <MenuRow icon="transfer" label="Transfer number"
                          sub={isLapsed(current.status) ? "Expired numbers can't be transferred" : "Move to another user"}
                          disabled={isLapsed(current.status)}
                          onClick={() => { setMenuOpen(false); setModal("transfer"); }} />
                        <div style={{ height: 1, background: "var(--border)", margin: "5px 4px" }} />
                        <MenuRow icon="trash" label="Release number" sub="Cancel & remove" danger onClick={() => { setMenuOpen(false); setModal("release"); }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
              {(() => {
                const lapsed = isLapsed(current.status);
                const cell = (first) => ({ minWidth: 0, padding: first ? "0 12px 0 0" : "0 12px", borderLeft: first ? "none" : "1px solid var(--border)" });
                const label = { fontSize: 11.5, color: "var(--text-faint)", marginBottom: 4, whiteSpace: "nowrap" };
                const value = { fontSize: 15, fontWeight: 600, lineHeight: "20px", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" };
                const sub = { fontSize: 11.5, color: "var(--text-faint)", marginTop: 3, lineHeight: 1.35 };
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: 16, paddingTop: 15, borderTop: "1px solid var(--border)" }}>
                    <div style={cell(true)}>
                      <div style={label}>{lapsed ? "Expired on" : "Expires in"}</div>
                      <div className="mono tnum" style={{ ...value, color: lapsed ? "var(--danger)" : current.days <= 7 ? "var(--warning)" : "var(--text)" }}>
                        {lapsed ? formatExpiryDate(current.expiresAt) : `${current.days} day${current.days === 1 ? "" : "s"}`}
                      </div>
                      {lapsed
                        ? <div className="tnum" style={{ ...sub, color: current.canRestore ? "var(--warning)" : "var(--text-faint)" }}>{current.canRestore ? `Reactivate within ${current.restoreDaysLeft} day${current.restoreDaysLeft === 1 ? "" : "s"}` : "Reactivation window closed"}</div>
                        : <div className="tnum" style={sub}>{formatExpiryDate(current.expiresAt)}</div>}
                    </div>
                    <div style={cell(false)}>
                      <div style={label}>Status</div>
                      <div style={{ ...value, color: lapsed ? "var(--text-muted)" : "var(--success)" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 99, flexShrink: 0, background: lapsed ? "var(--text-faint)" : "var(--success)" }} />
                        {lapsed ? "Inactive" : "Active"}
                      </div>
                    </div>
                    <div style={cell(false)}>
                      <div style={label}>Auto-renew</div>
                      <div style={{ ...value, color: current.autoRenew ? "var(--success)" : "var(--text-muted)" }}>
                        <Icon name="refresh" size={14} strokeWidth={2} />
                        {current.autoRenew ? "On" : "Off"}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>

            <Card ref={msgCardRef} style={{ overflow: "hidden", scrollMarginTop: 76 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", borderRadius: 10 }}>
                  <MsgTab id="inbox" label="Inbox" count={isPrivate ? thread.length : msgTotal} icon="inbox" />
                  {isPrivate && <MsgTab id="sent" label="Sent" count={sentThread.length} icon="send" />}
                </div>
                {/* background refresh, with content already on screen */}
                {messagesFetching && !messagesLoading && (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-faint)", animation: "fadeIn 0.2s ease both" }}>
                    <span style={{ width: 11, height: 11, borderRadius: "50%", border: "2px solid var(--border-strong)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
                    Updating
                  </span>
                )}
                <div className="msg-toolbar-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-faint)" }}>
                    <Icon name="search" size={14} />
                    <input value={msgQuery} onChange={(e) => setMsgQuery(e.target.value)} placeholder={msgTab === "sent" ? "Search sent" : "Search messages"} style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 12.5, width: "100%", minWidth: 80, maxWidth: 160 }} />
                  </div>
                  {isPrivate
                    ? <Button size="sm" icon="send" onClick={() => setModal("compose")} disabled={current.status === "expired"}>Send SMS</Button>
                    : <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-faint)", padding: "0 4px", whiteSpace: "nowrap" }}><Icon name="info" size={13} /> Receive-only</span>}
                </div>
              </div>
              {(() => {
                const q = msgQuery.trim().toLowerCase();
                if (msgTab === "sent") {
                  const all = sentThread;
                  const rows = q ? all.filter((m) => m.body.toLowerCase().includes(q) || m.to.includes(q)) : all;
                  return (
                    <>
                      {q && all.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", fontSize: 11.5, color: "var(--text-faint)", borderBottom: "1px solid var(--border)" }}>
                          <span className="tnum">{rows.length} of {all.length} sent</span>
                          <span>Newest first</span>
                        </div>
                      )}
                      <div className="msg-scroll" style={{ maxHeight: "52vh", overflowY: "auto", padding: "6px 8px 10px" }}>
                        {messagesLoading ? <MessageSkeleton rows={3} />
                          : all.length === 0 ? <Empty icon="send" label="No sent messages yet — tap Send SMS to start a conversation" />
                          : rows.length === 0 ? <Empty icon="search" label={`No sent messages match “${msgQuery}”`} />
                          : rows.map((m, i) => (
                            <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "13px 12px", borderRadius: 12, borderBottom: "1px solid var(--border)", animation: "slideUp 0.26s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${Math.min(i, 6) * 35}ms` }}>
                              <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="send" size={17} /></span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>To</span>
                                  <span className="mono tnum" style={{ fontSize: 13, fontWeight: 550 }}>{m.to}</span>
                                  <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>· {m.time}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>{m.body}</p>
                              </div>
                              <Badge tone="success" dot>{m.status === "delivered" ? "Delivered" : "Sending"}</Badge>
                            </div>
                          ))}
                      </div>
                    </>
                  );
                }
                const all = thread;
                const rows = q ? all.filter((m) => m.body.toLowerCase().includes(q) || (m.from || "").toLowerCase().includes(q) || (m.code || "").includes(q)) : all;
                return (
                  <>
                    {q && all.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", fontSize: 11.5, color: "var(--text-faint)", borderBottom: "1px solid var(--border)" }}>
                        <span className="tnum">{rows.length} of {all.length} message{all.length === 1 ? "" : "s"}</span>
                        <span>Newest first</span>
                      </div>
                    )}
                    <div className="msg-scroll" style={{ maxHeight: "52vh", overflowY: "auto", padding: "6px 8px 10px" }}>
                      {messagesLoading ? <MessageSkeleton />
                        : all.length === 0 ? <Empty icon="msg" label="No messages yet — codes appear here instantly" />
                        : rows.length === 0 ? <Empty icon="search" label={`No messages match “${msgQuery}”`} />
                        : rows.map((m, i) => {
                          const getAvatarColor = (from) => {
                            const lower = from.toLowerCase();
                            if (lower.includes("whatsapp")) return "#25D366";
                            if (lower.includes("instagram")) return "#E4405F";
                            if (lower.includes("uber")) return "#000000";
                            if (lower.includes("verif")) return "#6B7280";
                            return "#3B82F6";
                          };
                          const displayText = m.from.startsWith("+") ? m.from.slice(1, 2) : m.from.substring(0, 1);
                          return (
                            <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border)", animation: "slideUp 0.26s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${Math.min(i, 6) * 35}ms` }}>
                              <div style={{ width: 48, height: 48, borderRadius: 12, background: getAvatarColor(m.from), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: 20, fontWeight: 600, color: "white" }}>{displayText.toUpperCase()}</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", marginBottom: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{m.from}</span>
                                    <span style={{ fontSize: 13, color: "var(--text-faint)" }}>· {m.time}</span>
                                  </div>
                                  {m.unread && <Badge tone="accent" dot>new</Badge>}
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: m.code ? 10 : 0 }}>{m.body}</p>
                                {m.code && <CodeChip code={m.code} size="md" />}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                );
              })()}
              {msgLastPage > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
                  <span className="tnum" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    Page <span style={{ fontWeight: 600, color: "var(--text)" }}>{msgPage}</span> of {msgLastPage} · {msgTotal} messages
                  </span>
                  <Pagination page={msgPage} lastPage={msgLastPage} onChange={goMsgPage} />
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>

    {current && <ExtendModal number={current} open={modal === "renew"} onClose={() => setModal(null)} onConfirm={doExtend} plans={extensionPlans} isLoading={extensionPlansLoading} isSubmitting={extendMutation.isPending} />}
    {current && <RestoreModal number={current} open={modal === "restore"} onClose={() => setModal(null)} onConfirm={doRestore} price={restorePrice} isLoading={restorePriceLoading} error={restorePriceError} balance={balanceData?.amount || 0} isSubmitting={restoreMutation.isPending} />}
    {current && <TransferModal number={current} open={modal === "transfer"} onClose={() => setModal(null)} onConfirm={doTransfer} isSubmitting={transferMutation.isPending} />}
    {current && <RenameModal number={current} open={modal === "rename"} onClose={() => setModal(null)} onConfirm={doRename} isSubmitting={renameMutation.isPending} />}
    {current && <ReleaseModal number={current} open={modal === "release"} onClose={() => setModal(null)} onConfirm={doRelease} isSubmitting={releaseMutation.isPending} />}
    {current && <ComposeModal number={current} open={modal === "compose"} onClose={() => setModal(null)} onSend={doSend} isSubmitting={sendSmsMutation.isPending} />}
    <Toast toast={toast} />
    </>
  );
};

