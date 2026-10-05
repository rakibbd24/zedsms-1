import { lazy, Suspense, useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./views/Home";
// Loaded on demand: the portal alone is most of the bundle, so the home page no longer
// ships it. Home and the auth pages stay in the main chunk.
const Features = lazy(() => import("./views/Features"));
const About = lazy(() => import("./views/About"));
const Pricing = lazy(() => import("./views/Pricing"));
const Portal = lazy(() => import("./views/Portal"));
const PrivacyPolicy = lazy(() => import("./views/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./views/TermsOfService"));
import { SignInPage, SignUpPage } from "./views/Auth";
import { EmailVerificationPage } from "./views/EmailVerification";
import { OTPVerificationPage } from "./views/OTPVerification";
import { AuthProvider } from "./portal/context/AuthContext";
import { ProtectedRoute } from "./portal/components/ProtectedRoute";
import { GuestRoute } from "./portal/components/GuestRoute";
// @ts-ignore
const PaymentReturn = lazy(() => import("./portal/screens/PaymentReturn"));
import { VerificationSuccessPage } from "./views/VerificationSuccess";
import { TelegramCallbackPage } from "./views/TelegramCallback";
import NotFound from "./views/NotFound";

// Where the payment gateways send users back after a top-up (configured on the
// providers and in the backend) — all handled by one return page.
const PAYMENT_RETURN_PATHS = [
  "/stripe/success", "/stripe/cancel",
  "/crypto/success", "/crypto/cancel",
  "/mixpay/success", "/mixpay/cancel",
  "/binance/success", "/binance/cancel",
  "/payeer/success", "/payeer/cancel",
  "/perfectmoney/success", "/perfectmoney/cancel",
  "/perfect-money/success", "/perfect-money/cancel", "/perfect-money/cancel/:trxId",
];

const queryClient = new QueryClient();

// Start each page at the top instead of keeping the previous scroll position
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// shown for the moment a lazily loaded page is fetched
function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9fa]">
      <div className="size-8 rounded-full border-[3px] border-[#e1e2e9] border-t-[#2155f5] animate-spin" aria-label="Loading" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/auth/signin" element={<GuestRoute><SignInPage /></GuestRoute>} />
            <Route path="/auth/signup" element={<GuestRoute><SignUpPage /></GuestRoute>} />
            <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
            <Route path="/auth/verify-otp" element={<OTPVerificationPage />} />
            {/* Telegram OpenID sends the browser back here */}
            <Route path="/auth/telegram/callback" element={<TelegramCallbackPage />} />
            {/* where the emailed verification link comes back to */}
            <Route path="/verification-success" element={<VerificationSuccessPage />} />
            {PAYMENT_RETURN_PATHS.map((path) => (
              <Route key={path} path={path} element={<ProtectedRoute><PaymentReturn /></ProtectedRoute>} />
            ))}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <Portal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Portal />
                </ProtectedRoute>
              }
            />
            {/* anything else used to render a blank page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
