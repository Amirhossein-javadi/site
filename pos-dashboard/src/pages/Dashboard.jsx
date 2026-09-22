import {
  ShoppingCart,
  Package,
  FileSignature,
  Truck,
  TrendingUp,
  Edit,
} from "lucide-react";
import { Badge, Card, DataTable, PageHeader, Row, Cell } from "../components/ui";

const STATS = [
  {
    label: "کل سفارشات",
    value: "۱۲۴",
    trend: "+۱۲٪",
    icon: ShoppingCart,
    tone: "text-accent",
    bg: "bg-accent-gradient-soft",
  },
  {
    label: "موجودی انبار",
    value: "۸,۴۳۰",
    trend: "+۳٪",
    icon: Package,
    tone: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    label: "قراردادهای فعال",
    value: "۴۵",
    trend: "+۵٪",
    icon: FileSignature,
    tone: "text-frost",
    bg: "bg-frost/10",
  },
  {
    label: "تامین‌کنندگان",
    value: "۱۲",
    trend: "بدون تغییر",
    icon: Truck,
    tone: "text-accent2",
    bg: "bg-accent2/10",
  },
];

const RECENT_ORDERS = [
  {
    id: "#ORD-104",
    customer: "نمایندگی ولیعصر",
    amount: "300,000",
    status: "تایید شده",
    tone: "success",
  },
  {
    id: "#ORD-105",
    customer: "فروشگاه مرکزی شیراز",
    amount: "1,250,000",
    status: "در انتظار تایید",
    tone: "warn",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-7 pb-10">
      <PageHeader
        title="نگاه کلی سیستم فروش"
        subtitle="خلاصه وضعیت سفارشات و موجودی انبار در یک نگاه"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card
            key={s.label}
            glow
            className="group p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-2xl p-3.5 ${s.bg} ${s.tone}`}>
                <s.icon size={22} strokeWidth={2} />
              </div>
              <span className="flex items-center gap-1 rounded-full bg-surface2 px-2 py-1 text-[11px] font-semibold text-text-muted">
                <TrendingUp size={12} className="text-emerald-400" />
                {s.trend}
              </span>
            </div>
            <p className="mt-5 text-sm font-medium text-text-muted">{s.label}</p>
            <h3 className="mt-1 text-3xl font-extrabold tracking-tight text-text">
              {s.value}
            </h3>
          </Card>
        ))}
      </div>

      <div>
        <PageHeader title="آخرین سفارشات ثبت شده" />
        <DataTable
          columns={["شماره سفارش", "مشتری / نماینده", "مبلغ کل (ریال)", "وضعیت", "عملیات"]}
        >
          {RECENT_ORDERS.map((o) => (
            <Row key={o.id}>
              <Cell className="font-mono text-xs font-semibold">{o.id}</Cell>
              <Cell>{o.customer}</Cell>
              <Cell muted dir="ltr" className="font-mono text-right">
                {o.amount}
              </Cell>
              <Cell>
                <Badge tone={o.tone}>{o.status}</Badge>
              </Cell>
              <Cell>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-accent-soft hover:text-accent">
                  <Edit size={16} strokeWidth={2} />
                </button>
              </Cell>
            </Row>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
