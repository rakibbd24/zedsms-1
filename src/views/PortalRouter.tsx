"use client";

import { useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
// @ts-ignore — portal code is JavaScript
import { ProtectedRoute } from "../portal/components/ProtectedRoute";
// @ts-ignore
import PaymentReturn from "../portal/screens/PaymentReturn";
import Portal from "./Portal";

// The portal and the payment-return page, exactly as src/App.tsx wired them under Vite —
// react-router inside the browser. Next.js renders this client-only (see ClientPortal.tsx)
// for /app/* and the gateway return URLs; nothing in src/portal/ is changed.

// Where the payment gateways send users back after a top-up (configured on the providers
// and in the backend). The Next route src/app/[gateway]/[outcome] accepts exactly these.
// Binance, Payeer and Perfect Money were retired during the migration (stage 4).
const PAYMENT_RETURN_PATHS = [
  "/stripe/success", "/stripe/cancel",
  "/crypto/success", "/crypto/cancel",
  "/mixpay/success", "/mixpay/cancel",
];

// Start each page at the top instead of keeping the previous scroll position (as App.tsx)
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// The portal sometimes sends people outside /app — ProtectedRoute's <Navigate> to
// /auth/signin or /auth/verify-email. react-router only changes the address bar; those
// pages belong to Next.js, so load them for real. Never on the first render: if this
// router was mounted on a path it doesn't know, reloading it would loop.
const LOADED_AT = typeof window !== "undefined" ? window.location.href : "";
function LeaveToNext() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    const target = pathname + search + hash;
    if (window.location.href !== LOADED_AT) window.location.replace(target);
  }, [pathname, search, hash]);
  return null;
}

export default function PortalRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {PAYMENT_RETURN_PATHS.map((path) => (
          <Route key={path} path={path} element={<ProtectedRoute><PaymentReturn /></ProtectedRoute>} />
        ))}
        <Route path="/app/*" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
        <Route path="/app" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
        <Route path="*" element={<LeaveToNext />} />
      </Routes>
    </BrowserRouter>
  );
}
