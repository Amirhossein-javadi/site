import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpLeft,
  Boxes,
  CalendarDays,
  ClipboardList,
  FileText,
  Package,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import {
  Badge,
  Card,
  Cell,
  DataTable,
  EmptyState,
  ErrorState,
  Row,
  SectionHeader,
  TableSkeleton,
} from "../components/ui";
import StatusBadge from "../components/StatusBadge";
import { api } from "../lib/api";
import { daysUntil, formatDate, formatNumber, useApi } from "../lib/hooks";

const OPEN_STATUSES = ["pending", "confirmed", "processing"];

function getWeeklyOrders(orders) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const count = orders.filter((order) => {
      const createdAt = new Date(order.created_at);
      return createdAt.getFullYear() === date.getFullYear() &&
        createdAt.getMonth() === date.getMonth() &&
        createdAt.getDate() === date.getDate();
    }).length;
    return {
      key: date.toISOString(),
      label: date.toLocaleDateString("fa-IR", { weekday: "short" }),
      count,
    };
  });
}

export default function Dashboard() {
  const fetcher = useCallback(
    () => Promise.all([api.getOrders(), api.getInventory(), api.getProducts(), api.getContracts()]),
    []
  );
  const { data, status, error, refetch } = useApi(fetcher);

  if (status === "loading") {
    return (
      <>
        <div className="dashboard-hero mb-6 h-48 animate-pulse rounded-[26px]" />
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-[132px] p-5">
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="skeleton mt-5 h-7 w-16 rounded-full" />
            </Card>
          ))}
        </div>
        <TableSkeleton rows={5} cols={5} />
      </>
    );
  }

  if (status === "error") {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const [orders, inventory, products, contracts] = data;
  const openOrders = orders.filter((order) => OPEN_STATUSES.includes(order.status));
  const lowStock = inventory.filter((item) => item.is_below_reorder_point);
  const variantCount = products.reduce((sum, product) => sum + (product.variants?.length ?? 0), 0);
  const expiringContracts = contracts
    .map((contract) => ({ ...contract, remaining: daysUntil(contract.end_date) }))
    .filter((contract) => contract.remaining !== null && contract.remaining <= 60)
    .sort((a, b) => a.remaining - b.remaining);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);
  const weeklyOrders = getWeeklyOrders(orders);
  const maxOrders = Math.max(...weeklyOrders.map((day) => day.count), 1);
  const today = new Date().toLocaleDateString("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-7">
      <section className="dashboard-hero relative overflow-hidden rounded-[26px] p-6 sm:p-8 xl:p-9">
        <div aria-hidden="true" className="dashboard-hero-orb absolute -left-8 -top-24 h-64 w-64 rounded-full" />
        <div aria-hidden="true" className="absolute bottom-0 left-[34%] hidden h-32 w-32 rounded-full border border-white/10 lg:block" />
        <div className="relative z-10 flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.9)]" />
              نمای کلی عملیات
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[32px]">
              روزتان بخیر
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/75 sm:text-[15px]">
              وضعیت سفارش‌ها، موجودی و قراردادها را در یک نگاه دنبال کنید.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/10 px-3.5 py-2.5 text-xs font-medium text-white/85 backdrop-blur-sm">
              <CalendarDays size={15} />
              {today}
            </div>
            <Link to="/orders" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-slate-900 shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-cyan-50">
              سفارش تازه <ArrowLeft size={14} />
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid max-w-3xl grid-cols-2 gap-3 border-t border-white/15 pt-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-100"><ShoppingCart size={17} /></span>
            <div><p className="text-xl font-extrabold text-white">{formatNumber(openOrders.length)}</p><p className="text-[11px] text-white/70">سفارش باز</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-100"><Package size={17} /></span>
            <div><p className="text-xl font-extrabold text-white">{formatNumber(lowStock.length)}</p><p className="text-[11px] text-white/70">هشدار موجودی</p></div>
          </div>
          <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-100"><FileText size={17} /></span>
            <div><p className="text-xl font-extrabold text-white">{formatNumber(expiringContracts.length)}</p><p className="text-[11px] text-white/70">قرارداد نزدیک انقضا</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ShoppingCart} label="سفارش‌های باز" value={openOrders.length} meta={`از ${formatNumber(orders.length)} سفارش ثبت‌شده`} tone="blue" />
        <MetricCard icon={Boxes} label="نسخه‌های کالا" value={variantCount} meta={`${formatNumber(products.length)} محصول در کاتالوگ`} tone="cyan" />
        <MetricCard icon={AlertTriangle} label="نیاز به تأمین" value={lowStock.length} meta="رسیده به نقطه سفارش مجدد" tone={lowStock.length ? "orange" : "green"} />
        <MetricCard icon={ClipboardList} label="قراردادهای فعال" value={contracts.length} meta={`${formatNumber(expiringContracts.length)} مورد تا ۶۰ روز آینده`} tone={expiringContracts.length ? "orange" : "green"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.9fr)]">
        <section>
          <SectionHeader title="روند سفارش‌ها" subtitle="سفارش‌های ثبت‌شده در هفت روز اخیر" />
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-text">{formatNumber(weeklyOrders.reduce((sum, day) => sum + day.count, 0))}</p>
                <p className="mt-1 text-xs text-text-muted">سفارش در این بازه</p>
              </div>
              <Badge tone="frost" dot>۷ روز اخیر</Badge>
            </div>
            <div aria-label="نمودار سفارش‌ها بر اساس روز" className="flex h-44 items-end justify-between gap-2 border-b border-border/20 px-1 sm:gap-4" role="img">
              {weeklyOrders.map((day, index) => (
                <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-semibold text-text-muted">{formatNumber(day.count)}</span>
                  <div className="flex h-[116px] w-full items-end rounded-t-lg bg-accent/5">
                    <div
                      className={`w-full rounded-t-lg transition-all ${index === weeklyOrders.length - 1 ? "bg-accent" : "bg-accent/55"}`}
                      style={{ height: `${Math.max(day.count > 0 ? 12 : 3, (day.count / maxOrders) * 100)}%` }}
                    />
                  </div>
                  <span className="pb-3 text-[10px] text-text-faint">{day.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-7">
            <SectionHeader
              title="آخرین سفارش‌ها"
              subtitle="شش مورد آخر ثبت‌شده در سامانه"
              action={<Link to="/orders" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/10">همه سفارش‌ها <ArrowUpLeft size={14} /></Link>}
            />
            {recentOrders.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="هنوز سفارشی ثبت نشده" description="پس از ثبت اولین سفارش، خلاصه آن اینجا نمایش داده می‌شود." />
            ) : (
              <DataTable columns={["شماره سفارش", "قرارداد", "انبار", "اقلام", "وضعیت", "تاریخ"]} compact>
                {recentOrders.map((order) => (
                  <Row key={order.id}>
                    <Cell className="font-mono text-xs font-bold" dir="ltr">{order.order_number}</Cell>
                    <Cell muted className="text-xs">{order.contract_number ?? "—"}</Cell>
                    <Cell muted className="text-xs">{order.warehouse_name ?? "—"}</Cell>
                    <Cell className="text-xs">{formatNumber(order.item_count)}</Cell>
                    <Cell><StatusBadge status={order.status} label={order.status_label} /></Cell>
                    <Cell muted className="whitespace-nowrap text-xs">{formatDate(order.created_at)}</Cell>
                  </Row>
                ))}
              </DataTable>
            )}
          </div>
        </section>

        <section className="space-y-7">
          <div>
            <SectionHeader title="هشدارهای موجودی" subtitle="کالاهای نیازمند بازبینی" action={<Link to="/inventory" className="text-xs font-bold text-accent hover:underline">مشاهده انبار</Link>} />
            <Card className="divide-y divide-ink/[0.07] overflow-hidden">
              {lowStock.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-text-muted">موجودی هیچ قلمی به نقطه سفارش نرسیده است.</p>
              ) : lowStock.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning"><TriangleAlert size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-text">{item.product_title}</p>
                    <p className="truncate font-mono text-[10px] text-text-faint" dir="ltr">{item.sku} · {item.warehouse_name}</p>
                  </div>
                  <span className="shrink-0 text-xs font-extrabold text-warning">{formatNumber(item.available)}</span>
                </div>
              ))}
            </Card>
          </div>

          <div>
            <SectionHeader title="قراردادهای نزدیک به انقضا" subtitle="پایان اعتبار در ۶۰ روز آینده" />
            <Card className="divide-y divide-ink/[0.07] overflow-hidden">
              {expiringContracts.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-text-muted">قرارداد نزدیک به انقضایی وجود ندارد.</p>
              ) : expiringContracts.slice(0, 5).map((contract) => (
                <div key={contract.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><FileText size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-text">{contract.title}</p>
                    <p className="truncate text-[10px] text-text-faint">{contract.company}</p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-bold ${contract.remaining < 0 ? "text-danger" : "text-warning"}`}>
                    {contract.remaining < 0 ? "منقضی" : `${formatNumber(contract.remaining)} روز`}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, meta, tone }) {
  const tones = {
    blue: "bg-accent2/10 text-accent2",
    cyan: "bg-accent/10 text-accent",
    orange: "bg-warning/10 text-warning",
    green: "bg-success/10 text-success",
  };
  return (
    <Card glow className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-text-muted">{label}</p>
          <p className="mt-3 text-[28px] font-extrabold leading-none tracking-tight text-text">{formatNumber(value)}</p>
          <p className="mt-2 text-[10px] text-text-faint">{meta}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${tones[tone]}`}><Icon size={18} /></span>
      </div>
    </Card>
  );
}
