import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { flatNavItems } from "../data/nav";

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const current = flatNavItems.find((item) =>
    item.path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(item.path)
  );

  return (
    <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-7">
      <button
        onClick={onMenuClick}
        aria-label="باز کردن منو"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-white/[0.06] hover:text-text md:hidden"
      >
        <Menu size={19} strokeWidth={2.1} />
      </button>
      <h1 className="text-[15px] font-bold tracking-tight text-text">
        {current?.label ?? "داشبورد"}
      </h1>
    </header>
  );
}
