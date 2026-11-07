import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-context";

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light", label: "روشن", icon: Sun },
    { value: "dark", label: "تیره", icon: Moon },
  ];

  return (
    <div
      aria-label="انتخاب پوسته"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-surface p-1"
      role="group"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`پوسته ${label}`}
          aria-pressed={theme === value}
          title={`پوسته ${label}`}
          onClick={() => setTheme(value)}
          className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${
            theme === value
              ? "bg-navy text-white"
              : "text-text-muted hover:bg-surface3 hover:text-text"
          }`}
        >
          <Icon size={14} strokeWidth={2} />
          {!compact && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
}
