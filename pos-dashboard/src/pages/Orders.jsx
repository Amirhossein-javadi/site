import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Plus, Receipt, ShoppingCart, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Cell,
  DataTable,
  DetailItem,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHeader,
  Row,
  SearchInput,
  SectionHeader,
  Select,
  TableSkeleton,
  Textarea,
} from "../components/ui";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/toast-context";
import { api } from "../lib/api";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  useApi,
  useDebounced,
  useMutation,
} from "../lib/hooks";

const STATUS_OPTIONS = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "pending", label: "در انتظار بررسی" },
  { value: "confirmed", label: "تایید شده" },
  { value: "processing", label: "در حال آماده‌سازی" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل شده" },
  { value: "cancelled", label: "لغو شده" },
];

// مسیرهای مجاز چرخه عمر سفارش، مطابق services بک‌اند.
const NEXT_STATUSES = {
  pending: [{ value: "confirmed", label: "تایید سفارش" }],
  confirmed: [{ value: "processing", label: "شروع آماده‌سازی" }],
  processing: [{ value: "shipped", label: "ثبت ارسال" }],
  shipped: [{ value: "delivered", label: "ثبت تحویل" }],
};

export default function Orders() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounced(search);

  const listFetcher = useCallback(
    () => api.getOrders({ search: debouncedSearch, status: statusFilter }),
    [debouncedSearch, statusFilter]
  );
  const { data: orders, status, error, refetch } = useApi(listFetcher, [
    debouncedSearch,
    statusFilter,
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="فروش"
        title="سفارش‌ها"
        subtitle="ثبت سفارش، پیگیری چرخه عمر و مدیریت وضعیت‌ها"
      >
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button icon={Plus} onClick={() => setCreateOpen(true)} className="sm:order-first">
            ثبت سفارش
          </Button>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="جستجوی شماره سفارش یا قرارداد..."
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            className="sm:w-48"
          />
        </div>
      </PageHeader>

      {status === "loading" && <TableSkeleton rows={7} cols={6} />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}

      {status === "ready" &&
        (orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="سفارشی یافت نشد"
            description={
              search || statusFilter
                ? "با این فیلترها نتیجه‌ای وجود ندارد."
                : "اولین سفارش را از دکمه بالا ثبت کنید."
            }
          />
        ) : (
          <DataTable columns={["شماره سفارش", "قرارداد", "انبار", "اقلام", "وضعیت", "تاریخ ثبت"]}>
            {orders.map((order) => (
              <Row key={order.id} onClick={() => setSelectedId(order.id)}>
                <Cell className="font-mono text-xs font-bold" dir="ltr">
                  {order.order_number}
                </Cell>
                <Cell muted>{order.contract_number ?? "—"}</Cell>
                <Cell muted>{order.warehouse_name ?? "—"}</Cell>
                <Cell>{formatNumber(order.item_count)}</Cell>
                <Cell>
                  <StatusBadge status={order.status} label={order.status_label} />
                </Cell>
                <Cell muted className="whitespace-nowrap text-xs">
                  {formatDate(order.created_at)}
                </Cell>
              </Row>
            ))}
          </DataTable>
        ))}

      <OrderDrawer
        orderId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={refetch}
        toast={toast}
      />
      <CreateOrderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(order) => {
          refetch();
          setCreateOpen(false);
          setSelectedId(order.id);
        }}
        toast={toast}
      />
    </div>
  );
}

