import { Badge } from "./ui";

const STATUS = {
  pending: ["در انتظار بررسی", "warn"],
  confirmed: ["تأیید شده", "frost"],
  processing: ["در حال آماده‌سازی", "accent"],
  shipped: ["ارسال شده", "frost"],
  delivered: ["تحویل شده", "success"],
  cancelled: ["لغو شده", "danger"],
  issued: ["صادر شده", "frost"],
  paid: ["پرداخت شده", "success"],
  expired: ["منقضی", "danger"],
  initiated: ["آغاز شده", "warn"],
  failed: ["ناموفق", "danger"],
  refunded: ["بازپرداخت", "neutral"],
  in_stock: ["موجود", "success"],
  reserved: ["رزرو شده", "warn"],
  sold: ["فروخته شده", "neutral"],
  returned: ["مرجوعی", "frost"],
  defective: ["معیوب", "danger"],
  in_transit: ["در مسیر", "frost"],
  requested: ["در انتظار بررسی", "warn"],
  approved: ["تأییدشده", "success"],
  received: ["دریافت‌شده", "success"],
  rejected: ["ردشده", "danger"],
  succeeded: ["موفق", "success"],
  created: ["ایجادشده", "neutral"],
};

export default function StatusBadge({ status, label }) {
  const [fallbackLabel, tone] = STATUS[status] ?? [label || status || "نامشخص", "neutral"];
  return <Badge tone={tone} dot>{label || fallbackLabel}</Badge>;
}
