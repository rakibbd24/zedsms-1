import { useState } from "react";
import { Link } from "react-router-dom";
import imgLogoMark from "../assets/hero/logo-mark.svg";
import imgLogoText from "../assets/hero/logo-wordmark.svg";
import { useAuthContext } from "../portal/context/AuthContext";

const navLinks = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

function NavLink({ label, to, className, onClick }: { label: string; to: string | null; className: string; onClick?: () => void }) {
  return to ? (
    <Link to={to} className={className} onClick={onClick}>{label}</Link>
  ) : (
    <a href="#" className={className}>{label}</a>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  // a signed-in visitor gets a way back into the portal instead of the auth buttons
  const { isLoggedIn, user } = useAuthContext();
  const initial = (user?.email?.[0] || "?").toUpperCase();

  return (
    <div className="absolute inset-x-0 top-3 sm:top-5 z-20 px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px]">
      <nav className="mx-auto max-w-[1290px] bg-white rounded-[28px]">
        <div className="flex items-center justify-between pl-5 sm:pl-7 pr-2 sm:pr-3 py-2 sm:py-3">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-2.5" aria-label="ZEDSMS home">
              <img src={imgLogoMark} alt="ZEDSMS" className="size-7" />
              <img src={imgLogoText} alt="" className="h-4 w-[85px]" />
            </Link>
            <ul className="hidden lg:flex items-center gap-7 font-display font-medium text-sm text-[#0f1013]">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <NavLink {...l} className="hover:text-[#2155f5] transition-colors" />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link to="/app/home" className="lift inline-flex items-center gap-2 bg-[#2155f5] hover:bg-[#1a46d1] rounded-full pl-1.5 pr-4 sm:pr-[22px] py-1.5 font-display font-medium text-sm text-white whitespace-nowrap">
                <span aria-hidden="true" className="flex items-center justify-center size-7 sm:size-8 rounded-full bg-white/20 text-xs font-semibold">
                  {initial}
                </span>
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth/signin" className="lift hidden sm:inline-flex border border-[#e1e2e9] rounded-full px-[22px] py-3 font-display font-medium text-sm text-[#090a0b]">
                  Sign in
                </Link>
                <Link to="/auth/signup" className="lift bg-[#2155f5] hover:bg-[#1a46d1] rounded-full px-4 sm:px-[22px] py-2.5 sm:py-3 font-display font-medium text-sm text-white whitespace-nowrap">
                  Get started
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="lg:hidden flex items-center justify-center size-10 rounded-full border border-[#e1e2e9] text-[#0f1013]"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <ul className="lg:hidden flex flex-col gap-1 px-5 sm:px-7 pb-4 font-display font-medium text-sm text-[#0f1013]">
            {navLinks.map((l) => (
              <li key={l.label}>
                <NavLink {...l} className="block py-2.5 hover:text-[#2155f5] transition-colors" onClick={() => setMenuOpen(false)} />
              </li>
            ))}
            {!isLoggedIn && (
              <li className="sm:hidden pt-2">
                <Link to="/auth/signin" className="block w-full text-center border border-[#e1e2e9] rounded-full px-[22px] py-3 font-display font-medium text-sm text-[#090a0b]">
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        )}
      </nav>
    </div>
  );
}
