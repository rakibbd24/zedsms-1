import { SignInPage } from "../../../views/Auth";
import GuestGate from "../../../views/GuestGate";

// ?expired=1 is read while rendering — render per request so the server sees the query
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <GuestGate>
      <SignInPage />
    </GuestGate>
  );
}
