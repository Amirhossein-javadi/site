import { useLocation } from "react-router-dom";
import { CalendarDays, Menu } from "lucide-react";
import { flatNavItems } from "../data/nav";
import ThemeToggle from "../components/ThemeToggle";

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const current = flatNavItems.find((item) =>
    item.path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(item.path)
  );
  const today = new Date().toLocaleDateString("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="glass sticky top-0 z-30 flex min-h-[76px] shrink-0 items-center justify-between gap-3 border-b border-border/20 px-4 sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="باز کردن منو"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-ink/[0.06] hover:text-text md:hidden"
        >
          <Menu size={19} strokeWidth={2.1} />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[10px] font-bold text-text-faint sm:block">سپهر / پنل مدیریتی</p>
          <h1 className="truncate text-[15px] font-extrabold tracking-tight text-text sm:mt-0.5">
            {current?.label ?? "داشبورد"}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 text-xs font-medium text-text-muted lg:flex">
          <CalendarDays size={15} className="text-accent" />
          <span>{today}</span>
        </div>
        <ThemeToggle compact />
      </div>
    </header>
  );
}
