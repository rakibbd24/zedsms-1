import React from "react";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { CodeChip } from "../components/ui/CodeChip";
import { Modal } from "../components/ui/Modal";
import { Toast } from "../components/ui/Toast";
import { TELEGRAM_BOT } from "../api/notifications";
import {
  useNotificationChannels, useAddChannel, useVerifyEmailChannel, useCheckTelegram,
  useRemoveChannel, useUpdateChannelNumbers, useUpdateChannelEvents,
} from "../hooks/useNotificationChannels";

// ============ NOTIFICATIONS SETTINGS ============
// Channel-centric model: add Email / Telegram channels; each channel routes
// Incoming SMS (which numbers) and System alerts (which event types).
// Numbers and event types are whatever /user/notification-channels returns.

const CHANNEL_META = {
  email:    { label: "Email",    icon: "mail",     color: "var(--accent)" },
  telegram: { label: "Telegram", icon: "telegram", color: "#2AABEE" },
};

const NotificationsSettings = () => {
  const channelsQ = useNotificationChannels();
  const channels = channelsQ.data || [];
  const addCh = useAddChannel();
  const verifyEmailCh = useVerifyEmailChannel();
  const checkTg = useCheckTelegram();
  const removeCh = useRemoveChannel();
  const updateNumbers = useUpdateChannelNumbers();
  const updateEvents = useUpdateChannelEvents();

  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const showToast = (msg, tone = "success") => { clearTimeout(toastTimer.current); setToast({ msg, tone }); toastTimer.current = setTimeout(() => setToast(null), 3400); };

  // ---- add email channel (address → 6-digit code) ----
  const [emailModal, setEmailModal] = React.useState(false);
  const [emailStep, setEmailStep] = React.useState("address"); // "address" | "code"
  const [emailVal, setEmailVal] = React.useState("");
  const [emailCode, setEmailCode] = React.useState("");
  const [emailErr, setEmailErr] = React.useState("");
  const openEmail = () => { setEmailVal(""); setEmailCode(""); setEmailErr(""); setEmailStep("address"); setEmailModal(true); };
  const submitEmail = () => {
    setEmailErr("");
    addCh.mutate({ type: "email", email: emailVal.trim() }, {
      onSuccess: () => { setEmailStep("code"); setEmailCode(""); },
      onError: (e) => setEmailErr(e.message),
    });
  };
  const submitEmailCode = () => {
    setEmailErr("");
    verifyEmailCh.mutate({ email: emailVal.trim(), code: emailCode }, {
      onSuccess: (m) => { setEmailModal(false); showToast(m || "Email channel verified"); },
      onError: (e) => setEmailErr(e.message),
    });
  };

  // ---- add telegram channel (code → /add=<code> to the bot → poll) ----
  const [tgModal, setTgModal] = React.useState(false);
  const [tgCode, setTgCode] = React.useState("");
  const [tgErr, setTgErr] = React.useState("");
  const [tgDone, setTgDone] = React.useState(false);
  const openTg = () => {
    setTgErr(""); setTgDone(false); setTgCode(""); setTgModal(true);
    addCh.mutate({ type: "telegram" }, {
      onSuccess: (r) => { if (r.verificationCode) setTgCode(String(r.verificationCode)); else setTgErr(r.message || "No verification code returned"); },
      onError: (e) => setTgErr(e.message),
    });
  };
  const verifyTg = () => {
    setTgErr("");
    checkTg.mutate(tgCode, {
      onSuccess: (r) => {
        if (r.connected) { setTgDone(true); showToast("Telegram channel connected"); }
        else setTgErr(r.message || `Send /add=${tgCode} to ${TELEGRAM_BOT} first.`);
      },
      onError: (e) => setTgErr(e.message),
    });
  };

  const onRemove = (ch) => removeCh.mutate(ch.id, {
    onSuccess: (m) => showToast(m || "Channel removed", "danger"),
    onError: (e) => showToast(e.message, "danger"),
  });
  const onNumbers = (ch, numberIds) => updateNumbers.mutate({ account: ch.account, numberIds }, {
    onSuccess: () => showToast("Incoming SMS routing saved"),
    onError: (e) => showToast(e.message, "danger"),
  });
  const onEvents = (ch, eventIds) => updateEvents.mutate({ account: ch.account, eventIds }, {
    onSuccess: () => showToast("System alerts saved"),
    onError: (e) => showToast(e.message, "danger"),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ padding: 0, overflow: "visible" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "20px 22px", borderBottom: channels.length ? "1px solid var(--border)" : "none" }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="bell" size={19} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 600 }}>Notification channels</h3>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>Receive incoming SMS and account alerts via Email or Telegram. Each channel routes independently.</p>
          </div>
          <AddChannelMenu onEmail={openEmail} onTelegram={openTg} busy={addCh.isPending} />
        </div>

        {channelsQ.isLoading ? (
          <div style={{ padding: "34px 22px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>Loading your channels…</div>
        ) : channelsQ.error ? (
          <div style={{ padding: "26px 22px", textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--danger)" }}>{channelsQ.error.message}</p>
            <Button size="sm" variant="subtle" onClick={() => channelsQ.refetch()}>Retry</Button>
          </div>
        ) : channels.length === 0 ? (
          <div style={{ padding: "44px 22px", textAlign: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Icon name="inbox" size={22} /></div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>No channels yet</div>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>Add a channel to start receiving codes and alerts.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {channels.map((ch, i) => (
              <ChannelCard
                key={ch.id}
                ch={ch}
                last={i === channels.length - 1}
                saving={updateNumbers.isPending || updateEvents.isPending}
                onNumbers={(ids) => onNumbers(ch, ids)}
                onEvents={(ids) => onEvents(ch, ids)}
                onDelete={() => onRemove(ch)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* ===== Add email channel ===== */}
      <Modal open={emailModal} onClose={() => setEmailModal(false)} width={420}
        title="Add email channel"
        subtitle={emailStep === "address" ? "Codes and alerts will be sent to this inbox" : "Enter the 6-digit code we emailed you"}>
        {emailStep === "address" ? (
          <>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 7 }}>Email address</label>
            <input autoFocus type="email" value={emailVal} onChange={(e) => { setEmailVal(e.target.value); setEmailErr(""); }} placeholder="you@example.com"
              style={{ width: "100%", height: 44, padding: "0 14px", borderRadius: 11, border: `1px solid ${emailErr ? "var(--danger)" : "var(--border-strong)"}`, background: "var(--surface-2)", fontSize: 14, color: "var(--text)", outline: "none" }} />
            {emailErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: 9 }}><Icon name="info" size={13} /> {emailErr}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Button variant="subtle" full onClick={() => setEmailModal(false)}>Cancel</Button>
              <Button full icon="plus" disabled={!/.+@.+\..+/.test(emailVal) || addCh.isPending} onClick={submitEmail}>{addCh.isPending ? "Sending…" : "Send code"}</Button>
            </div>
          </>
        ) : (
          <>
            <input autoFocus value={emailCode} onChange={(e) => { setEmailCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setEmailErr(""); }} inputMode="numeric" placeholder="000000"
              className="mono tnum" style={{ width: "100%", height: 56, padding: "0 14px", borderRadius: 11, border: `1px solid ${emailErr ? "var(--danger)" : "var(--border-strong)"}`, background: "var(--surface-2)", fontSize: 26, fontWeight: 600, textAlign: "center", letterSpacing: "0.4em", color: "var(--text)", outline: "none" }} />
            <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--text-faint)" }}>Sent to {emailVal}. The code is valid for 24 hours.</p>
            {emailErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: 9 }}><Icon name="info" size={13} /> {emailErr}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Button variant="subtle" full onClick={() => setEmailStep("address")}>Back</Button>
              <Button full icon="check" disabled={emailCode.length !== 6 || verifyEmailCh.isPending} onClick={submitEmailCode}>{verifyEmailCh.isPending ? "Verifying…" : "Verify"}</Button>
            </div>
          </>
        )}
      </Modal>

      {/* ===== Add telegram channel ===== */}
      <Modal open={tgModal} onClose={() => setTgModal(false)} width={460}
        title={tgDone ? "Telegram added" : "Add Telegram channel"}
        subtitle={tgDone ? "You're all set" : `Link the ${TELEGRAM_BOT} chat to your account`}>
        {!tgDone ? (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: 99, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>1</div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 13.5, fontWeight: 550, marginBottom: 8 }}>Open the ZEDSMS bot in Telegram</div>
                <a href={`https://t.me/${TELEGRAM_BOT.replace("@", "")}`} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 14px", borderRadius: 10, background: "#2AABEE", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                  <Icon name="telegram" size={16} /> Open {TELEGRAM_BOT}
                </a>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 26, height: 26, borderRadius: 99, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>2</div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 13.5, fontWeight: 550, marginBottom: 8 }}>Send this command to the bot</div>
                {tgCode ? <CodeChip code={`/add=${tgCode}`} size="lg" /> : <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Getting your code…</span>}
                <p style={{ margin: "9px 0 0", fontSize: 11.5, color: "var(--text-faint)", lineHeight: 1.5 }}>This one-time command links your Telegram chat. It expires in 24 hours.</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 11, background: tgErr ? "var(--danger-soft)" : "var(--surface-2)", border: `1px solid ${tgErr ? "transparent" : "var(--border)"}`, marginBottom: 18 }}>
              {checkTg.isPending
                ? <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--surface-3)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite", flexShrink: 0 }} /><span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Checking for your message…</span></>
                : <><span style={{ width: 8, height: 8, borderRadius: 99, background: tgErr ? "var(--danger)" : "var(--text-faint)", flexShrink: 0 }} /><span style={{ fontSize: 12.5, color: tgErr ? "var(--danger)" : "var(--text-muted)" }}>{tgErr || "Waiting for you to send the command…"}</span></>}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="subtle" full onClick={() => setTgModal(false)}>Cancel</Button>
              <Button full icon="check" disabled={!tgCode || checkTg.isPending} onClick={verifyTg}>{checkTg.isPending ? "Checking…" : "I've sent it"}</Button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 99, background: "var(--success-soft)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Icon name="check" size={28} strokeWidth={2.4} /></div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Telegram channel added</div>
            <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>Your Telegram chat is now linked. Tune its Incoming SMS and System alerts below.</p>
            <Button full onClick={() => setTgModal(false)}>Done</Button>
          </div>
        )}
      </Modal>
      <Toast toast={toast} />
    </div>
  );
};

