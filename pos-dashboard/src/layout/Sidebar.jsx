import { NavLink, useNavigate } from "react-router-dom";
import { Boxes, LogOut } from "lucide-react";
import { navGroups } from "../data/nav";
import { logout } from "../lib/auth";

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="glass-strong flex h-full w-[276px] flex-col border-l border-border/20 shadow-[0_0_40px_-24px_rgba(4,21,41,.45)]">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-accent-gradient text-white shadow-[0_10px_26px_-10px_rgba(23,175,224,.7)]">
          <Boxes size={19} strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-text">سپهر | پنل فروش</p>
          <p className="truncate text-[11px] text-text-faint">مدیریت یکپارچه کسب‌وکار</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-gradient-to-l from-accent/30 to-transparent" />

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="px-3 pb-2.5 text-[10px] font-extrabold tracking-[0.1em] text-text-faint">
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
                          ? "bg-accent/10 text-accent ring-1 ring-inset ring-accent/20"
                          : "text-text-muted hover:bg-ink/[0.045] hover:text-text",
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

      <div className="border-t border-border/20 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-extrabold text-accent ring-1 ring-inset ring-accent/20">
            س
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-text">کاربر سامانه</p>
            <p className="truncate text-[11px] text-text-faint">نشست فعال</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="خروج از حساب"
            title="خروج از حساب"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={16} strokeWidth={2.1} />
          </button>
        </div>
      </div>
    </aside>
  );
}
