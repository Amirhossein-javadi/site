import { useCallback } from "react";
import { FilePlus2, Receipt } from "lucide-react";
import {
  Button,
  Cell,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Row,
  TableSkeleton,
} from "../components/ui";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { formatDate, formatMoney, formatNumber, useApi, useMutation } from "../lib/hooks";

export default function Proformas() {
  const toast = useToast();
  const fetcher = useCallback(
    () => Promise.all([api.getProformas(), api.getOrders()]).then(([proformas, orders]) => ({ proformas, orders })),
    []
  );
  const { data, status, error, refetch } = useApi(fetcher);
  const issue = useMutation((orderId) => api.issueProforma(orderId));
  const issuedOrderIds = new Set((data?.proformas ?? []).map((invoice) => invoice.order));
  const eligibleOrders = (data?.orders ?? []).filter(
    (order) => order.status !== "cancelled" && !issuedOrderIds.has(order.id)
  );

  async function issueFor(order) {
    const result = await issue.run(order.id);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`پیش‌فاکتور سفارش ${order.order_number} صادر شد.`);
    refetch();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="فروش"
        title="پیش‌فاکتورها"
        subtitle="صدور و پیگیری نسخه‌ی ثابت قیمت، نرخ ارز و مالیات سفارش‌ها"
      />

      {status === "loading" && <TableSkeleton rows={5} cols={6} />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}
      {status === "ready" && (
        <>
          {eligibleOrders.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-bold text-text">سفارش‌های آماده صدور</h2>
              <DataTable columns={["شماره سفارش", "قرارداد", "تاریخ ثبت", "عملیات"]}>
                {eligibleOrders.map((order) => (
                  <Row key={order.id}>
                    <Cell className="font-mono text-xs font-bold" dir="ltr">{order.order_number}</Cell>
                    <Cell muted>{order.contract_number}</Cell>
                    <Cell muted>{formatDate(order.created_at)}</Cell>
                    <Cell>
                      <Button size="sm" icon={FilePlus2} loading={issue.pending} onClick={() => issueFor(order)}>
                        صدور پیش‌فاکتور
                      </Button>
                    </Cell>
                  </Row>
                ))}
              </DataTable>
            </section>
          )}

          {data.proformas.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="پیش‌فاکتوری ثبت نشده"
              description={eligibleOrders.length ? "برای صدور، یکی از سفارش‌های بالا را انتخاب کنید." : "ابتدا یک سفارش ثبت کنید."}
            />
          ) : (
            <DataTable columns={["شماره پیش‌فاکتور", "شماره سفارش", "اقلام", "مبلغ نهایی", "اعتبار تا", "وضعیت"]}>
              {data.proformas.map((invoice) => (
                <Row key={invoice.id}>
                  <Cell className="font-mono text-xs font-bold" dir="ltr">{invoice.number}</Cell>
                  <Cell muted className="font-mono text-xs" dir="ltr">{invoice.order_number}</Cell>
                  <Cell>{formatNumber(invoice.lines.length)} قلم</Cell>
                  <Cell className="font-bold">{formatMoney(invoice.total_irt, "IRT")}</Cell>
                  <Cell muted className="whitespace-nowrap">{formatDate(invoice.valid_until)}</Cell>
                  <Cell>
                    <StatusBadge
                      status={invoice.is_expired ? "expired" : invoice.status}
                      label={invoice.is_expired ? "منقضی‌شده" : invoice.status_label}
                    />
                  </Cell>
                </Row>
              ))}
            </DataTable>
          )}
        </>
      )}
    </div>
  );
}