// ---------- Add channel button + menu ----------
const AddChannelMenu = ({ onEmail, onTelegram, busy }) => (
  <Dropdown width={210} align="right" trigger={({ open, toggle }) => (
    <Button size="sm" icon="plus" onClick={toggle} aria-expanded={open} disabled={busy}>Add channel</Button>
  )}>
    {({ close }) => (
      <div style={{ padding: 6 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-faint)", padding: "6px 10px 7px" }}>Add a channel</div>
        {[{ t: "email", fn: onEmail }, { t: "telegram", fn: onTelegram }].map(({ t, fn }) => {
          const m = CHANNEL_META[t];
          return (
            <button key={t} onClick={() => { fn(); close(); }}
              style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", height: 44, padding: "0 10px", borderRadius: 9, textAlign: "left", transition: "background 0.12s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: m.color, flexShrink: 0 }}><Icon name={m.icon} size={16} /></span>
              <span style={{ fontSize: 13.5, fontWeight: 550 }}>{m.label}</span>
            </button>
          );
        })}
      </div>
    )}
  </Dropdown>
);

// ---------- One channel row ----------
const ChannelCard = ({ ch, last, saving, onNumbers, onEvents, onDelete }) => {
  const m = CHANNEL_META[ch.type];
  const [confirm, setConfirm] = React.useState(false);

  return (
    <div style={{ padding: "16px 22px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      {/* identity row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: m.color, flexShrink: 0 }}><Icon name={m.icon} size={19} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</span>
            {ch.verified ? <Badge tone="success" dot>Verified</Badge> : <Badge tone="warning" dot>Pending</Badge>}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ch.account || (ch.type === "telegram" ? "Not linked yet" : "—")}{ch.name ? ` · ${ch.name}` : ""}</div>
        </div>
        {confirm ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Remove?</span>
            <button onClick={onDelete} style={{ height: 30, padding: "0 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: "#fff", background: "var(--danger, #E5484D)" }}>Yes</button>
            <button onClick={() => setConfirm(false)} style={{ height: 30, padding: "0 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>No</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} title="Remove channel"
            style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", border: "1px solid transparent", transition: "all 0.14s", flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger, #E5484D)"; e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
            <Icon name="trash" size={16} />
          </button>
        )}
      </div>

      {/* controls */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 14, opacity: saving ? 0.6 : 1, transition: "opacity 0.15s" }}>
        <ControlField label="Incoming SMS" hint="Which numbers forward here">
          <SmsScopeMenu numbers={ch.numbers} onChange={onNumbers} />
        </ControlField>
        <ControlField label="System alerts" hint="Account event notifications">
          <EventsMenu events={ch.events} onChange={onEvents} />
        </ControlField>
      </div>
    </div>
  );
};

const ControlField = ({ label, hint, children }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hint}</div>
    {children}
  </div>
);

// ---------- Generic dropdown (trigger + menu + overlay) ----------
const Dropdown = ({ trigger, children, width = 260, align = "left" }) => {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  return (
    <div style={{ position: "relative" }}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <>
          <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div className="menu-pop" style={{ position: "absolute", top: "calc(100% + 6px)", [align]: 0, width, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-pop)", zIndex: 50, overflow: "hidden" }}>
            {typeof children === "function" ? children({ close }) : children}
          </div>
        </>
      )}
    </div>
  );
};

// Standard pill trigger used by the SMS + events menus.
const MenuTrigger = ({ open, toggle, label, off }) => (
  <button onClick={toggle} aria-haspopup="listbox" aria-expanded={open}
    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 38, padding: "0 12px", borderRadius: 10,
      border: `1px solid ${open ? "var(--accent-border)" : "var(--border-strong)"}`, background: "var(--surface)",
      boxShadow: open ? "0 0 0 3px var(--accent-soft)" : "none", transition: "border-color 0.14s, box-shadow 0.14s" }}>
    <span style={{ width: 7, height: 7, borderRadius: 99, flexShrink: 0, background: off ? "var(--border-strong)" : "var(--accent)" }} />
    <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 500, color: off ? "var(--text-muted)" : "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    <span style={{ color: "var(--text-faint)", display: "flex", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.14s", flexShrink: 0 }}><Icon name="chevD" size={15} /></span>
  </button>
);

