"use client";

import dynamic from "next/dynamic";

// The portal runs only in the browser (localStorage session, realtime socket, react-router),
// exactly as it did under Vite — so it's loaded without server rendering, showing the same
// spinner App.tsx showed while its chunk downloaded.
const PortalRouter = dynamic(() => import("./PortalRouter"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9fa]">
      <div className="size-8 rounded-full border-[3px] border-[#e1e2e9] border-t-[#2155f5] animate-spin" aria-label="Loading" />
    </div>
  ),
});

export default function ClientPortal() {
  return <PortalRouter />;
}
