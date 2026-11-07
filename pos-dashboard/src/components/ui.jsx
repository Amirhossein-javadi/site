import { useEffect } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

export function Card({ className = "", children, glow = false, ...props }) {
  return (
    <div
      className={`rounded-xl border border-border/55 bg-surface shadow-[0_8px_24px_-18px_rgba(0,0,0,.65)] transition-colors duration-200 ${
        glow ? "hover:border-accent/40" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = "accent", dot = false, className = "" }) {
  const tones = {
    accent: "bg-accent/10 text-text ring-accent/20",
    neutral: "bg-surface2 text-text-muted ring-border/60",
    success: "bg-accent/10 text-text ring-accent/20",
    warn: "bg-navy/25 text-frost ring-navy/40",
    danger: "bg-surface3 text-text-muted ring-border/70",
    frost: "bg-navy/15 text-frost ring-navy/25",
  };
  const dots = {
    accent: "bg-accent",
    neutral: "bg-text-muted",
    success: "bg-text",
    warn: "bg-frost",
    danger: "bg-text-muted",
    frost: "bg-navy",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        tones[tone] || tones.accent
      } ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />}
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  icon: Icon,
  loading = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45";
  const variants = {
    primary:
      "bg-accent text-bg hover:bg-accentDim",
    secondary:
      "border border-border/60 bg-surface2 text-text hover:border-navy/50 hover:bg-navy/15",
    ghost: "text-text-muted hover:bg-surface3 hover:text-text",
    danger:
      "border border-border/60 bg-surface2 text-text-muted hover:border-navy/50 hover:bg-navy/15 hover:text-text",
  };
  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm",
    icon: "h-9 w-9 p-0",
  };
  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <LoaderCircle size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={16} strokeWidth={2.2} />
      )}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface3 hover:text-text ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, eyebrow, badge, actions, children }) {
  return (
    <div className="mb-7 space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          {eyebrow && (
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-frost">
              {eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-text sm:text-[30px]">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b border-border/50 pb-3">
      <div>
        <h2 className="text-sm font-extrabold text-text">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-navy/30 text-frost ring-1 ring-inset ring-navy/50">
        <Icon size={21} strokeWidth={1.8} />
      </div>
      <p className="text-sm font-bold text-text">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <Card className="overflow-hidden p-5">
      <div className="space-y-5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((__, c) => (
              <div key={c} className="skeleton h-3.5 flex-1 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger ring-1 ring-inset ring-danger/20">
        <AlertCircle size={21} />
      </div>
      <p className="text-sm font-bold text-text">بارگذاری اطلاعات انجام نشد</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
        {message || "اتصال به سرور برقرار نشد."}
      </p>
      {onRetry && (
        <Button className="mt-5" variant="secondary" icon={RefreshCw} onClick={onRetry}>
          تلاش دوباره
        </Button>
      )}
    </Card>
  );
}

export function DataTable({ columns, children, compact = false }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-navy/20 text-right text-text-muted">
              {columns.map((c) => (
                <th
                  key={typeof c === "string" ? c : c.label}
                  className={`whitespace-nowrap px-5 text-[11px] font-bold tracking-wide ${
                    compact ? "py-3" : "py-4"
                  }`}
                >
                  {typeof c === "string" ? c : c.label}
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

export function Row({ children, onClick, className = "" }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-border/35 transition-colors last:border-0 ${
        onClick ? "cursor-pointer hover:bg-navy/15" : "hover:bg-navy/[0.08]"
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function Cell({ children, muted = false, className = "", dir }) {
  return (
    <td
      dir={dir}
      className={`px-5 py-4 ${muted ? "text-text-muted" : "text-text"} ${className}`}
    >
      {children}
    </td>
  );
}

export function SearchInput({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`relative min-w-0 flex-1 sm:max-w-sm ${className}`}>
      <Search
        size={15}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-faint"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-border/60 bg-surface2 pr-10 pl-3 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-navy focus:ring-2 focus:ring-navy/25"
      />
    </div>
  );
}

export function Select({ value, onChange, options, className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-surface2 py-2 pr-3.5 pl-9 text-sm text-text outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/25"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
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

export function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-bold text-text-muted">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`h-11 w-full rounded-lg border border-border/60 bg-surface2 px-3.5 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-navy focus:ring-2 focus:ring-navy/25 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`min-h-24 w-full resize-y rounded-lg border border-border/60 bg-surface2 px-3.5 py-3 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-navy focus:ring-2 focus:ring-navy/25 ${className}`}
      {...props}
    />
  );
}

export function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-lg border border-border/60 bg-surface2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            value === o.value
            ? "bg-navy text-white shadow-sm"
              : "text-text-muted hover:bg-surface3 hover:text-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
        aria-label="بستن"
      />
      <div className={`relative max-h-[92vh] w-full overflow-hidden rounded-t-xl border border-border/60 bg-surface shadow-2xl sm:rounded-xl ${widths[size]}`}>
        <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-text">{title}</h2>
            {subtitle && <p className="mt-1 text-xs leading-5 text-text-muted">{subtitle}</p>}
          </div>
          <IconButton label="بستن" onClick={onClose} className="-ml-1 -mt-1">
            <X size={18} />
          </IconButton>
        </div>
        <div className="max-h-[calc(92vh-9rem)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-border/50 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[75] ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        onClick={onClose}
        aria-label="بستن"
        className={`absolute inset-0 bg-black/75 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute inset-y-0 left-0 flex w-full max-w-xl flex-col border-r border-border/60 bg-surface shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-text">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
          </div>
          <IconButton label="بستن" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      </aside>
    </div>
  );
}

export function StatCard({ label, value, meta, icon: Icon, tone = "accent" }) {
  const tones = {
    accent: "bg-navy/25 text-frost",
    success: "bg-accent/10 text-text",
    warn: "bg-navy/20 text-frost",
    frost: "bg-accent/10 text-text",
  };
  return (
    <Card glow className="relative overflow-hidden p-5">
      <div className="absolute right-0 top-0 h-1 w-14 bg-navy" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-text-muted">{label}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-text">{value}</p>
          {meta && <p className="mt-1.5 text-[11px] text-text-faint">{meta}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={18} strokeWidth={1.9} />
        </div>
      </div>
    </Card>
  );
}

export function DetailItem({ label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-border/45 bg-surface2 p-4">
      <p className="text-[11px] font-semibold text-text-faint">{label}</p>
      <p className={`mt-1.5 text-sm font-semibold text-text ${mono ? "font-mono" : ""}`}>{value ?? "—"}</p>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-center gap-2">
      <IconButton label="صفحه قبل" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronRight size={17} />
      </IconButton>
      <span className="px-3 text-xs text-text-muted">
        صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
      </span>
      <IconButton label="صفحه بعد" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronLeft size={17} />
      </IconButton>
    </div>
  );
}
