import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Catch-all route — unknown URLs used to render a blank page.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f9f9fa] flex flex-col">
      <Navbar />
      {/* the Navbar floats over the page (absolute) — clear it */}
      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-[420px] text-center">
          <p className="font-display font-semibold text-[64px] leading-none text-[#2155f5]">404</p>
          <h1 className="font-display font-semibold text-2xl text-[#0f1013] mt-4 mb-2">Page not found</h1>
          <p className="text-[#6B6F76] text-sm mb-8">The page you're looking for doesn't exist or has moved.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link to="/" className="lift w-full sm:w-auto inline-flex items-center justify-center bg-[#2155f5] hover:bg-[#1a46d1] rounded-full px-6 py-3 font-display font-medium text-sm text-white">
              Back to home
            </Link>
            <Link to="/app/home" className="lift w-full sm:w-auto inline-flex items-center justify-center bg-white border border-[#e1e2e9] rounded-full px-6 py-3 font-display font-medium text-sm text-[#0f1013]">
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
