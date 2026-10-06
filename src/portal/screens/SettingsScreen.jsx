import React from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { CodeChip } from "../components/ui/CodeChip";
import { Modal } from "../components/ui/Modal";
import { Toast } from "../components/ui/Toast";
import { useUser } from "../hooks/useUser";
import { copyText } from "../lib/clipboard";
import { useProfile, useChangePassword, useRequestEmailChange, useVerifyEmailChange, useSessions, useRevokeSession, useRevokeOtherSessions, use2fa, useGenerate2faSecret, useEnable2fa, useDisable2fa, useRegenerateRecoveryCodes, useDeleteAccount } from "../hooks/useSettings";
import { useAuthContext } from "../context/AuthContext";
import { NotificationsSettings } from "./notifications";
import { BuyNotice } from "./BuyParts";

// Module level, not inside SettingsScreen: a component redefined on each render
// remounts its children, so inputs lose focus after one keystroke.
const settingsInput = { width: "100%", height: 44, padding: "0 14px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontSize: 14, outline: "none" };

const Field = ({ label, children }) => (<div style={{ marginBottom: 16 }}><label style={{ fontSize: 12.5, color: "var(--text-muted)", display: "block", marginBottom: 7, fontWeight: 500 }}>{label}</label>{children}</div>);

const PasswordField = ({ value, defaultValue, onChange, placeholder, invalid }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input type={show ? "text" : "password"} value={value} defaultValue={defaultValue} onChange={onChange} placeholder={placeholder}
        style={{ ...settingsInput, paddingRight: 46, borderColor: invalid ? "var(--danger)" : "var(--border-strong)" }} />
      <button type="button" onClick={() => setShow((s) => !s)} title={show ? "Hide password" : "Show password"} tabIndex={-1}
        style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: show ? "var(--accent)" : "var(--text-faint)", transition: "color 0.14s" }}>
        <Icon name={show ? "eyeOff" : "eye"} size={17} />
      </button>
    </div>
  );
};

// Profile detail row: label · value (+ hint) · optional action. Read-only values are
// shown as text rather than disabled inputs, which read as broken form fields.
const ProfileRow = ({ label, hint, action, last, children }) => (
  <div className="profile-row" style={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr) auto", alignItems: "center", gap: "4px 16px", padding: "14px 0", borderTop: "1px solid var(--border)", ...(last ? { paddingBottom: 2 } : {}) }}>
    <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>{label}</div>
    <div style={{ minWidth: 0 }}>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 3, lineHeight: 1.45 }}>{hint}</div>}
    </div>
    {action || <span />}
  </div>
);

