import { useCallback, useState } from "react";
import { Check, PackageCheck, Plus, X } from "lucide-react";
import {
  Button,
  Cell,
  DataTable,
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
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { formatDateTime, formatNumber, useApi, useDebounced, useMutation } from "../lib/hooks";

const FILTERS = [
  { value: "", label: "همه درخواست‌ها" },
  { value: "requested", label: "در انتظار بررسی" },
  { value: "approved", label: "تأییدشده" },
  { value: "received", label: "دریافت‌شده" },
  { value: "rejected", label: "ردشده" },
];

export default function Returns() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounced(search);
  const fetcher = useCallback(
    () => api.getReturns({ search: debouncedSearch, status: statusFilter }),
    [debouncedSearch, statusFilter]
  );
  const { data: returns, status, error, refetch } = useApi(fetcher);
  const approve = useMutation((id) => api.approveReturn(id));
  const reject = useMutation((id) => api.rejectReturn(id));
  const receive = useMutation((id) => api.receiveReturn(id));

  async function runAction(mutation, id, successMessage) {
    const result = await mutation.run(id);
    if (!result.ok) return toast.error(result.error.message);
    toast.success(successMessage);
    refetch();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="پشتیبانی"
        title="مرجوعی‌ها"
        subtitle="ثبت درخواست، بررسی کالا و بازگشت اقلام سالم به موجودی انبار"
        actions={<Button icon={Plus} onClick={() => setCreateOpen(true)}>ثبت مرجوعی</Button>}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="شماره مرجوعی، سفارش یا دلیل..." />
          <Select value={statusFilter} onChange={setStatusFilter} options={FILTERS} className="sm:w-48" />
        </div>
      </PageHeader>

      {status === "loading" && <TableSkeleton rows={6} cols={6} />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}
      {status === "ready" && returns.length === 0 && (
        <EmptyState icon={PackageCheck} title="درخواستی ثبت نشده" description={search || statusFilter ? "فیلترها را تغییر دهید." : "برای سفارش تحویل‌شده یا ارسال‌شده، یک درخواست مرجوعی ثبت کنید."} action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>ثبت مرجوعی</Button>} />
      )}
      {status === "ready" && returns.length > 0 && (
        <DataTable columns={["شماره مرجوعی", "سفارش", "اقلام", "دلیل", "زمان درخواست", "وضعیت", "عملیات"]}>
          {returns.map((request) => (
            <Row key={request.id}>
              <Cell className="font-mono text-xs font-bold" dir="ltr">{request.return_number}</Cell>
              <Cell muted className="font-mono text-xs" dir="ltr">{request.order_number}</Cell>
              <Cell>{formatNumber(request.items.reduce((sum, item) => sum + item.quantity, 0))}</Cell>
              <Cell muted>{request.reason}</Cell>
              <Cell muted className="whitespace-nowrap text-xs">{formatDateTime(request.requested_at)}</Cell>
              <Cell><StatusBadge status={request.status} label={request.status_label} /></Cell>
              <Cell>
                <div className="flex flex-wrap items-center gap-1">
                  {request.status === "requested" && (
                    <>
                      <Button size="sm" variant="secondary" icon={Check} loading={approve.pending || reject.pending} onClick={() => runAction(approve, request.id, "درخواست مرجوعی تأیید شد.")}>تأیید</Button>
                      <Button size="sm" variant="danger" icon={X} loading={approve.pending || reject.pending} onClick={() => runAction(reject, request.id, "درخواست مرجوعی رد شد.")}>رد</Button>
                    </>
                  )}
                  {request.status === "approved" && (
                    <Button size="sm" icon={PackageCheck} loading={receive.pending} onClick={() => runAction(receive, request.id, "کالای مرجوعی دریافت و انبار به‌روزرسانی شد.")}>ثبت دریافت</Button>
                  )}
                </div>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}

      <CreateReturnModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); refetch(); }}
        toast={toast}
      />
    </div>
  );
}

