import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // با تغییر مسیر، سایدبار موبایل نباید باز بماند.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="relative flex min-h-screen bg-bg text-text">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[420px] w-[420px] rounded-full bg-white/[0.035] blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[380px] w-[380px] rounded-full bg-accent/[0.08] blur-[130px]" />
      </div>

      {mobileOpen && (
        <button
          aria-label="بستن منو"
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 transition-transform duration-300 ease-out md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-9">
          <div className="mx-auto max-w-7xl animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
