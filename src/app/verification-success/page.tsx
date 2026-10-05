import { VerificationSuccessPage } from "../../views/VerificationSuccess";

// ?status=&token= are read while rendering — render per request so the server sees them
export const dynamic = "force-dynamic";

export default function Page() {
  return <VerificationSuccessPage />;
}
