import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FlagAvatar, ServiceAvatar } from "../components/ui/Avatars";
import { usePrivateCountries, usePrivatePlans, useSharedCountries, useSharedServices, useSharedRentTimes } from "../hooks/useBuy";
import { sharedPriceOf } from "../api/buy";

// compact quick-buy used on the overview — live catalog, hands the picks to the Buy page
const QuickPicker = ({ open, setOpen, children, value, disabled }) => (
  <div style={{ position: "relative" }}>
    <button onClick={() => !disabled && setOpen(!open)} disabled={disabled} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", height: 46, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", opacity: disabled ? 0.6 : 1 }}>
      {value}
      <span style={{ marginLeft: "auto", color: "var(--text-faint)" }}><Icon name="chevD" size={16} /></span>
    </button>
    {open && (
      <>
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
        <div style={{ position: "absolute", top: 52, left: 0, right: 0, maxHeight: 240, overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-pop)", zIndex: 30, padding: 6, animation: "popIn 0.15s ease both" }}>
          {children}
        </div>
      </>
    )}
  </div>
);

const QuickServiceLogo = ({ service, size }) => (
  service.icon
    ? <img src={service.icon} alt="" style={{ width: size, height: size, borderRadius: size * 0.32, objectFit: "cover", flexShrink: 0, background: "var(--surface-2)" }} />
    : <ServiceAvatar color="var(--accent)" letter={(service.name || "?")[0].toUpperCase()} size={size} />
);

const pickerText = (text) => <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-muted)" }}>{text}</span>;

export const QuickBuy = () => {
  const navigate = useNavigate();
  const [type, setType] = React.useState("Private");
  const isPrivate = type === "Private";
  const [countryByType, setCountryByType] = React.useState({});
  const [svcId, setSvcId] = React.useState(null);
  const [openS, setOpenS] = React.useState(false);
  const [openC, setOpenC] = React.useState(false);

  const privateCountries = usePrivateCountries(isPrivate);
  const sharedCountries = useSharedCountries(!isPrivate);
  const countriesQ = isPrivate ? privateCountries : sharedCountries;
  const countryList = countriesQ.data || [];
  const country = countryByType[type] || countryList[0] || null;

  const servicesQ = useSharedServices(!isPrivate ? country?.id : null);
  const svcList = servicesQ.data || [];
  const svc = svcList.find((s) => s.id === svcId) || svcList[0] || null;

  // "from" price = the shortest plan, priced the same way the Buy page does
  const privatePlans = usePrivatePlans(isPrivate ? country?.id : null);
  const rentTimes = useSharedRentTimes(!isPrivate);
  const cheapest = isPrivate ? (privatePlans.data || [])[0] : (rentTimes.data || [])[0];
  const fromPrice = !cheapest ? null : isPrivate ? cheapest.total : svc ? sharedPriceOf(svc, cheapest.days) : null;
  const fromLabel = cheapest ? (isPrivate ? cheapest.label : cheapest.name) : null;

  const pickCountry = (c) => { setCountryByType((m) => ({ ...m, [type]: c })); setSvcId(null); setOpenC(false); };
  const ready = !!country && (isPrivate || !!svc);
  const goBuy = () => {
    if (!ready) return;
    const qs = new URLSearchParams({ type: isPrivate ? "private" : "shared", country: country.iso });
    if (!isPrivate) qs.set("service", String(svc.id));
    navigate(`/app/buy?${qs}`);
  };

  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 15 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={18} strokeWidth={2} /></div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Quick buy</h3>
      </div>

      <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", borderRadius: 10, marginBottom: 15 }}>
        {["Private", "Shared"].map((tk) => (
          <button key={tk} onClick={() => { setType(tk); setOpenC(false); setOpenS(false); }} style={{ flex: 1, height: 32, borderRadius: 8, fontSize: 12.5, fontWeight: 550,
            background: type === tk ? "var(--surface)" : "transparent", color: type === tk ? "var(--text)" : "var(--text-muted)",
            boxShadow: type === tk ? "var(--shadow-sm)" : "none", border: type === tk ? "1px solid var(--border)" : "1px solid transparent" }}>{tk}</button>
        ))}
      </div>

      {isPrivate && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 11, background: "var(--surface-2)", marginBottom: 2 }}>
          <span style={{ color: "var(--text-faint)", flexShrink: 0, marginTop: 1 }}><Icon name="info" size={15} /></span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>A private number works with <strong style={{ color: "var(--text)" }}>any service</strong>. Priced by country.</span>
        </div>
      )}

      <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", margin: "13px 0 6px" }}>Country</label>
      <QuickPicker open={openC} setOpen={setOpenC} disabled={countryList.length === 0}
        value={country
          ? <><FlagAvatar iso={country.iso} size={24} /><span style={{ fontSize: 13.5, fontWeight: 500 }}>{country.name}</span></>
          : pickerText(countriesQ.isLoading ? "Loading countries…" : countriesQ.error ? "Couldn't load countries" : "No countries available")}>
        {countryList.map((c) => (
          <button key={c.id} onClick={() => pickCountry(c)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 9px", borderRadius: 9, background: country?.id === c.id ? "var(--surface-2)" : "transparent" }}>
            <FlagAvatar iso={c.iso} size={26} />
            <span style={{ fontSize: 13.5, fontWeight: 450 }}>{c.name}</span>
            {country?.id === c.id && <span style={{ marginLeft: "auto", color: "var(--accent)", display: "flex" }}><Icon name="check" size={15} strokeWidth={2.4} /></span>}
          </button>
        ))}
      </QuickPicker>

      {!isPrivate && (
        <>
          <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", margin: "13px 0 6px" }}>Service</label>
          <QuickPicker open={openS} setOpen={setOpenS} disabled={svcList.length === 0}
            value={svc
              ? <><QuickServiceLogo service={svc} size={24} /><span style={{ fontSize: 13.5, fontWeight: 500 }}>{svc.name}</span></>
              : pickerText(!country || servicesQ.isLoading ? "Loading services…" : servicesQ.error ? "Couldn't load services" : `No services in ${country.name}`)}>
            {svcList.map((sv) => (
              <button key={sv.id} onClick={() => { setSvcId(sv.id); setOpenS(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 9px", borderRadius: 9, background: svc?.id === sv.id ? "var(--surface-2)" : "transparent" }}>
                <QuickServiceLogo service={sv} size={26} />
                <span style={{ fontSize: 13.5, fontWeight: 450 }}>{sv.name}</span>
                <span className="mono tnum" style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>${sv.pricePerDay.toFixed(2)}/day</span>
              </button>
            ))}
          </QuickPicker>
        </>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 13px", padding: "12px 14px", borderRadius: 11, background: "var(--surface-2)" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>From{fromLabel && <span style={{ color: "var(--text-faint)" }}> · {fromLabel}</span>}</span>
        <span className="mono tnum" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>{fromPrice != null ? `$${fromPrice.toFixed(2)}` : "—"}</span>
      </div>
      <Button full size="lg" onClick={goBuy} disabled={!ready}>Buy number</Button>
    </Card>
  );
};
