import { useCallback, useEffect, useRef, useState } from "react";

/**
 * هوک مشترک واکشی داده.
 * وضعیت‌های loading / error / ready را یکجا مدیریت می‌کند و refetch می‌دهد
 * تا صفحه‌ها بعد از عملیات نوشتنی بتوانند داده را تازه کنند.
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, deps);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    stableFetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError("");
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [stableFetcher, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, status, error, refetch };
}

/**
 * اجرای عملیات نوشتنی با وضعیت pending و خطا.
 * از ref استفاده می‌کند تا اگر کامپوننت unmount شد، setState روی
 * کامپوننت مرده صدا زده نشود.
 */
export function useMutation(mutator) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args) => {
      setPending(true);
      setError("");
      try {
        const result = await mutator(...args);
        return { ok: true, data: result };
      } catch (err) {
        if (mounted.current) setError(err.message);
        return { ok: false, error: err };
      } finally {
        if (mounted.current) setPending(false);
      }
    },
    [mutator]
  );

  return { run, pending, error, clearError: () => setError("") };
}

/** تأخیر در اعمال مقدار — برای اینکه هر کاراکتر جستجو یک درخواست نزند. */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/** جداکننده هزارگان با ارقام فارسی. */
export function formatNumber(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("fa-IR");
}

/**
 * نمایش مبلغ همراه واحد ارز.
 * مقدار از بک‌اند به صورت رشته Decimal می‌آید تا دقت از بین نرود؛
 * اینجا فقط برای نمایش به عدد تبدیل می‌شود.
 */
export function formatMoney(amount, currency) {
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  const label = currency === "USD" ? "دلار" : "تومان";
  return `${n.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} ${label}`;
}

/** تبدیل تاریخ ISO به تاریخ شمسی خوانا. */
export function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** تاریخ همراه ساعت — برای تایم‌لاین‌ها و دفترها. */
export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** فاصله تا تاریخ داده‌شده بر حسب روز؛ منفی یعنی گذشته است. */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((target - today) / msPerDay);
}
