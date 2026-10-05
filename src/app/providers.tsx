"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../portal/context/AuthContext";

// Same wiring as src/App.tsx: one QueryClient for the whole app (landing, auth and portal
// share its cache) with AuthProvider inside it. Created per browser session here — a
// module-level client would be shared between requests while pages render on the server.
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
