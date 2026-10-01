import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileOpenPath, setMobileOpenPath] = useState(null);
  const mobileOpen = mobileOpenPath === location.pathname;

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMobileOpenPath(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="relative flex min-h-screen bg-bg text-text">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[420px] w-[420px] rounded-full bg-accent/[0.08] blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[380px] w-[380px] rounded-full bg-accent2/10 blur-[130px]" />
      </div>

      {mobileOpen && (
        <button
          aria-label="بستن منو"
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpenPath(null)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 transition-transform duration-300 ease-out md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar onNavigate={() => setMobileOpenPath(null)} />
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpenPath(location.pathname)} />
        <main className="flex-1 px-4 py-6 sm:px-7 sm:py-8 xl:px-10">
          <div className="mx-auto max-w-[1440px] animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
