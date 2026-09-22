import { NavLink } from "react-router-dom";
import { Gem } from "lucide-react";
import { navGroups } from "../data/nav";

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-l border-border bg-surface flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accentDim shrink-0">
          <Gem size={18} className="text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">
            سامانه فروش و انبار
          </p>
          <p className="truncate text-xs text-text-faint">مدیریت یکپارچه</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="px-3 pb-2 text-xs text-text-faint">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ label, path, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === "/"}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-accent text-white"
                          : "text-text-muted hover:bg-surface2 hover:text-text",
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
    </aside>
  );
}
