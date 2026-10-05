import ClientPortal from "../../../views/ClientPortal";
import { NO_INDEX } from "../../../lib/seo";

// /app and everything under it → the existing portal (client-only, react-router inside)
export const metadata = NO_INDEX;

export default function Page() {
  return <ClientPortal />;
}
