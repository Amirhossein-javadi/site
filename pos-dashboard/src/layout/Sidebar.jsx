import { NavLink, useNavigate } from "react-router-dom";
import { Boxes, LogOut } from "lucide-react";
import { navGroups } from "../data/nav";
import { logout } from "../lib/auth";
import { api } from "../lib/api";

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();

  function handleLogout() {
    void api.logout().catch(() => {});
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="flex h-full w-[276px] flex-col border-l border-white/10 bg-[#0c1423] text-white shadow-2xl shadow-black/25">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#101a2d]">
          <Boxes size={19} strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-white">سپهر</p>
          <p className="truncate text-[10px] font-medium tracking-wide text-white/45">فروش و عملیات</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/10" />

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-6">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="px-3 pb-2.5 text-[10px] font-bold tracking-[0.12em] text-white/35">
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
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors",
                        isActive
                          ? "bg-white text-[#101a2d] shadow-sm"
                          : "text-white/60 hover:bg-white/[0.08] hover:text-white",
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

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1c2b46] text-sm font-extrabold text-white ring-1 ring-inset ring-white/10">
            س
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-white">کاربر سامانه</p>
            <p className="truncate text-[10px] text-white/40">نشست فعال</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="خروج از حساب"
            title="خروج از حساب"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} strokeWidth={2.1} />
          </button>
        </div>
      </div>
    </aside>
  );
}
