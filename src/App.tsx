import { useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";
import Features from "./pages/Features";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Portal from "./pages/Portal";
import { SignInPage, SignUpPage } from "./pages/Auth";
import { EmailVerificationPage } from "./pages/EmailVerification";
import { OTPVerificationPage } from "./pages/OTPVerification";
import { AuthProvider } from "./portal/context/AuthContext";
import { ProtectedRoute } from "./portal/components/ProtectedRoute";
// @ts-ignore
import PaymentReturn from "./portal/screens/PaymentReturn";
import { VerificationSuccessPage } from "./pages/VerificationSuccess";
import { TelegramCallbackPage } from "./pages/TelegramCallback";

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth/signin" element={<SignInPage />} />
            <Route path="/auth/signup" element={<SignUpPage />} />
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
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
