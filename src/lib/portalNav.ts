// Entering the portal (/app/*) from a Next.js page — after sign-in, OTP, email verification.
//
// The portal runs its own react-router inside the page (views/PortalRouter.tsx). A Next.js
// client-side navigation (router.push / <Link>) mounts that router while Next is still
// switching the address bar, so it could start on /auth/signin, decide the path wasn't its
// own and bounce — in production this looped between /auth/signin and /app/home after
// social sign-in, or sat on a blank page, until a manual reload. A full page load always
// starts the portal on the right URL, exactly as it did under Vite.
export function goToPortal(path = "/app/home", { replace = true } = {}) {
  if (replace) window.location.replace(path);
  else window.location.assign(path);
}
