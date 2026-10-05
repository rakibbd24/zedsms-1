import { VerificationSuccessPage } from "../../views/VerificationSuccess";
import { NO_INDEX } from "../../lib/seo";

// ?status=&token= are read while rendering — render per request so the server sees them
export const dynamic = "force-dynamic";

export const metadata = NO_INDEX;

export default function Page() {
  return <VerificationSuccessPage />;
}