function OrderDrawer({ orderId, onClose, onChanged, toast }) {
  const fetcher = useCallback(
    async () => {
      if (!orderId) return null;
      const order = await api.getOrder(orderId);
      const payments = order.proforma
        ? await api.getPayments({ proforma: order.proforma.id })
        : [];
      return { order, payments };
    },
    [orderId]
  );
  const { data: snapshot, status, error, refetch } = useApi(fetcher, [orderId]);
  const order = snapshot?.order;
  const latestPayment = snapshot?.payments?.[0] ?? null;

  const transition = useMutation((id, to, note) => api.transitionOrder(id, to, note));
  const cancel = useMutation((id, note) => api.cancelOrder(id, note));
  const issueProforma = useMutation((id) => api.issueProforma(id));
  const startPayment = useMutation((proformaId, key) =>
    api.createPaymentIntent({ proforma: proformaId, idempotencyKey: key })
  );
  const verifyPayment = useMutation((id) => api.verifyPayment(id, "success"));

  async function refreshWorkflow() {
    refetch();
    onChanged();
  }

  async function handleTransition(toStatus) {
    const result = await transition.run(order.id, toStatus, "");
    if (result.ok) {
      toast.success("وضعیت سفارش به‌روزرسانی شد.");
      refetch();
      onChanged();
    } else {
      toast.error(result.error.message);
    }
  }

  async function handleCancel() {
    const result = await cancel.run(order.id, "");
    if (result.ok) {
      toast.success("سفارش لغو شد.");
      refetch();
      onChanged();
    } else {
      toast.error(result.error.message);
    }
  }

  async function handleIssueProforma() {
    const result = await issueProforma.run(order.id);
    if (result.ok) {
      toast.success("پیش‌فاکتور صادر شد.");
      refreshWorkflow();
    } else {
      toast.error(result.error.message);
    }
  }

  async function handleStartPayment() {
    const key = globalThis.crypto?.randomUUID?.() ?? `order-${order.id}-${Date.now()}`;
    const result = await startPayment.run(order.proforma.id, key);
    if (result.ok) {
      toast.success("درخواست پرداخت آزمایشی ساخته شد.");
      refreshWorkflow();
    } else {
      toast.error(result.error.message);
    }
  }

  async function handleVerifyPayment() {
    const result = await verifyPayment.run(latestPayment.id);
    if (result.ok) {
      toast.success("پرداخت آزمایشی تایید شد و سفارش به‌روزرسانی شد.");
      refreshWorkflow();
    } else {
      toast.error(result.error.message);
    }
  }

  const nextActions = order ? NEXT_STATUSES[order.status] ?? [] : [];
  const busy = transition.pending || cancel.pending || issueProforma.pending ||
    startPayment.pending || verifyPayment.pending;

  // جمع کل سفارش به تفکیک ارز — چون اقلام یک سفارش می‌توانند ارز متفاوت داشته باشند.
  const orderTotals = useMemo(() => {
    if (!order) return {};
    return order.items.reduce((totals, item) => {
      totals[item.currency] = (totals[item.currency] ?? 0) + Number(item.line_total);
      return totals;
    }, {});
  }, [order]);

  return (
    <Drawer
      open={Boolean(orderId)}
      onClose={onClose}
      title={order ? order.order_number : "جزئیات سفارش"}
      subtitle={order ? `ثبت‌شده در ${formatDateTime(order.created_at)}` : undefined}
    >
      {status === "loading" && <TableSkeleton rows={4} cols={2} />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}

      {status === "ready" && order && (
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} label={order.status_label} />
            {nextActions.map((action) => (
              <Button
                key={action.value}
                size="sm"
                variant="secondary"
                loading={busy}
                onClick={() => handleTransition(action.value)}
              >
                {action.label}
              </Button>
            ))}
            {order.is_cancellable && (
              <Button size="sm" variant="danger" loading={busy} onClick={handleCancel}>
                لغو سفارش
              </Button>
            )}
            {!order.proforma && order.status !== "cancelled" && (
              <Button size="sm" variant="secondary" icon={Receipt} loading={busy} onClick={handleIssueProforma}>
                صدور پیش‌فاکتور
              </Button>
            )}
          </div>

          {order.proforma && (
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-text">پیش‌فاکتور {order.proforma.number}</p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    مبلغ {formatMoney(order.proforma.total_irt, "IRT")} · اعتبار تا {formatDateTime(order.proforma.valid_until)}
                  </p>
                </div>
                <StatusBadge status={order.proforma.is_expired ? "expired" : order.proforma.status} label={order.proforma.is_expired ? "منقضی‌شده" : order.proforma.status_label} />
              </div>
              {!order.proforma.is_expired && latestPayment?.status !== "succeeded" && (
                <div className="flex flex-wrap gap-2">
                  {(!latestPayment || latestPayment.status === "failed") && (
                    <Button size="sm" variant="secondary" icon={CreditCard} loading={busy} onClick={handleStartPayment}>
                      شروع پرداخت آزمایشی
                    </Button>
                  )}
                  {latestPayment?.status === "pending" && (
                    <Button size="sm" icon={CheckCircle2} loading={busy} onClick={handleVerifyPayment}>
                      تایید پرداخت آزمایشی
                    </Button>
                  )}
                </div>
              )}
              {latestPayment && (
                <p className="text-[11px] text-text-muted">
                  پرداخت: {latestPayment.status_label} · {latestPayment.gateway_reference}
                </p>
              )}
              <p className="text-[10px] leading-5 text-text-faint">
                درگاه فعال این پروژه Mock است؛ تایید این مرحله فقط برای گردش آزمایشی محیط توسعه است.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="قرارداد" value={order.contract_number} />
            <DetailItem label="انبار مبدأ" value={order.warehouse_name} />
            <DetailItem label="تعداد اقلام" value={formatNumber(order.item_count)} />
            <DetailItem
              label="خروج از انبار"
              value={order.stock_issued_at ? formatDateTime(order.stock_issued_at) : "انجام نشده"}
            />
          </div>

          {order.notes && (
            <div>
              <SectionHeader title="یادداشت" />
              <Card className="p-4 text-sm leading-6 text-text-muted">{order.notes}</Card>
            </div>
          )}

          <div>
            <SectionHeader title="اقلام سفارش" />
            <Card className="divide-y divide-ink/[0.055] overflow-hidden">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text">{item.product_title}</p>
                    <p className="truncate font-mono text-[11px] text-text-faint" dir="ltr">
                      {item.sku}
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="text-xs font-bold text-text">
                      {formatNumber(item.quantity)} ×{" "}
                      {formatMoney(item.unit_price, item.currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-faint">
                      {formatMoney(item.line_total, item.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </Card>
            {Object.keys(orderTotals).length > 0 && (
              <div className="mt-2 flex flex-wrap justify-end gap-x-4 gap-y-1 px-1">
                {Object.entries(orderTotals).map(([currency, amount]) => (
                  <span key={currency} className="text-xs font-bold text-text">
                    جمع کل: {formatMoney(amount, currency)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionHeader title="تاریخچه وضعیت" />
            <ol className="relative space-y-4 border-r border-ink/[0.08] pr-5">
              {order.status_history.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -right-[23px] top-1.5 h-2 w-2 rounded-full bg-ink/40" />
                  <p className="text-xs font-bold text-text">
                    {entry.from_status_label} ← {entry.to_status_label}
                  </p>
                  <p className="mt-1 text-[11px] text-text-faint">
                    {formatDateTime(entry.changed_at)}
                    {entry.changed_by_email ? ` · ${entry.changed_by_email}` : ""}
                  </p>
                  {entry.note && (
                    <p className="mt-1 text-[11px] leading-5 text-text-muted">{entry.note}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function CreateOrderModal({ open, onClose, onCreated, toast }) {
  const optionsFetcher = useCallback(
    () =>
      open
        ? Promise.all([api.getContracts(), api.getWarehouses(), api.getVariants()])
        : Promise.resolve(null),
    [open]
  );
  const { data: options, status, error, refetch } = useApi(optionsFetcher, [open]);

  const [contract, setContract] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ variant: "", quantity: "1" }]);

  const create = useMutation((payload) => api.createOrder(payload));

  const [contracts, warehouses, variants] = options ?? [[], [], []];

  const variantsById = useMemo(() => {
    const map = {};
    for (const v of variants) map[String(v.id)] = v;
    return map;
  }, [variants]);

  const selectedContract = contracts.find((c) => String(c.id) === contract);
  const hasValidContracts = contracts.some((c) => c.is_valid_for_ordering);
  const availableVariants = variants.filter(
    (v) => !selectedContract || v.tenant_id === selectedContract.tenant_id
  );

  // جمع کل فرم به تفکیک ارز — برای این‌که پیش از ثبت، مبلغ نهایی سفارش دیده شود.
  const draftTotals = useMemo(() => {
    return items.reduce((totals, item) => {
      const variant = variantsById[item.variant];
      const qty = Number(item.quantity);
      if (!variant || !qty) return totals;
      totals[variant.currency] = (totals[variant.currency] ?? 0) + qty * Number(variant.base_price);
      return totals;
    }, {});
  }, [items, variantsById]);

  function updateItem(index, patch) {
    setItems((list) =>
      list.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        // با انتخاب یک کالای جدید، اگر تعداد فعلی کمتر از حداقل سفارش آن باشد،
        // خودکار روی حداقل مجاز تنظیم می‌شود تا خطای بدیهی در ثبت پیش نیاید.
        if (patch.variant) {
          const variant = variantsById[patch.variant];
          const minQty = variant?.min_order_quantity || 1;
          if (!next.quantity || Number(next.quantity) < minQty) {
            next.quantity = String(minQty);
          }
        }
        return next;
      })
    );
  }

  function resetForm() {
    setContract("");
    setWarehouse("");
    setNotes("");
    setItems([{ variant: "", quantity: "1" }]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanedItems = items.filter((item) => item.variant && Number(item.quantity) > 0);

    if (!contract || !warehouse || cleanedItems.length === 0) {
      toast.error("قرارداد، انبار و حداقل یک قلم کالا الزامی است.");
      return;
    }

    for (const item of cleanedItems) {
      const variant = variantsById[item.variant];
      const minQty = variant?.min_order_quantity || 1;
      if (variant && Number(item.quantity) < minQty) {
        toast.error(`حداقل تعداد سفارش برای «${variant.name}» ${minQty} عدد است.`);
        return;
      }
    }

    const payload = {
      contract: Number(contract),
      warehouse: Number(warehouse),
      notes,
      items: cleanedItems.map((item) => ({
        variant: Number(item.variant),
        quantity: Number(item.quantity),
      })),
    };

    const result = await create.run(payload);
    if (result.ok) {
      toast.success("سفارش با موفقیت ثبت شد.");
      resetForm();
      onCreated(result.data);
    } else {
      toast.error(result.error.message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت سفارش جدید"
      subtitle="سفارش تحت یک قرارداد فعال ثبت و موجودی به‌صورت خودکار رزرو می‌شود."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button form="create-order" type="submit" loading={create.pending}>
            ثبت سفارش
          </Button>
        </div>
      }
    >
      {status === "loading" && <TableSkeleton rows={3} cols={2} />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}

      {status === "ready" && options && (
        <form id="create-order" onSubmit={handleSubmit} className="space-y-5">
          {!hasValidContracts && (
            <p className="rounded-xl bg-warning/10 px-4 py-3 text-xs leading-5 text-warning">
              قرارداد فعالی برای ثبت سفارش وجود ندارد.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="قرارداد">
              <Select
                value={contract}
                onChange={(value) => {
                  setContract(value);
                  setWarehouse("");
                  setItems([{ variant: "", quantity: "1" }]);
                }}
                options={[
                  { value: "", label: "انتخاب قرارداد" },
                  ...contracts.filter((c) => c.is_valid_for_ordering).map((c) => ({
                    value: String(c.id),
                    label: `${c.number} — ${c.company}`,
                  })),
                ]}
              />
            </Field>
            <Field label="انبار مبدأ">
              <Select
                value={warehouse}
                onChange={setWarehouse}
                options={[
                  { value: "", label: "انتخاب انبار" },
                  ...warehouses
                    .filter((w) => w.is_active && (!contract || w.tenant_id === contracts.find((c) => String(c.id) === contract)?.tenant_id))
                    .map((w) => ({ value: String(w.id), label: w.name })),
                ]}
              />
            </Field>
          </div>

          <div>
            <SectionHeader
              title="اقلام سفارش"
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() => setItems((list) => [...list, { variant: "", quantity: "1" }])}
                >
                  افزودن قلم
                </Button>
              }
            />
            <div className="space-y-3">
              {items.map((item, index) => {
                const variant = variantsById[item.variant];
                const qty = Number(item.quantity) || 0;
                const lineTotal = variant ? qty * Number(variant.base_price) : 0;
                const minQty = variant?.min_order_quantity || 1;
                const belowMin = variant && qty > 0 && qty < minQty;
                const overStock = variant && qty > variant.total_available;

                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-end gap-2">
                      <Field label="کالا" className="flex-1">
                        <Select
                          value={item.variant}
                          onChange={(value) => updateItem(index, { variant: value })}
                      options={[
                        { value: "", label: "انتخاب کالا" },
                        ...availableVariants
                          .filter((v) => !items.some((other, otherIndex) => otherIndex !== index && other.variant === String(v.id)))
                          .map((v) => ({
                            value: String(v.id),
                            label: `${v.product_name} · ${v.name} — ${v.sku}`,
                          })),
                      ]}
                        />
                      </Field>
                      <Field label="تعداد" className="w-24 shrink-0">
                        <Input
                          type="number"
                          min={minQty}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: e.target.value })}
                        />
                      </Field>
                      <button
                        type="button"
                        aria-label="حذف قلم"
                        disabled={items.length === 1}
                        onClick={() => setItems((list) => list.filter((_, i) => i !== index))}
                        className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {variant && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pr-1 text-[11px] text-text-faint">
                        <span>قیمت واحد: {formatMoney(variant.base_price, variant.currency)}</span>
                        <span>موجودی قابل‌فروش: {formatNumber(variant.total_available)}</span>
                        {minQty > 1 && <span>حداقل سفارش: {formatNumber(minQty)}</span>}
                        <span className="mr-auto font-bold text-text-muted">
                          جمع ردیف: {formatMoney(lineTotal, variant.currency)}
                        </span>
                      </div>
                    )}
                    {belowMin && (
                      <p className="pr-1 text-[11px] text-warning">
                        حداقل تعداد سفارش برای این کالا {formatNumber(minQty)} عدد است.
                      </p>
                    )}
                    {overStock && (
                      <p className="pr-1 text-[11px] text-warning">
                        موجودی قابل‌فروش این کالا فقط {formatNumber(variant.total_available)} عدد است.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {Object.keys(draftTotals).length > 0 && (
              <div className="mt-3 flex flex-wrap justify-end gap-x-4 gap-y-1 border-t border-ink/[0.06] pt-3">
                {Object.entries(draftTotals).map(([currency, amount]) => (
                  <span key={currency} className="text-xs font-bold text-text">
                    جمع کل: {formatMoney(amount, currency)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Field label="یادداشت (اختیاری)">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="توضیح تکمیلی برای این سفارش..."
            />
          </Field>
        </form>
      )}
    </Modal>
  );
}
