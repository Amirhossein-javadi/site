import { AlertCircle, ChevronDown, Search } from "lucide-react";

export function Card({ className = "", children, glow = false }) {
  return (
    <div
      className={`rounded-2xl border border-border-soft bg-surface/80 backdrop-blur-sm ring-hairline transition-shadow duration-300 ${
        glow ? "hover:shadow-glow" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = "accent" }) {
  const tones = {
    accent: "bg-accent-soft text-accent",
    neutral: "bg-surface2 text-text-muted",
    success: "bg-emerald-500/15 text-emerald-400",
    warn: "bg-amber-500/15 text-amber-400",
    danger: "bg-rose-500/15 text-rose-400",
    frost: "bg-frost/15 text-frost",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-tight ${
        tones[tone] || tones.accent
      }`}
    >
      {children}
    </span>
  );
}

/** دکمه‌ی یکپارچه‌ی سیستم — سه نسخه: پررنگ (گرادیان)، خنثی و شبح. */
export function Button({
  children,
  variant = "primary",
  className = "",
  icon: Icon,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-accent-gradient text-white shadow-lg shadow-accent/25 hover:shadow-glow hover:-translate-y-0.5",
    secondary:
      "bg-surface2 text-text border border-border-soft hover:bg-surface3 hover:border-border",
    ghost: "text-text-muted hover:bg-surface2 hover:text-text",
    danger: "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25",
  };
  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, badge, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-text">{title}</h2>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gradient-soft text-accent">
          <Icon size={22} strokeWidth={2} />
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-text">{title}</p>
        {description && (
          <p className="mt-1.5 max-w-sm text-sm text-text-muted">{description}</p>
        )}
      </div>
    </Card>
  );
}

/** اسکلت بارگذاری برای جدول‌ها با جلوه‌ی درخشش (shimmer). */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <Card className="overflow-hidden p-4">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="skeleton h-4 flex-1 animate-shimmer rounded"
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ErrorState({ message }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="اتصال به سرور برقرار نشد"
      description={
        message || "مطمئن شوید بک‌اند جنگو روی http://localhost:8000 در حال اجراست."
      }
    />
  );
}

/** جدول ساده با هدر — ستون‌ها به صورت آرایه رشته داده می‌شوند. */
export function DataTable({ columns, children }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border-soft bg-surface2/40 text-right text-text-muted">
              {columns.map((c) => (
                <th
                  key={c}
                  className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold tracking-wide"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </Card>
  );
}

export function Row({ children }) {
  return (
    <tr className="border-b border-border-soft/70 transition-colors last:border-0 hover:bg-surface2/60">
      {children}
    </tr>
  );
}

export function Cell({ children, muted = false, className = "", dir }) {
  return (
    <td
      dir={dir}
      className={`px-4 py-3.5 ${muted ? "text-text-muted" : "text-text"} ${className}`}
    >
      {children}
    </td>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full max-w-xs">
      <Search
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-faint"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border-soft bg-surface2/70 py-2.5 pr-9 pl-3 text-sm text-text placeholder:text-text-faint transition-colors focus:border-accent/60 focus:bg-surface2 focus:outline-none"
      />
    </div>
  );
}

export function Select({ value, onChange, options, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-border-soft bg-surface2/70 py-2.5 pl-9 pr-3.5 text-sm text-text transition-colors focus:border-accent/60 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface2">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
      />
    </div>
  );
}