// little square checkbox
const CheckBox = ({ on }) => (
  <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
    border: `1.5px solid ${on ? "var(--accent)" : "var(--border-strong)"}`, background: on ? "var(--accent)" : "transparent", transition: "all 0.12s", color: "#fff" }}>
    {on && <Icon name="check" size={12} strokeWidth={3} />}
  </span>
);

const MenuRow = ({ onClick, children }) => (
  <button onClick={onClick}
    style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", height: 40, padding: "0 12px", textAlign: "left", transition: "background 0.12s" }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
    {children}
  </button>
);

// ---------- Incoming-SMS scope menu ----------
// The API stores a plain list of enabled number ids, so "All numbers" just means
// every current number is selected; each change saves the whole list.
const SmsScopeMenu = ({ numbers, onChange }) => {
  const total = numbers.length;
  const selected = numbers.filter((n) => n.on);
  const allOn = total > 0 && selected.length === total;
  const label = total === 0 ? "No active numbers"
    : allOn ? `All numbers · ${total}`
    : selected.length === 0 ? "No numbers"
    : `${selected.length} of ${total} numbers`;

  const setAll = (on) => onChange(on ? numbers.map((n) => n.id) : []);
  const toggleNum = (id) => onChange(numbers.filter((n) => (n.id === id ? !n.on : n.on)).map((n) => n.id));

  return (
    <Dropdown width={278} trigger={(p) => <MenuTrigger {...p} label={label} off={selected.length === 0} />}>
      {() => (
        <div>
          <div style={{ padding: 6, borderBottom: "1px solid var(--border)" }}>
            <MenuRow onClick={() => setAll(true)}>
              <RadioDot on={allOn} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: allOn ? 600 : 500 }}>All numbers</span>
              <span className="tnum" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{total}</span>
            </MenuRow>
            <MenuRow onClick={() => setAll(false)}>
              <RadioDot on={selected.length === 0} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: selected.length === 0 ? 600 : 500 }}>None</span>
            </MenuRow>
          </div>
          <div style={{ maxHeight: 234, overflowY: "auto", padding: 6 }}>
            {total === 0 && <div style={{ padding: "12px 10px", fontSize: 12.5, color: "var(--text-faint)" }}>No active numbers to forward.</div>}
            {numbers.map((n) => (
              <MenuRow key={`${n.type}-${n.id}`} onClick={() => toggleNum(n.id)}>
                <CheckBox on={n.on} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>{n.number}</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{n.type === "virtual" ? "Private" : "Shared"}</div>
                </div>
              </MenuRow>
            ))}
          </div>
        </div>
      )}
    </Dropdown>
  );
};

