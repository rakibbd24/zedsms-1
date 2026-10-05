import { SignUpPage } from "../../../views/Auth";
import GuestGate from "../../../views/GuestGate";

export default function Page() {
  return (
    <GuestGate>
      <SignUpPage />
    </GuestGate>
  );
}