function CreateReturnModal({ open, onClose, onCreated, toast }) {
  const orders = useApi(() => (open ? api.getOrders() : Promise.resolve([])), [open]);
  const [orderId, setOrderId] = useState("");
  const details = useApi(
    () => orderId ? api.getOrder(orderId) : Promise.resolve(null),
    [orderId]
  );
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lineDraft, setLineDraft] = useState({ orderId: "", values: {} });
  const lines = lineDraft.orderId === orderId ? lineDraft.values : {};
  const create = useMutation((payload) => api.createReturn(payload));
  const eligibleOrders = (orders.data ?? []).filter((order) => ["shipped", "delivered"].includes(order.status));
  const orderOptions = [
    { value: "", label: "انتخاب سفارش تحویل‌شده یا ارسال‌شده" },
    ...eligibleOrders.map((order) => ({ value: String(order.id), label: `${order.order_number} — ${order.status_label}` })),
  ];

  function updateLine(itemId, patch) {
    setLineDraft((current) => {
      const currentLines = current.orderId === orderId ? current.values : {};
      return {
        orderId,
        values: {
          ...currentLines,
          [itemId]: {
            quantity: "",
            serials: "",
            condition: "restock",
            ...currentLines[itemId],
            ...patch,
          },
        },
      };
    });
  }

  async function submit(event) {
    event.preventDefault();
    const order = details.data;
    const items = (order?.items ?? []).flatMap((item) => {
      const line = lines[item.id];
      const quantity = Number(line?.quantity ?? 0);
      if (!quantity) return [];
      return [{
        order_item: item.id,
        quantity,
        condition: line.condition,
        serial_numbers: line.serials
          ? line.serials.split(/[\n,،\r]+/).map((value) => value.trim()).filter(Boolean)
          : [],
      }];
    });
    if (!orderId || !reason.trim() || items.length === 0) {
      toast.error("سفارش، دلیل و حداقل یک قلم مرجوعی را وارد کنید.");
      return;
    }
    const result = await create.run({ order: Number(orderId), reason: reason.trim(), notes, items });
    if (!result.ok) return toast.error(result.error.message);
    toast.success("درخواست مرجوعی ثبت شد.");
    setReason("");
    setNotes("");
    setOrderId("");
    setLineDraft({ orderId: "", values: {} });
    onCreated();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت درخواست مرجوعی"
      subtitle="فقط اقلام سفارش ارسال‌شده یا تحویل‌شده قابل ثبت هستند."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>انصراف</Button>
          <Button form="create-return" type="submit" loading={create.pending}>ثبت درخواست</Button>
        </div>
      }
    >
      {orders.status === "loading" && <TableSkeleton rows={3} cols={2} />}
      {orders.status === "error" && <ErrorState message={orders.error} onRetry={orders.refetch} />}
      {orders.status === "ready" && eligibleOrders.length === 0 && (
        <EmptyState icon={PackageCheck} title="سفارش آماده مرجوعی نیست" description="ابتدا وضعیت یک سفارش را به ارسال‌شده یا تحویل‌شده تغییر دهید." />
      )}
      {orders.status === "ready" && eligibleOrders.length > 0 && (
        <form id="create-return" onSubmit={submit} className="space-y-4">
          <Field label="سفارش">
            <Select
              value={orderId}
              onChange={(value) => {
                setOrderId(value);
                setLineDraft({ orderId: value, values: {} });
              }}
              options={orderOptions}
              required
            />
          </Field>
          {details.status === "loading" && orderId && <TableSkeleton rows={2} cols={3} />}
          {details.status === "error" && <ErrorState message={details.error} />}
          {details.status === "ready" && details.data && (
            <div className="space-y-3">
              <SectionHeader title="اقلام سفارش" subtitle="تعداد را برای اقلام مرجوعی وارد کنید؛ برای کالاهای سریال‌دار، سریال‌ها را هم ثبت کنید." />
              {details.data.items.map((item) => {
                const line = lines[item.id] ?? { quantity: "", serials: "", condition: "restock" };
                return (
                  <div key={item.id} className="grid gap-3 rounded-2xl border border-border/20 bg-surface2/70 p-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <p className="text-sm font-bold text-text">{item.product_title}</p>
                      <p className="mt-1 font-mono text-[11px] text-text-faint" dir="ltr">{item.sku} · {formatNumber(item.quantity)} عدد ارسال‌شده</p>
                    </div>
                    <Field label="تعداد مرجوعی">
                      <Input type="number" min="0" max={item.quantity} value={line.quantity} onChange={(event) => updateLine(item.id, { quantity: event.target.value })} />
                    </Field>
                    <Field label="وضعیت کالا هنگام دریافت">
                      <Select value={line.condition} onChange={(value) => updateLine(item.id, { condition: value })} options={[{ value: "restock", label: "سالم؛ بازگشت به موجودی" }, { value: "defective", label: "معیوب؛ خارج از موجودی قابل فروش" }]} />
                    </Field>
                    {item.serial_numbers?.length > 0 && (
                      <Field label="سریال‌های این سفارش" hint={`سریال‌های فروخته‌شده: ${item.serial_numbers.join("، ")}`} className="sm:col-span-2">
                        <Textarea value={line.serials} onChange={(event) => updateLine(item.id, { serials: event.target.value })} placeholder="سریال دستگاه‌های مرجوعی را با ویرگول جدا کنید" dir="ltr" />
                      </Field>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <Field label="دلیل مرجوعی"><Input value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={255} /></Field>
          <Field label="توضیحات تکمیلی"><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        </form>
      )}
    </Modal>
  );
}
