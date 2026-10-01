import { useCallback } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import {
  Button,
  Cell,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Row,
  SectionHeader,
  TableSkeleton,
} from "../components/ui";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/toast-context";
import { api } from "../lib/api";
import { formatDateTime, formatMoney, useApi, useMutation } from "../lib/hooks";

function makeIdempotencyKey(proformaId) {
  return globalThis.crypto?.randomUUID?.() ?? `proforma-${proformaId}-${Date.now()}`;
}

export default function Payments() {
  const toast = useToast();
  const fetcher = useCallback(
    () => Promise.all([api.getPayments(), api.getProformas()]).then(([payments, proformas]) => ({ payments, proformas })),
    []
  );
  const { data, status, error, refetch } = useApi(fetcher);
  const create = useMutation((invoice) => api.createPaymentIntent({
    proforma: invoice.id,
    idempotencyKey: makeIdempotencyKey(invoice.id),
  }));
  const verify = useMutation((paymentId) => api.verifyPayment(paymentId, "success"));

  const latestByProforma = new Map();
  for (const payment of data?.payments ?? []) {
    if (!latestByProforma.has(payment.proforma)) latestByProforma.set(payment.proforma, payment);
  }
  const payable = (data?.proformas ?? []).filter((invoice) => {
    const payment = latestByProforma.get(invoice.id);
    return invoice.status === "issued" && !invoice.is_expired && payment?.status !== "succeeded";
  });

  async function startPayment(invoice) {
    const result = await create.run(invoice);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("تلاش پرداخت ایجاد شد.");
    refetch();
  }

  async function verifyPayment(payment) {
    const result = await verify.run(payment.id);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("پرداخت تأیید شد و دفتر مالی به‌روزرسانی شد.");
    refetch();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="مالی"
        title="پرداخت‌ها"
        subtitle="مشاهده تراکنش‌ها و پیگیری وضعیت پیش‌فاکتورهای قابل پرداخت"
      />
      {status === "loading" && <TableSkeleton rows={5} cols={6} />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}
      {status === "ready" && (
        <>
          {payable.length > 0 && (
            <section className="mb-8">
              <SectionHeader title="پیش‌فاکتورهای قابل پرداخت" subtitle="برای شروع تراکنش، پیش‌فاکتور را انتخاب کنید." />
              <DataTable columns={["پیش‌فاکتور", "سفارش", "مبلغ", "وضعیت تلاش آخر", "عملیات"]}>
                {payable.map((invoice) => {
                  const payment = latestByProforma.get(invoice.id);
                  return (
                    <Row key={invoice.id}>
                      <Cell className="font-mono text-xs font-bold" dir="ltr">{invoice.number}</Cell>
                      <Cell muted className="font-mono text-xs" dir="ltr">{invoice.order_number}</Cell>
                      <Cell className="font-bold">{formatMoney(invoice.total_irt, "IRT")}</Cell>
                      <Cell>{payment ? <StatusBadge status={payment.status} label={payment.status_label} /> : "بدون تراکنش"}</Cell>
                      <Cell>
                        {payment?.status === "pending" ? (
                          <Button size="sm" icon={CheckCircle2} loading={verify.pending} onClick={() => verifyPayment(payment)}>
                            تأیید پرداخت آزمایشی
                          </Button>
                        ) : (
                          <Button size="sm" icon={CreditCard} loading={create.pending} onClick={() => startPayment(invoice)}>
                            شروع پرداخت آزمایشی
                          </Button>
                        )}
                      </Cell>
                    </Row>
                  );
                })}
              </DataTable>
            </section>
          )}

          {data.payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="تراکنشی ثبت نشده"
              description={payable.length ? "برای یکی از پیش‌فاکتورهای بالا پرداخت آزمایشی بسازید." : "پس از صدور پیش‌فاکتور، تراکنش‌های پرداخت اینجا نمایش داده می‌شوند."}
            />
          ) : (
            <>
              <SectionHeader title="تاریخچه تراکنش‌ها" />
              <DataTable columns={["ارجاع درگاه", "پیش‌فاکتور", "سفارش", "مبلغ", "وضعیت", "زمان ثبت"]}>
                {data.payments.map((payment) => (
                  <Row key={payment.id}>
                    <Cell className="font-mono text-xs" dir="ltr">{payment.gateway_reference}</Cell>
                    <Cell muted className="font-mono text-xs" dir="ltr">{payment.proforma_number}</Cell>
                    <Cell muted className="font-mono text-xs" dir="ltr">{payment.order_number}</Cell>
                    <Cell className="font-bold">{formatMoney(payment.amount_irt, "IRT")}</Cell>
                    <Cell><StatusBadge status={payment.status} label={payment.status_label} /></Cell>
                    <Cell muted className="whitespace-nowrap text-xs">{formatDateTime(payment.created_at)}</Cell>
                  </Row>
                ))}
              </DataTable>
            </>
          )}
          <p className="mt-4 text-[11px] leading-5 text-text-faint">
            درگاه متصل در این محیط Mock است؛ عملیات شروع و تأیید برای گردش آزمایشی است و پولی جابه‌جا نمی‌کند.
          </p>
        </>
      )}
    </div>
  );
}
