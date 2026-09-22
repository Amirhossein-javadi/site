import { useCallback, useEffect, useState } from "react";

/**
 * هوک مشترک واکشی داده.
 * وضعیت‌های loading / error / ready را یکجا مدیریت می‌کند تا هر صفحه
 * منطق تکراری ننویسد.
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, deps);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    stableFetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
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
  }, [stableFetcher]);

  return { data, status, error };
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
