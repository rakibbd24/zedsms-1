import React from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FlagAvatar } from "../components/ui/Avatars";
import { Toast } from "../components/ui/Toast";
import { useBalance } from "../hooks/useBalance";
import { usePrivateCountries, usePrivatePlans, useSharedCountries, useSharedServices, useSharedRentTimes, useSharedNumbers, usePrivateAvailableNumbers, usePurchaseNumber } from "../hooks/useBuy";
import { sharedPriceOf, privateUpstreamOf } from "../api/buy";
import { createPortal } from "react-dom";
import { BulkOrderModal } from "./BulkOrderModal";
import { BUY_TYPES, BuyNotice, INBOUND_FREE, INBOUND_RATE, MobilePayBar, NumberGrid, SearchBox, SelDot, ServiceLogo, StepTitle, pickCard } from "./BuyParts";
import { StateSelect, US_STATES } from "./StateSelect";

export const BuyScreen = ({ setRoute, openNumber }) => {
  // Quick buy (dashboard) links here as ?type=&country=&service= — preselect those once,
  // then pick a random available number instead of always the first
  const [searchParams, setSearchParams] = useSearchParams();
  const intent = React.useRef(null);
  if (intent.current === null) {
    const iso = (searchParams.get("country") || "").toLowerCase();
    intent.current = iso ? { iso, serviceId: searchParams.get("service"), random: true } : {};
  }
  const [type, setType] = React.useState(() => (searchParams.get("type") === "shared" ? "Shared" : "Private"));
  // drop the hand-off from the URL so it doesn't linger while the user changes picks
  React.useEffect(() => {
    if (searchParams.toString()) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);
  const isPrivate = type === "Private";
  const [countryByType, setCountryByType] = React.useState({});
  const country = countryByType[type] || null;
  const setCountry = (c) => setCountryByType((m) => ({ ...m, [type]: c }));
  const [countryQuery, setCountryQuery] = React.useState("");
  const [svc, setSvc] = React.useState(null);
  const [svcQuery, setSvcQuery] = React.useState("");
  const [picked, setPicked] = React.useState(null);     // { key, number, payload } (private) | { id, number } (shared)
  const [planId, setPlanId] = React.useState(null);     // private plan id | shared rent_time id — both go out as rent_time_id
  const [usState, setUsState] = React.useState("");
  const [page, setPage] = React.useState(0);            // pivotel paging for "show different numbers"
  const [agreed, setAgreed] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const showToast = (msg, tone = "success") => { clearTimeout(toastTimer.current); setToast({ msg, tone }); toastTimer.current = setTimeout(() => setToast(null), 3200); };

  // phones: the summary sits below every step — see MobilePayBar
  const summaryRef = React.useRef(null);

  const { data: balanceData } = useBalance();
  const balance = balanceData?.amount || 0;
  const balanceKnown = balanceData !== undefined;
  const purchase = usePurchaseNumber();
  const processing = purchase.isPending;
  React.useEffect(() => {
    document.querySelector(".layout")?.classList.toggle("page-blur", processing);
    return () => document.querySelector(".layout")?.classList.remove("page-blur");
  }, [processing]);

  // ---- catalogs ----
  const privateCountries = usePrivateCountries(isPrivate);
  const sharedCountries = useSharedCountries(!isPrivate);
  const countries = isPrivate ? privateCountries : sharedCountries;
  const countryList = React.useMemo(() => countries.data || [], [countries.data]);

  const upstream = isPrivate && country ? privateUpstreamOf(country.iso) : null;
  const isUS = isPrivate && country?.iso === "us";
  const privateNumbers = usePrivateAvailableNumbers({ iso: isPrivate ? country?.iso : null, state: isUS ? usState : undefined, page });
  const privatePlans = usePrivatePlans(isPrivate ? country?.id : null);

  const sharedServices = useSharedServices(!isPrivate ? country?.id : null);
  const sharedNumbers = useSharedNumbers(!isPrivate ? country?.id : null, !isPrivate ? svc?.id : null);
  const rentTimes = useSharedRentTimes(!isPrivate);

  // ---- reset downstream picks when an upstream choice changes ----
  React.useEffect(() => { setCountryQuery(""); setSvcQuery(""); }, [type]);
  React.useEffect(() => { setSvc(null); setPicked(null); setPlanId(null); setPage(0); setUsState(""); }, [type, country?.id]);

  // default country: the one handed over by Quick buy, else the first in the list
  // (UK when offered — see COUNTRY_ORDER in api/buy). Kept idempotent — StrictMode runs
  // effects twice — and the hand-off is only dropped once a country is actually set.
  React.useEffect(() => {
    if (country) { intent.current.iso = null; return; }
    if (countryList.length === 0) return;
    const wanted = intent.current.iso && countryList.find((c) => c.iso === intent.current.iso);
    setCountry(wanted || countryList[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setCountry is keyed by type, covered by isPrivate
  }, [countryList, country, isPrivate]);

  // service handed over by Quick buy (shared numbers), once its country's services load
  React.useEffect(() => {
    const id = intent.current.serviceId;
    if (!id || svc || !sharedServices.data?.length) return;
    intent.current.serviceId = null;
    const match = sharedServices.data.find((s) => String(s.id) === String(id));
    if (match) setSvc(match);
  }, [sharedServices.data, svc]);

  // default number: first available (random when arriving from Quick buy)
  const numberItems = React.useMemo(() => (isPrivate
    ? (privateNumbers.data || [])
    : (sharedNumbers.data || []).map((n) => ({ key: n.id, number: n.number, id: n.id }))
  ), [isPrivate, privateNumbers.data, sharedNumbers.data]);
  // keep the pick inside the current list — a refetch can drop the number that was picked
  React.useEffect(() => {
    if (numberItems.length === 0) { if (picked) setPicked(null); return; }
    if (picked && intent.current.random) { intent.current.random = false; return; }
    if (!picked || !numberItems.some((n) => n.key === picked.key)) {
      // the random choice is remembered so a repeated effect run picks the same number
      if (intent.current.random && !intent.current.randomKey) {
        intent.current.randomKey = numberItems[Math.floor(Math.random() * numberItems.length)].key;
      }
      const random = intent.current.random && numberItems.find((n) => n.key === intent.current.randomKey);
      setPicked(random || numberItems[0]);
    }
  }, [numberItems, picked]);

  // ---- plans + pricing (same maths as the backend's purchaseNumber) ----
  const plans = React.useMemo(() => isPrivate
    ? (privatePlans.data || []).map((p) => ({ id: p.id, label: p.label, price: p.total, off: p.off, sub: p.months > 1 ? `$${p.monthlyFee.toFixed(2)}/mo` : null }))
    : (rentTimes.data || []).map((r) => {
        const price = svc ? sharedPriceOf(svc, r.days) : null;
        const full = svc ? Math.round(svc.pricePerDay * r.days * 100) / 100 : null;
        return { id: r.id, label: r.name, price, off: full && price < full ? Math.round(((full - price) / full) * 100) : 0, sub: null };
      }), [isPrivate, privatePlans.data, rentTimes.data, svc]);
  React.useEffect(() => {
    if (plans.length > 0 && !plans.some((p) => p.id === planId)) setPlanId(plans[0].id);
  }, [plans, planId]);
  const plan = plans.find((p) => p.id === planId) || null;
  const total = plan?.price || 0;
  const plansLoading = isPrivate ? privatePlans.isLoading : rentTimes.isLoading;
  const plansError = isPrivate ? privatePlans.error : rentTimes.error;

  const insufficient = balanceKnown && !!plan && total > balance + 0.0001;
  const ready = !!country && !!picked && !!plan && (isPrivate || !!svc);
  const blocker = !country ? "Choose a country"
    : !isPrivate && !svc ? "Choose a service"
    : !picked ? "Pick a number"
    : !plan ? "Choose a plan"
    : insufficient ? `Add $${(total - balance).toFixed(2)} to your balance`
    : null;

  const filteredCountries = countryList.filter((c) => c.name.toLowerCase().includes(countryQuery.trim().toLowerCase()));
  const filteredSvc = (sharedServices.data || []).filter((s) => s.name.toLowerCase().includes(svcQuery.trim().toLowerCase()));
  const stateName = (US_STATES.find((s) => s[0] === usState) || [null, "Any state"])[1];
  const step = isPrivate ? { country: 2, number: 3, plan: 4 } : { country: 2, svc: 3, number: 4, plan: 5 };

  const refreshNumbers = () => {
    if (upstream === "pivotel") setPage((p) => p + 1);
    else (isPrivate ? privateNumbers : sharedNumbers).refetch();
  };

  // ---- purchase ----
  const confirmPurchase = () => {
    if (!agreed || processing || !ready || insufficient) return;
    const payload = isPrivate
      ? { mobile_number_type_id: 2, rent_time_id: plan.id, ...picked.payload }
      : { mobile_number_type_id: 1, mobile_number_id: picked.id, rent_time_id: plan.id };
    purchase.mutate(payload, {
      onSuccess: (data) => {
        // open it by uid — a shared and a private number can have the same id
        if (data?.id && openNumber) openNumber(`${isPrivate ? "private" : "shared"}:${data.id}`);
        else setRoute("numbers");
      },
      onError: (err) => {
        // 503 on private = the picked number was taken or the provider is busy — offer fresh numbers
        if (isPrivate && err.status === 503) {
          showToast(err.message || "That number is no longer available — please pick another", "danger");
          refreshNumbers();
        } else {
          showToast(err.message || "Purchase failed", "danger");
          if (!isPrivate) sharedNumbers.refetch();
        }
      },
    });
  };

  return (
    <>
    <div className="view-enter buy-layout buy-page" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* type */}
        <Card style={{ padding: 18 }}>
          <StepTitle n={1}>Number type</StepTitle>
          <div className="buy-type-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {BUY_TYPES.map((t) => {
              const sel = type === t.k;
              return (
                <button key={t.k} onClick={() => setType(t.k)} data-sel={sel} style={{ padding: "15px 16px", borderRadius: 12, ...pickCard(sel) }}>
                  <div className="buy-type-head" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t.k}</span>
                    {sel && <span className="buy-type-dot" style={{ marginLeft: "auto" }}><SelDot /></span>}
                  </div>
                  <div className="buy-type-desc" style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, minHeight: 36 }}>{t.d}</div>
                  <div className="buy-type-caps" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 11 }}>
                    {t.caps.map((c) => (
                      <span key={c.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 24, padding: "0 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: sel ? "var(--surface)" : "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                        <span style={{ display: "flex", color: "var(--accent)" }}><Icon name={c.icon} size={12} strokeWidth={2} /></span>{c.label}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          {(() => {
            const t = BUY_TYPES.find((x) => x.k === type);
            return (
              <div className="buy-type-mobile-info">
                <span>{t.d}</span>
                <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {t.caps.map((c) => (
                    <span key={c.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 24, padding: "0 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", color: "var(--accent)" }}><Icon name={c.icon} size={12} strokeWidth={2} /></span>{c.label}
                    </span>
                  ))}
                </span>
              </div>
            );
          })()}
        </Card>

        {/* country */}
        <Card style={{ padding: 18 }}>
          <StepTitle n={step.country} sub={isPrivate ? "Each country has its own rate — your plan price updates when you pick one." : "Pick where the number is based."}
            right={countryList.length > 8 && <SearchBox value={countryQuery} onChange={setCountryQuery} placeholder="Search country" />}>
            Choose a country
          </StepTitle>
          {countries.isLoading ? <BuyNotice tone="accent">Loading countries…</BuyNotice>
            : countries.error ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => countries.refetch()}>Retry</Button>}>{countries.error.message}</BuyNotice>
            : countryList.length === 0 ? <BuyNotice>No countries are available for {type.toLowerCase()} numbers right now.</BuyNotice>
            : filteredCountries.length === 0 ? <BuyNotice icon="search">No countries match “{countryQuery}”</BuyNotice>
            : (
              <div className="country-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, maxHeight: 316, overflowY: "auto", paddingRight: 4, marginRight: -4 }}>
                {filteredCountries.map((c) => {
                  const sel = country?.id === c.id;
                  return (
                    <button key={c.id} onClick={() => setCountry(c)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 12, ...pickCard(sel) }}>
                      <FlagAvatar iso={c.iso} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                        <div className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", textTransform: "uppercase" }}>{c.iso}</div>
                      </div>
                      {sel && <SelDot />}
                    </button>
                  );
                })}
              </div>
            )}
        </Card>

        {/* service — only for shared numbers */}
        {!isPrivate && country && (
          <Card style={{ padding: 18 }}>
            <StepTitle n={step.svc} right={(sharedServices.data || []).length > 8 && <SearchBox value={svcQuery} onChange={setSvcQuery} />}>Choose a service</StepTitle>
            {sharedServices.isLoading ? <BuyNotice tone="accent">Loading services for {country.name}…</BuyNotice>
              : sharedServices.error ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => sharedServices.refetch()}>Retry</Button>}>{sharedServices.error.message}</BuyNotice>
              : (sharedServices.data || []).length === 0 ? <BuyNotice>No shared services are priced for {country.name} yet. Try another country.</BuyNotice>
              : filteredSvc.length === 0 ? <BuyNotice icon="search">No services match “{svcQuery}”</BuyNotice>
              : (
                <div className="svc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxHeight: 296, overflowY: "auto", paddingRight: 4, marginRight: -4 }}>
                  {filteredSvc.map((s) => {
                    const sel = svc?.id === s.id;
                    return (
                      <button key={s.id} onClick={() => setSvc(s)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: "16px 8px", borderRadius: 13, ...pickCard(sel), textAlign: "center" }}>
                        <ServiceLogo service={s} size={40} />
                        <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s.name}</span>
                        <span className="mono tnum" style={{ fontSize: 11.5, color: sel ? "var(--accent)" : "var(--text-faint)" }}>${s.pricePerDay.toFixed(2)}/day</span>
                      </button>
                    );
                  })}
                </div>
              )}
          </Card>
        )}

        {/* pick a number */}
        {country && (isPrivate || svc) && (() => {
          const q = isPrivate ? privateNumbers : sharedNumbers;
          const where = isUS ? (usState ? stateName : "the United States") : country.name;
          return (
            <Card style={{ padding: 18 }}>
              <StepTitle n={step.number} sub={isPrivate
                ? (isUS ? "Pick a state to get its area codes, or leave it on any state." : "These numbers are available right now. The one you pick is yours.")
                : `Free ${svc.name} numbers in ${country.name}. Digits are partly hidden until the number is yours.`}
                right={isPrivate && <Button size="sm" variant="soft" icon="layers" className="desktop-only" onClick={() => setBulkOpen(true)}>Bulk order</Button>}>
                Pick your number
              </StepTitle>

              {isUS && (
                <div className="buy-state-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <label style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500, flexShrink: 0 }}>State</label>
                  <StateSelect value={usState} onChange={setUsState} />
                  {usState && <span className="mono tnum desktop-only" style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>area code ({(US_STATES.find((s) => s[0] === usState) || [])[2]})</span>}
                </div>
              )}

              {q.isFetching && numberItems.length === 0 ? <BuyNotice tone="accent">Searching available numbers…</BuyNotice>
                : q.error ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => q.refetch()}>Retry</Button>}>{q.error.message}</BuyNotice>
                : numberItems.length === 0 ? <BuyNotice>{isPrivate ? `No numbers available in ${where} right now.${isUS && usState ? " Try another state." : " Try again shortly."}` : `No free ${svc.name} numbers in ${country.name} right now. Try another service or country.`}</BuyNotice>
                : <NumberGrid items={numberItems} pickedKey={picked?.key} onPick={setPicked} />}

              {numberItems.length > 0 && (
                <div className="buy-num-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 13, gap: 10 }}>
                  <span className="tnum" style={{ fontSize: 12, color: "var(--text-faint)" }}>{numberItems.length} available in {where}</span>
                  {isPrivate && (
                    <>
                      <Button variant="subtle" size="sm" icon="refresh" onClick={refreshNumbers} disabled={q.isFetching}>{q.isFetching ? "Searching…" : "Show different numbers"}</Button>
                      <Button variant="soft" size="sm" icon="layers" className="mobile-only-flex" onClick={() => setBulkOpen(true)}>Bulk order</Button>
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })()}

        {/* plan */}
        {country && (isPrivate || svc) && (
          <Card style={{ padding: 18 }}>
            <StepTitle n={step.plan}>Plan</StepTitle>
            {plansLoading ? <BuyNotice tone="accent">Loading plans…</BuyNotice>
              : plansError ? <BuyNotice tone="danger" action={<Button size="sm" variant="subtle" onClick={() => (isPrivate ? privatePlans : rentTimes).refetch()}>Retry</Button>}>{plansError.message}</BuyNotice>
              : plans.length === 0 ? <BuyNotice>No plans are set up for {country.name} yet.</BuyNotice>
              : (
                <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(plans.length, 4)}, 1fr)`, gap: 10 }}>
                  {plans.map((p) => {
                    const sel = planId === p.id;
                    return (
                      <button key={p.id} onClick={() => setPlanId(p.id)} style={{ position: "relative", padding: "14px 12px", borderRadius: 12, ...pickCard(sel) }}>
                        {p.off > 0 && (
                          <span className="tnum" style={{ position: "absolute", top: 9, right: 9, fontSize: 10, fontWeight: 700, letterSpacing: "0.02em", color: "var(--success)", background: "var(--success-soft)", padding: "2px 6px", borderRadius: 999 }}>{p.off}% OFF</span>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.label}</span>
                          {sel && p.off === 0 && <span style={{ marginLeft: "auto" }}><SelDot size={17} /></span>}
                        </div>
                        <span className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: sel ? "var(--accent)" : "var(--text-muted)" }}>${(p.price || 0).toFixed(2)}</span>
                        {p.sub && <div className="mono tnum" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{p.sub}</div>}
                      </button>
                    );
                  })}
                </div>
              )}
          </Card>
        )}
      </div>

      {/* summary */}
      <Card ref={summaryRef} className="buy-summary" style={{ padding: 18, position: "sticky", top: 82 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Order summary</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px", borderRadius: 12, background: "var(--surface-2)", marginBottom: 16 }}>
          {isPrivate || !svc
            ? (country ? <FlagAvatar iso={country.iso} size={42} /> : <span style={{ width: 42, height: 42, borderRadius: 99, background: "var(--surface-3)", flexShrink: 0 }} />)
            : <ServiceLogo service={svc} size={42} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={picked ? "mono tnum" : undefined} style={{ fontSize: 14, fontWeight: 550, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {picked ? picked.number : !isPrivate && svc ? svc.name : "Pick a number"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", overflow: "hidden" }}>
              {country && <FlagAvatar iso={country.iso} size={15} />}
              {country ? (isUS && usState ? `${stateName}, ${country.name}` : country.name) : "No country"}{isPrivate ? " · Private" : svc ? ` · ${svc.name}` : " · Shared"}
            </div>
          </div>
        </div>
        {[
          ["Type", type],
          ["Capabilities", (
            <span style={{ display: "inline-flex", gap: 5 }}>
              {(isPrivate ? [{ i: "msg", l: "SMS" }, { i: "phone", l: "Voice" }] : [{ i: "inbox", l: "Receive SMS" }]).map((c) => (
                <span key={c.l} style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 22, padding: "0 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <span style={{ display: "flex" }}><Icon name={c.i} size={11} strokeWidth={2} /></span>{c.l}
                </span>
              ))}
            </span>
          )],
          ["Plan", plan ? plan.label : "—"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text-muted)" }}>{k}</span>
            <span className="tnum" style={{ fontWeight: 500, whiteSpace: "nowrap" }}>{v}</span>
          </div>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
          <span className="mono tnum" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>${total.toFixed(2)}</span>
        </div>

        {/* policy notices — set expectations before purchase to avoid disputes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "12px 13px", borderRadius: 11, background: "var(--surface-2)", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
            <span style={{ display: "flex", flexShrink: 0, marginTop: 1, color: "var(--text-faint)" }}><Icon name="info" size={14} /></span>
            <span>Deliverability isn't guaranteed for every platform. Some services may not accept this number — we can't promise codes will arrive everywhere.</span>
          </div>
          {isUS && (
            <div style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
              <span style={{ display: "flex", flexShrink: 0, marginTop: 1, color: "var(--text-faint)" }}><Icon name="inbox" size={14} /></span>
              <span>US numbers include <strong style={{ color: "var(--text)" }} className="tnum">{INBOUND_FREE} free inbound SMS</strong>. After that, inbound messages are billed at <span className="tnum">${INBOUND_RATE.toFixed(2)}</span> each.</span>
            </div>
          )}
        </div>

        {insufficient && (
          <div style={{ marginBottom: 14 }}>
            <BuyNotice tone="danger" icon="wallet" action={<Button size="sm" variant="subtle" onClick={() => setRoute("topup")}>Top up</Button>}>
              Your balance is <span className="tnum">${(total - balance).toFixed(2)}</span> short for this plan.
            </BuyNotice>
          </div>
        )}

        {/* terms agreement gate */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 16, height: 16, marginTop: 1, accentColor: "var(--accent)", flexShrink: 0, cursor: "pointer" }} />
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>I agree to the <a href="/terms-of-service" target="_blank" rel="noopener" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline" }}>Terms &amp; Conditions</a> and <a href="/terms-of-service#acceptable-use" target="_blank" rel="noopener" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline" }}>Usage Policy</a>.</span>
        </label>

        <Button full size="lg" icon="cart" disabled={!agreed || processing || !!blocker} onClick={confirmPurchase}>
          {processing ? "Processing…" : blocker && agreed ? blocker : `Pay $${total.toFixed(2)}`}
        </Button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, fontSize: 11.5, color: "var(--text-faint)" }}>
          <Icon name="shield" size={13} /> Pays from your <span className="tnum">{balanceKnown ? `$${balance.toFixed(2)}` : "…"}</span> balance
        </div>
      </Card>

      {/* processing overlay → then redirect to My Numbers. Portaled to <body> so it sits outside .layout and stays sharp while the page blurs behind it. */}
      {processing && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(8,9,12,0.48)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }}>
          <div className="buy-processing-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, boxShadow: "var(--shadow-pop)", padding: "40px 50px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, minWidth: 320, animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
            <div className="spinner" style={{ width: 48, height: 48 }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Processing your purchase…</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>Assigning your {isPrivate ? country?.name : svc?.name} number</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 12 }}>This may take a moment…</div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    {/* outside .view-enter: its transform would trap position:fixed */}
    {bulkOpen && isPrivate && (
      <BulkOrderModal country={country} plans={plans} initialPlan={plan}
        balance={balance} balanceKnown={balanceKnown}
        onClose={() => setBulkOpen(false)}
        onSent={(res) => { setBulkOpen(false); showToast(`Order ${res.order_ref}: buying ${res.quantity} numbers ($${Number(res.total_charged).toFixed(2)} charged) — they'll appear in your list shortly`); }} />
    )}
    <MobilePayBar summaryRef={summaryRef} hidden={processing} amount={total}
      caption={`${picked ? picked.number : "Total"}${plan ? ` · ${plan.label}` : ""}`}
      action={blocker && !insufficient ? blocker : "Review & pay"} disabled={!!blocker && !insufficient} />
    <Toast toast={toast} />
    </>
  );
};
