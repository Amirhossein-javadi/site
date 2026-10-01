import { useCallback, useState } from "react";
import { CheckCheck, Pencil, Send } from "lucide-react";
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
  Select,
  TableSkeleton,
  Textarea,
} from "../components/ui";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/toast-context";
import { api } from "../lib/api";
import { formatDateTime, formatNumber, useApi, useDebounced, useMutation } from "../lib/hooks";

const FILTERS = [
  { value: "", label: "همه مرسوله‌ها" },
  { value: "in_transit", label: "در مسیر" },
  { value: "delivered", label: "تحویل‌شده" },
];

export default function Shipments() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ carrier: "", tracking_number: "", notes: "" });
  const debouncedSearch = useDebounced(search);
  const fetcher = useCallback(
    () => api.getShipments({ search: debouncedSearch, status: statusFilter }),
    [debouncedSearch, statusFilter]
  );
  const { data: shipments, status, error, refetch } = useApi(fetcher, [
    debouncedSearch,
    statusFilter,
  ]);
  const update = useMutation((id, payload) => api.updateShipment(id, payload));
  const deliver = useMutation((id) => api.deliverShipment(id));

  function editShipment(shipment) {
    setEditing(shipment);
    setForm({
      carrier: shipment.carrier ?? "",
      tracking_number: shipment.tracking_number ?? "",
      notes: shipment.notes ?? "",
    });
  }

  async function save(event) {
    event.preventDefault();
    const result = await update.run(editing.id, form);
    if (!result.ok) return toast.error(result.error.message);
    toast.success("اطلاعات رهگیری ذخیره شد.");
    setEditing(null);
    refetch();
  }

  async function markDelivered(shipment) {
    const result = await deliver.run(shipment.id);
    if (!result.ok) return toast.error(result.error.message);
    toast.success("تحویل مرسوله ثبت شد و وضعیت سفارش به‌روز شد.");
    refetch();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="پشتیبانی"
        title="ارسال‌ها"
        subtitle="رهگیری سفارش‌های خارج‌شده از انبار و ثبت تحویل مرسوله"
        badge={status === "ready" && formatNumber(shipments.length)}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="شماره سفارش یا کد رهگیری..." />
          <Select value={statusFilter} onChange={setStatusFilter} options={FILTERS} className="sm:w-44" />
        </div>
      </PageHeader>

      {status === "loading" && <TableSkeleton rows={6} cols={7} />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}
      {status === "ready" && shipments.length === 0 && (
        <EmptyState icon={Send} title="مرسوله‌ای پیدا نشد" description={search || statusFilter ? "فیلترها را تغییر دهید." : "با ثبت ارسال سفارش، مرسوله به‌صورت خودکار اینجا ثبت می‌شود."} />
      )}
      {status === "ready" && shipments.length > 0 && (
        <DataTable columns={["سفارش", "قرارداد", "حمل‌کننده", "کد رهگیری", "اقلام", "وضعیت", "عملیات"]}>
          {shipments.map((shipment) => (
            <Row key={shipment.id}>
              <Cell className="font-mono text-xs font-bold" dir="ltr">
                {shipment.order_number}
                <span className="mt-1 block font-sans text-[10px] font-normal text-text-faint">{formatDateTime(shipment.shipped_at)}</span>
              </Cell>
              <Cell muted>{shipment.contract_number}</Cell>
              <Cell muted>{shipment.carrier || "ثبت نشده"}</Cell>
              <Cell muted className="font-mono text-xs" dir="ltr">{shipment.tracking_number || "—"}</Cell>
              <Cell>{formatNumber(shipment.item_count)}</Cell>
              <Cell><StatusBadge status={shipment.status} label={shipment.status_label} /></Cell>
              <Cell>
                <div className="flex items-center gap-1">
                  <button type="button" title="ویرایش رهگیری" aria-label="ویرایش رهگیری" onClick={() => editShipment(shipment)} className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted hover:bg-ink/[0.06] hover:text-accent"><Pencil size={16} /></button>
                  {shipment.status === "in_transit" && (
                    <Button size="sm" variant="secondary" icon={CheckCheck} loading={deliver.pending} onClick={() => markDelivered(shipment)}>ثبت تحویل</Button>
                  )}
                </div>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="ویرایش اطلاعات مرسوله"
        subtitle={editing?.order_number}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>انصراف</Button>
            <Button form="shipment-form" type="submit" loading={update.pending}>ذخیره</Button>
          </div>
        }
      >
        <form id="shipment-form" onSubmit={save} className="space-y-4">
          <Field label="شرکت حمل"><Input value={form.carrier} onChange={(event) => setForm({ ...form, carrier: event.target.value })} placeholder="مثلاً تیپاکس" /></Field>
          <Field label="کد رهگیری"><Input dir="ltr" className="text-left" value={form.tracking_number} onChange={(event) => setForm({ ...form, tracking_number: event.target.value })} /></Field>
          <Field label="یادداشت"><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
        </form>
      </Modal>
    </div>
  );
}
