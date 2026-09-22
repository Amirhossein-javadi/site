import { useLocation } from "react-router-dom";
import { Bell, Menu, Search, User } from "lucide-react";
import { flatNavItems } from "../data/nav";

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const current = flatNavItems.find((item) =>
    item.path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(item.path)
  );

  return (
    <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border-soft px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface2 hover:text-text md:hidden"
        >
          <Menu size={19} strokeWidth={2.1} />
        </button>
        <h1 className="text-[15px] font-bold text-text">
          {current?.label ?? "داشبورد"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-faint"
          />
          <input
            type="text"
            placeholder="جستجو..."
            className="w-56 rounded-xl border border-border-soft bg-surface2/70 py-2 pr-9 pl-3 text-sm text-text placeholder:text-text-faint transition-colors focus:border-accent/60 focus:bg-surface2 focus:outline-none"
          />
        </div>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface2 hover:text-text">
          <Bell size={17} strokeWidth={2.1} />
          <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>

        <div className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-gradient-soft text-accent hidden sm:flex">
          <User size={16} strokeWidth={2.1} />
        </div>
      </div>
    </header>
  );
}
