import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(null);

const TONES = {
  success: {
    icon: CheckCircle2,
    ring: "border-emerald-400/25",
    tint: "text-emerald-300",
  },
  error: {
    icon: AlertCircle,
    ring: "border-rose-400/25",
    tint: "text-rose-300",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = "success") => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-6 z-[100] flex w-[min(24rem,calc(100vw-3rem))] flex-col gap-2.5">
        {toasts.map((t) => {
          const tone = TONES[t.tone] ?? TONES.success;
          const Icon = tone.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`glass-strong pointer-events-auto flex animate-fade-up items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-card-lg ${tone.ring}`}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${tone.tint}`} />
              <p className="flex-1 text-sm leading-relaxed text-text">
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="بستن"
                className="shrink-0 rounded-lg p-1 text-text-faint transition-colors hover:bg-surface2 hover:text-text"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast باید داخل ToastProvider استفاده شود.");
  return ctx;
}
