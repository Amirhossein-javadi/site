import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Package,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import {
  Card,
  Cell,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Row,
  SectionHeader,
  StatCard,
  TableSkeleton,
} from "../components/ui";
import StatusBadge from "../components/StatusBadge";
import { api } from "../lib/api";
import { daysUntil, formatDate, formatNumber, useApi } from "../lib/hooks";

const OPEN_STATUSES = ["pending", "confirmed", "processing"];

export default function Dashboard() {
  const fetcher = useCallback(
    () =>
      Promise.all([
        api.getOrders(),
        api.getInventory(),
        api.getProducts(),
        api.getContracts(),
      ]),
    []
  );
  const { data, status, error, refetch } = useApi(fetcher);

  if (status === "loading") {
    return (
      <>
        <PageHeader eyebrow="نمای کلی" title="داشبورد" subtitle="وضعیت لحظه‌ای عملیات فروش و انبار" />
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-[118px] p-5">
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="skeleton mt-4 h-6 w-16 rounded-full" />
            </Card>
          ))}
        </div>
        <TableSkeleton rows={5} cols={5} />
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <PageHeader eyebrow="نمای کلی" title="داشبورد" />
        <ErrorState message={error} onRetry={refetch} />
      </>
    );
  }

  const [orders, inventory, products, contracts] = data;

  const openOrders = orders.filter((o) => OPEN_STATUSES.includes(o.status));
  const lowStock = inventory.filter((i) => i.is_below_reorder_point);
  const variantCount = products.reduce((sum, p) => sum + (p.variants?.length ?? 0), 0);
  const expiringContracts = contracts
    .map((c) => ({ ...c, remaining: daysUntil(c.end_date) }))
    .filter((c) => c.remaining !== null && c.remaining <= 60)
    .sort((a, b) => a.remaining - b.remaining);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="نمای کلی"
        title="داشبورد"
        subtitle="وضعیت لحظه‌ای عملیات فروش و انبار بر پایه داده‌های ثبت‌شده در سامانه"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label="سفارش‌های باز"
          value={formatNumber(openOrders.length)}
          meta={`از مجموع ${formatNumber(orders.length)} سفارش`}
        />
        <StatCard
          icon={Package}
          label="اقلام کالا"
          value={formatNumber(variantCount)}
          meta={`${formatNumber(products.length)} محصول فعال`}
          tone="frost"
        />
        <StatCard
          icon={AlertTriangle}
          label="اقلام کم‌موجود"
          value={formatNumber(lowStock.length)}
          meta="رسیده به نقطه سفارش مجدد"
          tone={lowStock.length ? "warn" : "success"}
        />
        <StatCard
          icon={FileText}
          label="قراردادها"
          value={formatNumber(contracts.length)}
          meta={`${formatNumber(expiringContracts.length)} مورد نزدیک به انقضا`}
          tone={expiringContracts.length ? "warn" : "success"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <SectionHeader
            title="آخرین سفارش‌ها"
            subtitle="شش سفارش اخیر ثبت‌شده"
            action={
              <Link
                to="/orders"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-text-muted transition-colors hover:bg-white/[0.05] hover:text-text"
              >
                همه سفارش‌ها <ArrowLeft size={14} />
              </Link>
            }
          />
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="هنوز سفارشی ثبت نشده"
              description="پس از ثبت اولین سفارش، خلاصه آن اینجا نمایش داده می‌شود."
            />
          ) : (
            <DataTable columns={["شماره سفارش", "قرارداد", "انبار", "اقلام", "وضعیت", "تاریخ"]} compact>
              {recentOrders.map((order) => (
                <Row key={order.id}>
                  <Cell className="font-mono text-xs font-bold" dir="ltr">
                    {order.order_number}
                  </Cell>
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

        <section className="space-y-6">
          <div>
            <SectionHeader title="هشدار موجودی" subtitle="اقلام نیازمند تأمین" />
            <Card className="divide-y divide-white/[0.055] overflow-hidden">
              {lowStock.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-text-muted">
                  موجودی هیچ قلمی به نقطه سفارش مجدد نرسیده است.
                </p>
              ) : (
                lowStock.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                    <TriangleAlert size={15} className="shrink-0 text-amber-300" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-text">{item.product_title}</p>
                      <p className="truncate font-mono text-[11px] text-text-faint" dir="ltr">
                        {item.sku} · {item.warehouse_name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-amber-300">
                      {formatNumber(item.available)}
                    </span>
                  </div>
                ))
              )}
            </Card>
          </div>

          <div>
            <SectionHeader title="قراردادهای نزدیک به انقضا" subtitle="کمتر از ۶۰ روز" />
            <Card className="divide-y divide-white/[0.055] overflow-hidden">
              {expiringContracts.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-text-muted">
                  قرارداد نزدیک به انقضایی وجود ندارد.
                </p>
              ) : (
                expiringContracts.slice(0, 5).map((contract) => (
                  <div key={contract.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-text">{contract.title}</p>
                      <p className="truncate text-[11px] text-text-faint">{contract.company}</p>
                    </div>
                    <span
                      className={`shrink-0 text-[11px] font-bold ${
                        contract.remaining < 0 ? "text-rose-300" : "text-amber-300"
                      }`}
                    >
                      {contract.remaining < 0
                        ? "منقضی"
                        : `${formatNumber(contract.remaining)} روز`}
                    </span>
                  </div>
                ))
              )}
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
