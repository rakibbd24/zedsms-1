import { SignUpPage } from "../../../views/Auth";
import GuestGate from "../../../views/GuestGate";
import { NO_INDEX_FOLLOW } from "../../../lib/seo";

export const metadata = { ...NO_INDEX_FOLLOW, title: "Create your account" };

export default function Page() {
  return (
    <GuestGate>
      <SignUpPage />
    </GuestGate>
  );
}