// Security card header: icon tile · title (+ badge) · description · optional action
const SecHead = ({ icon, active, title, badge, sub, right }) => (
  <div className="sec-head" style={{ display: "flex", alignItems: "flex-start", gap: 13, marginBottom: 16 }}>
    <div style={{ width: 38, height: 38, borderRadius: 11, background: active ? "var(--success-soft)" : "var(--surface-2)", color: active ? "var(--success)" : "var(--text-muted)", border: active ? "none" : "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}><Icon name={icon} size={19} /></div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</h3>
        {badge}
      </div>
      <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>{sub}</p>
    </div>
    {right}
  </div>
);

export const BtnSpinner = () => <span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />;

// session names come from the user agent ("iPhone · Safari", "Windows · Chrome", …)
const MOBILE_DEVICE = /iphone|ipad|android|mobile|phone/i;

const pwScore = (p) => { if (!p) return 0; let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return Math.min(s, 4); };

const PW_LEVELS = [{ l: "Too short", c: "var(--danger)" }, { l: "Weak", c: "var(--danger)" }, { l: "Fair", c: "var(--warning)" }, { l: "Good", c: "var(--accent)" }, { l: "Strong", c: "var(--success)" }];

const sessionWhen = (iso) => {
  if (!iso) return "never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 60 * 24 * 7) return `${Math.floor(mins / 1440)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// how each sign-in provider is labelled on the Profile tab
const LOGIN_METHODS = {
  email: { label: "Email & password", color: "#6B6F76" },
  google: { label: "Google", color: "#EA4335" },
  telegram: { label: "Telegram", color: "#229ED9" },
  apple: { label: "Apple", color: "#16171A" },
};

const SETTINGS_TABS = [{ id: "profile", label: "Profile" }, { id: "security", label: "Security" }, { id: "appearance", label: "Appearance" }, { id: "notifications", label: "Notifications" }];

export const SettingsScreen = ({ theme, toggleTheme, onLogout }) => {
  // the tab lives in the URL (?tab=notifications) so a reload — e.g. on returning from
  // the Telegram app mid-setup — reopens the same tab
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = SETTINGS_TABS;
  const tab = tabs.some((t) => t.id === searchParams.get("tab")) ? searchParams.get("tab") : "profile";
  const setTab = (id) => setSearchParams(id === "profile" ? {} : { tab: id }, { replace: true });

  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const showToast = (msg, tone = "success") => { clearTimeout(toastTimer.current); setToast({ msg, tone }); toastTimer.current = setTimeout(() => setToast(null), 4000); };
  // password / 2FA changes invalidate the session on the backend, so sign out afterwards
  const signOutAfter = (msg) => { showToast(msg, "success"); setTimeout(() => onLogout?.(), 1800); };

  const { data: user } = useUser();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const account = profile || user || {};
  const provider = (profile?.providers || [])[0]?.provider || "email";
  // social-only accounts re-authenticate with a provider token, which needs the
  // provider's own sign-in flow — the password path below doesn't apply to them
  const socialOnly = (profile?.providers || []).length > 0;
  const loginMethod = LOGIN_METHODS[provider] || LOGIN_METHODS.email;

  // ---- email change (OTP to the new address) ----
  const [emailFlow, setEmailFlow] = React.useState(null); // "request" | "verify"
  const [newEmail, setNewEmail] = React.useState("");
  const [emailOtp, setEmailOtp] = React.useState("");
  const [emailErr, setEmailErr] = React.useState("");
  const requestEmail = useRequestEmailChange();
  const verifyEmail = useVerifyEmailChange();
  const startEmailChange = () => {
    setEmailErr("");
    requestEmail.mutate(newEmail.trim(), {
      onSuccess: (msg) => { setEmailFlow("verify"); setEmailOtp(""); showToast(msg, "accent"); },
      onError: (e) => setEmailErr(e.message),
    });
  };
  const confirmEmailChange = () => {
    setEmailErr("");
    verifyEmail.mutate(emailOtp, {
      onSuccess: (msg) => { setEmailFlow(null); setNewEmail(""); showToast(msg); },
      onError: (e) => setEmailErr(e.message),
    });
  };

  // ---- password ----
  const [curPwd, setCurPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const changePwd = useChangePassword();
  const submitPassword = () => changePwd.mutate({ currentPassword: curPwd, newPassword: newPwd }, {
    onSuccess: () => { setCurPwd(""); setNewPwd(""); setConfirmPwd(""); signOutAfter("Password updated — signing you out"); },
    onError: (e) => showToast(e.message, "danger"),
  });

  // ---- two-factor ----
  const { has2FA } = useAuthContext();
  const [tfaFlow, setTfaFlow] = React.useState(null); // "enable" | "disable"
  const [tfaStep, setTfaStep] = React.useState(0);
  const [tfaCode, setTfaCode] = React.useState("");
  const [tfaPwd, setTfaPwd] = React.useState("");
  const [tfaErr, setTfaErr] = React.useState("");
  const twofa = use2fa(tfaFlow === "enable");
  const genSecret = useGenerate2faSecret();
  const enable2faM = useEnable2fa();
  const disable2faM = useDisable2fa();
  const regenCodes = useRegenerateRecoveryCodes();
  // shown once, right after enabling or regenerating — never retrievable later
  const [recoveryCodes, setRecoveryCodes] = React.useState(null);
  const [recoveryAfter, setRecoveryAfter] = React.useState(null); // "enable" | "regenerate"
  const [regenOpen, setRegenOpen] = React.useState(false);
  const [regenPwd, setRegenPwd] = React.useState("");
  const [regenErr, setRegenErr] = React.useState("");

  const openEnable = () => {
    setTfaFlow("enable"); setTfaStep(0); setTfaCode(""); setTfaErr("");
    // a fresh secret each time, exactly like the legacy dashboard
    genSecret.mutate(undefined, { onError: (e) => setTfaErr(e.message) });
  };
  const openDisable = () => { setTfaFlow("disable"); setTfaPwd(""); setTfaErr(""); };
  const closeTfa = () => setTfaFlow(null);
  const verifyEnable = () => {
    if (tfaCode.length !== 6) { setTfaErr("Enter the 6-digit code from your app."); return; }
    setTfaErr("");
    enable2faM.mutate(tfaCode, {
      // every session is revoked server-side, so show the codes first and sign
      // out only once the user confirms they've saved them
      onSuccess: (res) => { setTfaFlow(null); setRecoveryCodes(res.recoveryCodes || []); setRecoveryAfter("enable"); },
      onError: (e) => setTfaErr(e.message),
    });
  };
  const confirmDisable = () => {
    if (!tfaPwd) { setTfaErr("Enter your account password to confirm."); return; }
    setTfaErr("");
    disable2faM.mutate(tfaPwd, {
      onSuccess: (msg) => { setTfaFlow(null); signOutAfter(msg || "Two-factor disabled — signing you out"); },
      onError: (e) => setTfaErr(e.message),
    });
  };

  const submitRegen = () => {
    setRegenErr("");
    regenCodes.mutate(regenPwd, {
      onSuccess: (codes) => { setRegenOpen(false); setRegenPwd(""); setRecoveryCodes(codes); setRecoveryAfter("regenerate"); },
      onError: (e) => setRegenErr(e.message),
    });
  };
  const closeRecoveryCodes = () => {
    const after = recoveryAfter;
    setRecoveryCodes(null);
    setRecoveryAfter(null);
    if (after === "enable") signOutAfter("Two-factor enabled — sign in again to continue");
  };
  const copyRecoveryCodes = () => {
    copyText((recoveryCodes || []).join("\n")).then((ok) => (ok
      ? showToast("Recovery codes copied")
      : showToast("Couldn't copy — use Download instead", "danger")));
  };
  const downloadRecoveryCodes = () => {
    const body = `ZEDSMS recovery codes for ${email}\nGenerated ${new Date().toLocaleString()}\n\n${(recoveryCodes || []).join("\n")}\n\nEach code works once. Keep them somewhere safe and private.\n`;
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url; a.download = "zedsms-recovery-codes.txt";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // ---- sessions ----
  const sessions = useSessions(tab === "security");
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();

  // ---- delete account ----
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletePwd, setDeletePwd] = React.useState("");
  const [deleteErr, setDeleteErr] = React.useState("");
  const deleteAcc = useDeleteAccount();
  const confirmDelete = () => {
    setDeleteErr("");
    deleteAcc.mutate(deletePwd, {
      onSuccess: () => { setDeleteOpen(false); showToast("Account deleted"); setTimeout(() => onLogout?.(), 1500); },
      onError: (e) => setDeleteErr(e.message),
    });
  };

  const email = account?.email || "";
  const zedId = account?.zedsms_id || account?.zedId || account?.id || "—";
  const hasZedId = zedId !== "—";
  const [idCopied, setIdCopied] = React.useState(false);
  const copyId = () => copyText(zedId).then((ok) => {
    if (!ok) { showToast("Couldn't copy — press and hold the ID instead", "danger"); return; }
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 1600);
  });

  return (
    <>
    <div className="view-enter settings-layout" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>
      <div className="settings-tabs" style={{ display: "flex", flexDirection: "column", gap: 3, position: "sticky", top: 82 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} data-active={tab === t.id} style={{ display: "flex", alignItems: "center", padding: "9px 13px", borderRadius: 10, fontSize: 13.5, fontWeight: tab === t.id ? 550 : 450, textAlign: "left",
            background: tab === t.id ? "var(--accent-soft)" : "transparent", color: tab === t.id ? "var(--accent)" : "var(--text-muted)" }}>{t.label}</button>
        ))}
      </div>

      <div className="settings-body" style={{ maxWidth: 560 }}>
        {tab === "profile" && (
          <>
          <Card style={{ padding: 22 }}>
            {/* identity */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 99, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 19, flexShrink: 0, boxShadow: "0 0 0 4px var(--accent-soft)" }}>{(email[0] || "?").toUpperCase()}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email || (profileLoading ? "Loading…" : "—")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 12, color: "var(--text-muted)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: loginMethod.color, flexShrink: 0 }} />
                  Signed in with {loginMethod.label}
                </div>
              </div>
            </div>

            <ProfileRow label="Email"
              action={<Button variant="subtle" size="sm" onClick={() => { setEmailFlow("request"); setNewEmail(""); setEmailErr(""); }}>Change</Button>}
              hint={account?.pending_email && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", color: "var(--warning)" }}>
                  <Icon name="info" size={13} /> Pending change to {account.pending_email}
                  <button onClick={() => { setEmailFlow("verify"); setEmailOtp(""); setEmailErr(""); }} style={{ color: "var(--accent)", fontWeight: 600 }}>Enter code</button>
                </span>
              )}>
              <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email || "—"}</div>
            </ProfileRow>

            <ProfileRow label="ZEDSMS ID" hint="Permanent — share it to receive balance transfers."
              action={
                <Button variant="subtle" size="sm" icon={idCopied ? "check" : "copy"} onClick={copyId} disabled={!hasZedId} aria-label="Copy ZEDSMS ID">
                  {idCopied ? "Copied" : "Copy"}
                </Button>
              }>
              <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.01em", overflowWrap: "anywhere" }}>{zedId}</div>
            </ProfileRow>

            <ProfileRow label="Sign-in method" last>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: loginMethod.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{loginMethod.label}</span>
                <Badge tone="success" dot>Connected</Badge>
              </div>
            </ProfileRow>
          </Card>

          <Card style={{ padding: 22, marginTop: 18, borderColor: "color-mix(in srgb, var(--danger) 25%, var(--border))" }}>
            <div className="settings-danger-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h3 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 600, color: "var(--danger)" }}>Delete account</h3>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>Permanently deletes your account, numbers and remaining balance. This can't be undone.</p>
              </div>
              <Button variant="danger" icon="trash" onClick={() => { setDeleteOpen(true); setDeletePwd(""); setDeleteErr(""); }}>Delete</Button>
            </div>
          </Card>
          </>
        )}

        {tab === "security" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* ---- password ---- */}
          <Card style={{ padding: 22 }}>
            <SecHead icon="lock" title="Password" sub="Use at least 8 characters. You'll be signed out on all devices afterwards." />
            <Field label="Current password"><PasswordField value={curPwd} onChange={(e) => setCurPwd(e.target.value)} placeholder="Your current password" /></Field>
            <Field label="New password">
              <PasswordField value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="At least 8 characters" />
              {newPwd && (() => {
                const score = pwScore(newPwd); const lvl = PW_LEVELS[score];
                return (
                  <div style={{ marginTop: 9 }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 4, flex: 1, borderRadius: 99, background: i < score ? lvl.c : "var(--surface-3)", transition: "background 0.2s" }} />)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 11.5, color: lvl.c, fontWeight: 500, flexWrap: "wrap" }}>
                      <span>{lvl.l}</span>
                      <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>· mix upper/lowercase, numbers &amp; symbols</span>
                    </div>
                  </div>
                );
              })()}
            </Field>
            <Field label="Confirm new password">
              <PasswordField value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Re-enter new password" invalid={confirmPwd && confirmPwd !== newPwd} />
              {confirmPwd && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 11.5, fontWeight: 500, color: confirmPwd === newPwd ? "var(--success)" : "var(--danger)" }}>
                  <Icon name={confirmPwd === newPwd ? "check" : "info"} size={13} strokeWidth={2.2} />
                  {confirmPwd === newPwd ? "Passwords match" : "Passwords don't match"}
                </div>
              )}
            </Field>
            <div className="sec-actions" style={{ display: "flex", marginTop: 4 }}>
              <Button onClick={submitPassword} disabled={!(curPwd && newPwd.length >= 8 && newPwd === confirmPwd) || changePwd.isPending}>
                {changePwd.isPending ? <><BtnSpinner /> Updating…</> : "Update password"}
              </Button>
            </div>
          </Card>

          {/* ---- two-factor ---- */}
          <Card style={{ padding: 22 }}>
            <SecHead icon="shield" active={has2FA} title="Two-factor authentication"
              badge={<Badge tone={has2FA ? "success" : "neutral"} dot>{has2FA ? "On" : "Off"}</Badge>}
              sub="Add a second step at sign-in with an authenticator app like Google Authenticator, Authy or 1Password. Even if your password leaks, your account stays protected." />
            <div className="settings-indent settings-tfa-actions" style={{ marginLeft: 51, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {has2FA
                ? <>
                    <Button variant="subtle" size="md" icon="refresh" onClick={() => { setRegenOpen(true); setRegenPwd(""); setRegenErr(""); }}>Regenerate recovery codes</Button>
                    <Button variant="danger" size="md" onClick={openDisable}>Disable</Button>
                  </>
                : <Button variant="primary" size="md" icon="shield" onClick={openEnable}>Enable two-factor</Button>}
            </div>
            {has2FA && (
              <p className="settings-indent" style={{ margin: "10px 0 0 51px", fontSize: 11.5, color: "var(--text-faint)", lineHeight: 1.5 }}>
                Recovery codes let you sign in if you lose your phone. Each one works once.
              </p>
            )}
          </Card>

          {/* ---- sessions ---- */}
          <Card style={{ padding: 22 }}>
            <SecHead icon="monitor" title="Signed-in devices" sub="Every device with an active session. Sign out anything you don't recognise."
              right={
                <Button variant="subtle" size="sm" disabled={revokeOthers.isPending || (sessions.data || []).length < 2}
                  onClick={() => revokeOthers.mutate(undefined, { onSuccess: (m) => showToast(m || "Other sessions signed out"), onError: (e) => showToast(e.message, "danger") })}>
                  {revokeOthers.isPending ? <><BtnSpinner /> Signing out…</> : "Sign out others"}
                </Button>
              } />
            {sessions.isLoading ? <BuyNotice tone="accent">Loading sessions…</BuyNotice>
              : sessions.error ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => sessions.refetch()}>Retry</Button>}>{sessions.error.message}</BuyNotice>
              : (sessions.data || []).length === 0 ? <BuyNotice>No active sessions found.</BuyNotice>
              : (sessions.data || []).map((s) => {
                const signingOut = revoke.isPending && revoke.variables === s.id;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border)", opacity: signingOut ? 0.6 : 1, transition: "opacity 0.15s" }}>
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
                      <Icon name={MOBILE_DEVICE.test(s.name || "") ? "phone" : "monitor"} size={16} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 550, overflowWrap: "anywhere" }}>{s.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>Last used {sessionWhen(s.lastUsed)} · signed in {sessionWhen(s.createdAt)}</div>
                    </div>
                    <Button variant="subtle" size="sm" disabled={revoke.isPending}
                      onClick={() => revoke.mutate(s.id, { onSuccess: (m) => showToast(m || "Session signed out"), onError: (e) => showToast(e.message, "danger") })}>
                      {signingOut ? <><BtnSpinner /> Signing out…</> : "Sign out"}
                    </Button>
                  </div>
                );
              })}
            <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "var(--text-faint)", lineHeight: 1.5 }}>Signing out the session you're using now will end this one too.</p>
          </Card>
          </div>
        )}

        {tab === "appearance" && (
          <Card style={{ padding: 22 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Appearance</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
              {[{ id: "light", label: "Light", icon: "sun" }, { id: "dark", label: "Dark", icon: "moon" }].map((m) => {
                const sel = theme === m.id;
                return (
                  <button key={m.id} onClick={() => { if (theme !== m.id) toggleTheme(); }} style={{ padding: 16, borderRadius: 14, textAlign: "left",
                    background: sel ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${sel ? "var(--accent-border)" : "var(--border)"}` }}>
                    <div style={{ height: 64, borderRadius: 10, marginBottom: 12, background: m.id === "light" ? "#FAFAFB" : "#0A0B0E", border: "1px solid var(--border)", display: "flex", padding: 8, gap: 6 }}>
                      <div style={{ width: 18, borderRadius: 4, background: m.id === "light" ? "#FFF" : "#181A21", border: "1px solid var(--border)" }} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ height: 7, width: "60%", borderRadius: 3, background: "var(--accent)" }} />
                        <div style={{ height: 6, width: "85%", borderRadius: 3, background: m.id === "light" ? "#EEE" : "#23262E" }} />
                        <div style={{ height: 6, width: "70%", borderRadius: 3, background: m.id === "light" ? "#EEE" : "#23262E" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name={m.icon} size={16} /><span style={{ fontSize: 13.5, fontWeight: 550 }}>{m.label}</span>{sel && <span style={{ marginLeft: "auto", color: "var(--accent)" }}><Icon name="check" size={16} strokeWidth={2.2} /></span>}</div>
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "4px 2px 0" }}>You can also switch theme any time from the top bar. This is saved on this device only.</p>
          </Card>
        )}

        {tab === "notifications" && <NotificationsSettings />}
      </div>
    </div>

    {/* ===== Change email ===== */}
    <Modal open={emailFlow === "request"} onClose={() => setEmailFlow(null)} width={440} title="Change email" subtitle="We'll send a 6-digit code to the new address">
      <Field label="New email address">
        <input value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailErr(""); }} type="email" autoFocus placeholder="name@example.com"
          style={{ ...settingsInput, borderColor: emailErr ? "var(--danger)" : "var(--border-strong)" }} />
      </Field>
      {emailErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: -8, marginBottom: 10 }}><Icon name="info" size={13} /> {emailErr}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Button variant="subtle" full onClick={() => setEmailFlow(null)} disabled={requestEmail.isPending}>Cancel</Button>
        <Button full onClick={startEmailChange} disabled={!newEmail.trim() || requestEmail.isPending}>
          {requestEmail.isPending ? (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Sending…
            </span>
          ) : (
            "Send code"
          )}
        </Button>
      </div>
    </Modal>

    <Modal open={emailFlow === "verify"} onClose={() => setEmailFlow(null)} width={440} title="Confirm your new email" subtitle="Enter the 6-digit code we emailed you — it expires in 10 minutes">
      <input value={emailOtp} onChange={(e) => { setEmailOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setEmailErr(""); }} inputMode="numeric" placeholder="000000" autoFocus
        className="mono tnum otp-input" style={{ ...settingsInput, height: 56, fontSize: 26, fontWeight: 600, textAlign: "center", letterSpacing: "0.4em", borderColor: emailErr ? "var(--danger)" : "var(--border-strong)" }} />
      {emailErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: 9 }}><Icon name="info" size={13} /> {emailErr}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Button variant="subtle" full onClick={() => setEmailFlow("request")} disabled={verifyEmail.isPending}>Back</Button>
        <Button full onClick={confirmEmailChange} disabled={emailOtp.length !== 6 || verifyEmail.isPending}>
          {verifyEmail.isPending ? (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Verifying…
            </span>
          ) : (
            "Confirm email"
          )}
        </Button>
      </div>
    </Modal>

    {/* ===== Enable 2FA ===== */}
    <Modal open={tfaFlow === "enable"} onClose={closeTfa} width={460}
      title={tfaStep === 0 ? "Set up authenticator" : "Verify your app"}
      subtitle={tfaStep === 0 ? "Step 1 of 2 · Scan the code" : "Step 2 of 2 · Confirm it works"}>
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {[0, 1].map((s) => <div key={s} style={{ height: 4, flex: 1, borderRadius: 99, background: s <= tfaStep ? "var(--accent)" : "var(--surface-3)", transition: "background 0.2s" }} />)}
      </div>

      {tfaStep === 0 && (
        <div>
          {genSecret.isPending || twofa.isLoading ? (
            <BuyNotice tone="accent">Generating your setup key…</BuyNotice>
          ) : twofa.error || tfaErr ? (
            <BuyNotice tone="danger">{tfaErr || twofa.error?.message}</BuyNotice>
          ) : (
            <div className="tfa-setup" style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {/* the backend renders the QR itself and returns inline SVG */}
              <div style={{ width: 156, height: 156, padding: 9, borderRadius: 12, background: "#fff", border: "1px solid var(--border-strong)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                dangerouslySetInnerHTML={{ __html: twofa.data?.qrSvg || "" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>Open your authenticator app and scan this QR code, or enter the key manually.</p>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 6 }}>Setup key</div>
                {twofa.data?.secret ? <CodeChip code={twofa.data.secret} /> : <span style={{ fontSize: 12, color: "var(--text-faint)" }}>—</span>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Button variant="subtle" full onClick={closeTfa}>Cancel</Button>
            <Button full iconRight="arrowR" disabled={!twofa.data?.secret} onClick={() => { setTfaStep(1); setTfaErr(""); }}>Continue</Button>
          </div>
        </div>
      )}

      {tfaStep === 1 && (
        <div>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>Enter the 6-digit code currently shown in your authenticator app. You'll be signed out and asked for it next time you sign in.</p>
          <input value={tfaCode} onChange={(e) => { setTfaCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setTfaErr(""); }} inputMode="numeric" placeholder="000000" autoFocus
            className="mono tnum otp-input" style={{ ...settingsInput, height: 56, fontSize: 26, fontWeight: 600, textAlign: "center", letterSpacing: "0.4em", borderColor: tfaErr ? "var(--danger)" : "var(--border-strong)" }} />
          {tfaErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: 9 }}><Icon name="info" size={13} /> {tfaErr}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Button variant="subtle" full onClick={() => { setTfaStep(0); setTfaErr(""); }} disabled={enable2faM.isPending}>Back</Button>
            <Button full onClick={verifyEnable} disabled={enable2faM.isPending}>
              {enable2faM.isPending ? (
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                  Verifying…
                </span>
              ) : (
                "Verify & enable"
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>

    {/* ===== Disable 2FA ===== */}
    <Modal open={tfaFlow === "disable"} onClose={closeTfa} width={420} title="Disable two-factor?" subtitle="This makes your account less secure">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 16, padding: "11px 13px", borderRadius: 11, background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 22%, transparent)" }}>
        <span style={{ display: "flex", color: "var(--danger)", marginTop: 1, flexShrink: 0 }}><Icon name="shield" size={15} /></span>
        <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>You'll only need your password to sign in — no second step. You can re-enable two-factor at any time.</span>
      </div>
      <Field label="Confirm your password to continue">
        <PasswordField value={tfaPwd} onChange={(e) => { setTfaPwd(e.target.value); setTfaErr(""); }} placeholder="Your account password" invalid={!!tfaErr} />
      </Field>
      {tfaErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: -8, marginBottom: 8 }}><Icon name="info" size={13} /> {tfaErr}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Button variant="subtle" full onClick={closeTfa} disabled={disable2faM.isPending}>Keep enabled</Button>
        <Button variant="danger" full onClick={confirmDisable} disabled={disable2faM.isPending}>
          {disable2faM.isPending ? (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Disabling…
            </span>
          ) : (
            "Disable 2FA"
          )}
        </Button>
      </div>
    </Modal>

    {/* ===== Recovery codes — shown once ===== */}
    <Modal open={!!recoveryCodes} onClose={closeRecoveryCodes} width={460}
      title="Save your recovery codes"
      subtitle="This is the only time they're shown">
      <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: "var(--warning-soft)", marginBottom: 14 }}>
        <span style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={16} /></span>
        <span style={{ fontSize: 12.5, color: "var(--warning)", lineHeight: 1.5 }}>
          Store these somewhere safe. If you lose your phone, each code signs you in once — without them you'd need support to get back in.
        </span>
      </div>
      <div className="mono tnum" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "14px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 14 }}>
        {(recoveryCodes || []).map((c) => (
          <span key={c} style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", textAlign: "center" }}>{c}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Button full variant="subtle" icon="copy" onClick={copyRecoveryCodes}>Copy</Button>
        <Button full variant="subtle" icon="receipt" onClick={downloadRecoveryCodes}>Download</Button>
      </div>
      <Button full onClick={closeRecoveryCodes}>
        {recoveryAfter === "enable" ? "I've saved them — sign me out" : "I've saved them"}
      </Button>
    </Modal>

    {/* ===== Regenerate recovery codes ===== */}
    <Modal open={regenOpen} onClose={() => setRegenOpen(false)} width={420}
      title="Regenerate recovery codes" subtitle="Your current codes stop working immediately">
      <Field label="Confirm your password to continue">
        <PasswordField value={regenPwd} onChange={(e) => { setRegenPwd(e.target.value); setRegenErr(""); }} placeholder="Your account password" invalid={!!regenErr} />
      </Field>
      {regenErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: -8, marginBottom: 8 }}><Icon name="info" size={13} /> {regenErr}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Button variant="subtle" full onClick={() => setRegenOpen(false)}>Cancel</Button>
        <Button full onClick={submitRegen} disabled={!regenPwd || regenCodes.isPending}>{regenCodes.isPending ? "Generating…" : "Generate new codes"}</Button>
      </div>
    </Modal>

    {/* ===== Delete account ===== */}
    <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} width={430} title="Delete your account?" subtitle="This can't be undone">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 16, padding: "11px 13px", borderRadius: 11, background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 22%, transparent)" }}>
        <span style={{ display: "flex", color: "var(--danger)", marginTop: 1, flexShrink: 0 }}><Icon name="trash" size={15} /></span>
        <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>Your numbers stop receiving messages immediately and any remaining balance is lost. This cannot be reversed.</span>
      </div>
      {socialOnly ? (
        <>
          <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55 }}>
            You signed up with {loginMethod.label}, so deleting your account needs a fresh sign-in with that provider. Email <a href="mailto:support@zedsms.com" style={{ color: "var(--accent)", fontWeight: 600 }}>support@zedsms.com</a> from {email} and we'll remove it for you.
          </p>
          <Button full variant="subtle" onClick={() => setDeleteOpen(false)}>Close</Button>
        </>
      ) : (
        <>
          <Field label="Confirm your password to continue">
            <PasswordField value={deletePwd} onChange={(e) => { setDeletePwd(e.target.value); setDeleteErr(""); }} placeholder="Your account password" invalid={!!deleteErr} />
          </Field>
          {deleteErr && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", marginTop: -8, marginBottom: 8 }}><Icon name="info" size={13} /> {deleteErr}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button variant="subtle" full onClick={() => setDeleteOpen(false)}>Keep my account</Button>
            <Button variant="danger" full onClick={confirmDelete} disabled={!deletePwd || deleteAcc.isPending}>{deleteAcc.isPending ? "Deleting…" : "Delete account"}</Button>
          </div>
        </>
      )}
    </Modal>

    <Toast toast={toast} />
    </>
  );
};

