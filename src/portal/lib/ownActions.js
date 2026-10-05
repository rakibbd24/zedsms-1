// The backend broadcasts a notification for actions the user takes themselves
// (balance transfer, extend, …). The screen that took the action already shows its
// own toast, so the live toast for that echo would show the same news twice.
// Mutations mark the notification they'll cause; the live-toast handler skips it.
// Marked at request start — the broadcast can beat the HTTP response — and kept for
// a window rather than consumed once, in case one action sends more than one event.
// Per tab on purpose: the other side of a transfer still gets its notification.
const ECHO_WINDOW_MS = 20000;
const expected = new Map(); // notification class name -> expiry timestamp

export function expectOwnEvent(type) {
  expected.set(type, Date.now() + ECHO_WINDOW_MS);
}

export function isOwnEcho(type) {
  const until = expected.get(type);
  if (!until) return false;
  if (until < Date.now()) { expected.delete(type); return false; }
  return true;
}
