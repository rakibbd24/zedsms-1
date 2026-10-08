"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../portal/context/AuthContext";
import { goToPortal } from "../lib/portalNav";

// Next.js version of portal/components/GuestRoute for the sign-in / sign-up pages: someone
// who already holds a session is sent on instead of being asked to log in again.
// Renders the page until the stored session is known (the server and the first client
// render both see "signed out", so hydration matches), then redirects signed-in users.
export default function GuestGate({ children }: { children: ReactNode }) {
  const { isLoggedIn, isEmailVerified } = useAuthContext();
  const router = useRouter();
  useEffect(() => {
    if (!isLoggedIn) return;
    if (isEmailVerified) goToPortal();
    else router.replace("/auth/verify-email");
  }, [isLoggedIn, isEmailVerified, router]);
  return isLoggedIn ? null : children;
}
