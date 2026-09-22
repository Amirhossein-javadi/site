import { NavLink } from "react-router-dom";
import { Gem, LogOut } from "lucide-react";
import { navGroups } from "../data/nav";

export default function Sidebar({ onNavigate }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <aside className="glass-strong flex h-full w-72 flex-col border-l border-border-soft">
      {/* لوگو */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-gradient shadow-lg shadow-accent/30">
          <Gem size={19} className="text-white" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text">
            سامانه فروش و انبار
          </p>
          <p className="truncate text-xs text-text-faint">مدیریت یکپارچه</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-gradient-to-l from-border-soft via-border-soft to-transparent" />

      {/* منو */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3.5 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="px-3 pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-faint">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map(({ label, path, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === "/dashboard"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      [
                        "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-accent-gradient text-white shadow-lg shadow-accent/25"
                          : "text-text-muted hover:bg-surface2 hover:text-text",
                      ].join(" ")
                    }
                  >
                    <Icon size={17} strokeWidth={2.1} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* کاربر و خروج */}
      <div className="border-t border-border-soft p-3.5">
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-gradient-soft text-sm font-bold text-accent">
            ا
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text">ادمین سیستم</p>
            <p className="truncate text-xs text-text-faint">دسترسی کامل</p>
          </div>
          <button
            onClick={handleLogout}
            title="خروج از سیستم"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut size={16} strokeWidth={2.1} />
          </button>
        </div>
      </div>
    </aside>
  );
}
