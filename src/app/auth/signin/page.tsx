import { SignInPage } from "../../../views/Auth";
import GuestGate from "../../../views/GuestGate";
import { NO_INDEX_FOLLOW } from "../../../lib/seo";

// ?expired=1 is read while rendering — render per request so the server sees the query
export const dynamic = "force-dynamic";

export const metadata = { ...NO_INDEX_FOLLOW, title: "Sign in" };

export default function Page() {
  return (
    <GuestGate>
      <SignInPage />
    </GuestGate>
  );
}
