import { notFound } from "next/navigation";
import ClientPortal from "../../../views/ClientPortal";

// Payment gateway return URLs (/stripe/success, /crypto/cancel, …) → the existing
// PaymentReturn screen. Only the gateways in PAYMENT_RETURN_PATHS (views/PortalRouter.tsx)
// are accepted; any other two-segment URL is a real 404 instead of a blank client page.
// Binance, Payeer and Perfect Money were retired in stage 4.
const GATEWAYS = ["stripe", "crypto", "mixpay"];

type Params = Promise<{ gateway: string; outcome: string }>;

export default async function Page({ params }: { params: Params }) {
  const { gateway, outcome } = await params;
  if (!GATEWAYS.includes(gateway) || (outcome !== "success" && outcome !== "cancel")) notFound();
  return <ClientPortal />;
}
