import { AlertCircle } from "lucide-react";

export function Card({ className = "", children }) {
  return (
    <div className={`rounded-xl border border-border bg-surface ${className}`}>
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
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
        tones[tone] || tones.accent
      }`}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, badge, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        {badge}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface2 text-text-muted">
          <Icon size={20} strokeWidth={2} />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        )}
      </div>
    </Card>
  );
}

/** اسکلت بارگذاری برای جدول‌ها. */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <Card className="overflow-hidden p-4">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 flex-1 animate-pulse rounded bg-surface2"
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
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-right text-text-muted">
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </Card>
  );
}

export function Row({ children }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface2">
      {children}
    </tr>
  );
}

export function Cell({ children, muted = false, className = "" }) {
  return (
    <td
      className={`px-4 py-3 ${muted ? "text-text-muted" : "text-text"} ${className}`}
    >
      {children}
    </td>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent"
    />
  );
}

export function Select({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
