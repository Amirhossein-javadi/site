import { useLocation } from "react-router-dom";
import { Search, User } from "lucide-react";
import { flatNavItems } from "../data/nav";

export default function Topbar() {
  const location = useLocation();
  const current = flatNavItems.find((item) =>
    item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)
  );

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg px-6">
      <h1 className="text-base font-semibold text-text">
        {current?.label ?? "داشبورد"}
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-faint"
          />
          <input
            type="text"
            placeholder="جستجو..."
            className="w-56 rounded-lg border border-border bg-surface py-1.5 pr-9 pl-3 text-sm text-text placeholder:text-text-faint focus:border-accent"
          />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-text-muted">
          <User size={16} strokeWidth={2} />
        </div>
      </div>
    </header>
  );
}
