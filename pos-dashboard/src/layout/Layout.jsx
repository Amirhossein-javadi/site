import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen bg-bg text-text">
      {/* هاله‌های نور پس‌زمینه — لمس نهایی لوکس */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[420px] w-[420px] animate-float rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[380px] w-[380px] animate-float-slow rounded-full bg-accent2/10 blur-[120px]" />
      </div>

      {/* پرده‌ی تیره پشت سایدبار موبایل */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* سایدبار */}
      <div
        className={`fixed inset-y-0 right-0 z-50 transition-transform duration-300 ease-out md:static md:z-auto md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* محتوای اصلی */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-7xl animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
