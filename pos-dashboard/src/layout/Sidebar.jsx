import { NavLink, useNavigate } from "react-router-dom";
import { Gem, LogOut } from "lucide-react";
import { navGroups } from "../data/nav";
import { logout } from "../lib/auth";

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="glass-strong flex h-full w-[272px] flex-col border-l border-white/[0.07]">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-bg shadow-[0_10px_30px_-12px_rgba(255,255,255,.6)]">
          <Gem size={18} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text">سامانه فروش و انبار</p>
          <p className="truncate text-[11px] text-text-faint">مدیریت یکپارچه</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-gradient-to-l from-white/10 to-transparent" />

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="px-3 pb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-text-faint">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ label, path, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === "/dashboard"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
                        isActive
                          ? "bg-white/[0.1] text-text ring-1 ring-inset ring-white/[0.09]"
                          : "text-text-muted hover:bg-white/[0.045] hover:text-text",
                      ].join(" ")
                    }
                  >
                    <Icon size={17} strokeWidth={2} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.07] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm font-bold text-frost">
            ا
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-text">کاربر سامانه</p>
            <p className="truncate text-[11px] text-text-faint">نشست فعال</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="خروج از حساب"
            title="خروج از حساب"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-rose-400/10 hover:text-rose-300"
          >
            <LogOut size={16} strokeWidth={2.1} />
          </button>
        </div>
      </div>
    </aside>
  );
}