const RadioDot = ({ on }) => (
  <span style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${on ? "var(--accent)" : "var(--border-strong)"}`, transition: "all 0.12s" }}>
    {on && <span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--accent)" }} />}
  </span>
);

// ---------- System-alerts (event types) menu ----------
const EventsMenu = ({ events, onChange }) => {
  const total = events.length;
  const on = events.filter((e) => e.on).length;
  const allOn = total > 0 && on === total;
  const label = total === 0 ? "None available" : on === 0 ? "Off" : allOn ? "All types" : `${on} of ${total} types`;

  const toggle = (id) => onChange(events.filter((e) => (e.id === id ? !e.on : e.on)).map((e) => e.id));
  const setAll = (v) => onChange(v ? events.map((e) => e.id) : []);

  return (
    <Dropdown width={260} align="right" trigger={(p) => <MenuTrigger {...p} label={label} off={on === 0} />}>
      {() => (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-faint)" }}>Event types</span>
            <button onClick={() => setAll(!allOn)} style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{allOn ? "Clear all" : "Select all"}</button>
          </div>
          <div style={{ maxHeight: 250, overflowY: "auto", padding: 6 }}>
            {events.map((e) => (
              <MenuRow key={e.id} onClick={() => toggle(e.id)}>
                <CheckBox on={e.on} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: e.on ? 550 : 500, color: e.on ? "var(--text)" : "var(--text-muted)" }}>{e.name}</span>
              </MenuRow>
            ))}
          </div>
        </div>
      )}
    </Dropdown>
  );
};

// Shared toggle (kept for other settings screens that import it).
const Toggle = ({ on, onClick, disabled }) => (
  <button onClick={disabled ? undefined : onClick} aria-pressed={!!on} disabled={disabled}
    style={{ width: 42, height: 24, borderRadius: 99, background: on ? "var(--accent)" : "var(--surface-3)", padding: 3, transition: "background 0.18s", flexShrink: 0, opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
    <span style={{ display: "block", width: 18, height: 18, borderRadius: 99, background: "#fff", transform: on ? "translateX(18px)" : "none", transition: "transform 0.18s", boxShadow: "var(--shadow-sm)" }} />
  </button>
);

export { NotificationsSettings, Toggle };
