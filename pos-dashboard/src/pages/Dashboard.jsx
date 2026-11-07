import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpLeft,
  Boxes,
  CalendarDays,
  ClipboardList,
  FileText,
  ScanBarcode,
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
      <div className="space-y-6">
        <div className="dashboard-hero h-56 animate-pulse rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Card key={index} className="h-32 p-5"><div className="skeleton h-3 w-24 rounded" /><div className="skeleton mt-6 h-8 w-20 rounded" /></Card>)}
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  if (status === "error") return <ErrorState message={error} onRetry={refetch} />;

  const [orders, inventory, products, contracts] = data;
  const openOrders = orders.filter((order) => OPEN_STATUSES.includes(order.status));
  const lowStock = inventory.filter((item) => item.is_below_reorder_point);
  const availableUnits = inventory.reduce((sum, item) => sum + item.available, 0);
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
      <section className="dashboard-hero relative overflow-hidden rounded-xl p-6 sm:p-8">
        <div aria-hidden="true" className="dashboard-hero-orb absolute -left-10 -top-28 h-72 w-72 rounded-full" />
        <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 border border-white/15 bg-white/[0.06] px-3 py-2 text-[10px] font-bold tracking-[0.1em] text-white/75">
              <span className="h-1.5 w-1.5 rounded-full bg-frost" />
              نمای کلی عملیات
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">کنترل روزانه‌ی کسب‌وکار</h1>
            <p className="mt-2 text-sm leading-7 text-white/65">نمای یکپارچه‌ی سفارش، انبار و قراردادهای فعال.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 border border-white/15 bg-black/15 px-3.5 py-2.5 text-xs font-semibold text-white/80">
              <CalendarDays size={14} />{today}
            </div>
            <Link to="/inventory" className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-xs font-extrabold text-[#101a2d] transition hover:bg-white/85">
              وضعیت موجودی <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
        <div className="relative z-10 mt-8 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
          <HeroStat label="سفارش باز" value={openOrders.length} />
          <HeroStat label="موجودی قابل فروش" value={availableUnits} />
          <HeroStat label="نسخه کالا" value={variantCount} />
          <HeroStat label="قرارداد فعال" value={contracts.length} />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ShoppingCart} label="سفارش‌های باز" value={openOrders.length} meta={`از ${formatNumber(orders.length)} سفارش ثبت‌شده`} />
        <MetricCard icon={Boxes} label="نسخه‌های کالا" value={variantCount} meta={`${formatNumber(products.length)} محصول در کاتالوگ`} />
        <MetricCard icon={TriangleAlert} label="نیاز به تأمین" value={lowStock.length} meta="اقلام رسیده به نقطه سفارش" />
        <MetricCard icon={ClipboardList} label="قراردادهای فعال" value={contracts.length} meta={`${formatNumber(expiringContracts.length)} مورد تا ۶۰ روز آینده`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <div className="space-y-7">
          <section>
            <SectionHeader title="روند سفارش‌ها" subtitle="تعداد سفارش‌های هفت روز اخیر" />
            <Card className="p-5 sm:p-6">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div><p className="text-3xl font-extrabold tracking-tight">{formatNumber(weeklyOrders.reduce((sum, day) => sum + day.count, 0))}</p><p className="mt-1 text-xs text-text-muted">سفارش در این بازه</p></div>
                <Badge tone="frost" dot>۷ روز اخیر</Badge>
              </div>
              <div aria-label="نمودار سفارش‌ها بر اساس روز" className="flex h-44 items-end justify-between gap-2 border-b border-border/50 px-1 sm:gap-4" role="img">
                {weeklyOrders.map((day, index) => (
                  <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] font-semibold text-text-muted">{formatNumber(day.count)}</span>
                    <div className="flex h-[116px] w-full items-end bg-navy/10">
                      <div className={`w-full transition-all ${index === weeklyOrders.length - 1 ? "bg-navy" : "bg-navy/55"}`} style={{ height: `${Math.max(day.count > 0 ? 12 : 3, (day.count / maxOrders) * 100)}%` }} />
                    </div>
                    <span className="pb-3 text-[10px] text-text-faint">{day.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section>
            <SectionHeader
              title="آخرین سفارش‌ها"
              subtitle="شش سفارش آخر ثبت‌شده در سامانه"
              action={<Link to="/orders" className="inline-flex items-center gap-1 text-xs font-bold text-frost hover:text-text">همه سفارش‌ها <ArrowUpLeft size={14} /></Link>}
            />
            {recentOrders.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="هنوز سفارشی ثبت نشده" description="پس از ثبت اولین سفارش، خلاصه‌ی آن در این بخش نمایش داده می‌شود." />
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
          </section>
        </div>

        <div className="space-y-7">
          <section>
            <SectionHeader title="هشدارهای موجودی" subtitle="اقلام نیازمند بازبینی" action={<Link to="/inventory" className="text-xs font-bold text-frost hover:text-text">مشاهده انبار</Link>} />
            <Card className="divide-y divide-border/40 overflow-hidden">
              {lowStock.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-text-muted">موجودی هیچ قلمی به نقطه سفارش نرسیده است.</p>
              ) : lowStock.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy/20 text-frost"><TriangleAlert size={15} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.product_title}</p><p className="truncate font-mono text-[10px] text-text-faint" dir="ltr">{item.sku} · {item.warehouse_name}</p></div>
                  <span className="shrink-0 text-xs font-extrabold text-frost">{formatNumber(item.available)}</span>
                </div>
              ))}
            </Card>
          </section>

          <section>
            <SectionHeader title="قراردادهای نزدیک به انقضا" subtitle="پایان اعتبار در ۶۰ روز آینده" />
            <Card className="divide-y divide-border/40 overflow-hidden">
              {expiringContracts.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-text-muted">قرارداد نزدیک به انقضایی وجود ندارد.</p>
              ) : expiringContracts.slice(0, 5).map((contract) => (
                <div key={contract.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy/25 text-frost"><FileText size={15} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{contract.title}</p><p className="truncate text-[10px] text-text-faint">{contract.company}</p></div>
                  <span className="shrink-0 text-[11px] font-bold text-text-muted">{contract.remaining < 0 ? "منقضی" : `${formatNumber(contract.remaining)} روز`}</span>
                </div>
              ))}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="bg-[#101a2d]/85 px-4 py-3.5 sm:px-5">
      <p className="text-[10px] font-medium text-white/50">{label}</p>
      <p className="mt-1.5 text-xl font-extrabold text-white">{formatNumber(value)}</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, meta }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute right-0 top-0 h-1 w-12 bg-navy" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-text-muted">{label}</p>
          <p className="mt-3 text-[28px] font-extrabold leading-none tracking-tight">{formatNumber(value)}</p>
          <p className="mt-2 text-[10px] text-text-faint">{meta}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-white"><Icon size={18} /></span>
      </div>
    </Card>
  );
}
