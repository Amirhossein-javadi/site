import { useState } from "react";
import { Plus, ScanBarcode } from "lucide-react";
import {
  Badge,
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
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { formatDate, formatNumber, useApi, useMutation } from "../lib/hooks";

const SERIAL_STATUS_TONES = {
  in_stock: "success",
  reserved: "warn",
  sold: "neutral",
  returned: "warn",
  defective: "danger",
};

export default function Inventory() {
  const toast = useToast();
  const [tab, setTab] = useState("stock"); // stock | serials
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [serialStatus, setSerialStatus] = useState("");

  const warehouses = useApi(() => api.getWarehouses(), []);

  const stock = useApi(
    () => api.getInventory({ search: query, warehouse }),
    [query, warehouse]
  );

  const serials = useApi(
    () => api.getSerials({ search: query, warehouse, status: serialStatus }),
    [query, warehouse, serialStatus]
  );

  const active = tab === "stock" ? stock : serials;

  const warehouseOptions = [
    { value: "", label: "همه انبارها" },
    ...(warehouses.data ?? []).map((w) => ({
      value: String(w.id),
      label: w.name,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="موجودی و سریال"
        actions={<Button icon={Plus} onClick={() => setReceiveOpen(true)}>ثبت ورود کالا</Button>}
        badge={
          active.status === "ready" && (
            <Badge>{formatNumber(active.data?.length ?? 0)} ردیف</Badge>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            {[
              { key: "stock", label: "موجودی" },
              { key: "serials", label: "سریال دستگاه‌ها" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  tab === t.key
                    ? "bg-accent text-[#05243a] shadow-md shadow-accent/20"
                    : "bg-surface2 text-text-muted hover:bg-border hover:text-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={
              tab === "stock" ? "جستجوی کالا..." : "جستجوی شماره سریال..."
            }
          />

          <Select
            value={warehouse}
            onChange={setWarehouse}
            options={warehouseOptions}
          />

          {tab === "serials" && (
            <Select
              value={serialStatus}
              onChange={setSerialStatus}
              options={[
                { value: "", label: "همه وضعیت‌ها" },
                { value: "in_stock", label: "موجود در انبار" },
                { value: "reserved", label: "رزرو شده" },
                { value: "sold", label: "فروخته شده" },
                { value: "returned", label: "مرجوعی" },
                { value: "defective", label: "معیوب" },
              ]}
            />
          )}
        </div>
      </PageHeader>

      {active.status === "loading" && <TableSkeleton cols={6} />}
      {active.status === "error" && <ErrorState message={active.error} />}

      {active.status === "ready" && (active.data?.length ?? 0) === 0 && (
        <EmptyState
          icon={ScanBarcode}
          title="ردیفی پیدا نشد"
          description="فیلترها را تغییر دهید یا از پنل ادمین کالا وارد انبار کنید."
        />
      )}

      {active.status === "ready" && tab === "stock" && active.data.length > 0 && (
        <DataTable
          columns={[
            "SKU",
            "کالا",
            "انبار",
            "موجودی فیزیکی",
            "رزرو شده",
            "قابل فروش",
            "وضعیت",
          ]}
        >
          {active.data.map((item) => (
            <Row key={item.id}>
              <Cell muted className="font-mono text-xs">
                {item.sku}
              </Cell>
              <Cell>{item.product_title}</Cell>
              <Cell muted>{item.warehouse_name}</Cell>
              <Cell muted>{formatNumber(item.on_hand)}</Cell>
              <Cell muted>{formatNumber(item.reserved)}</Cell>
              <Cell>
                <Badge
                  tone={
                    item.available <= 0
                      ? "danger"
                      : item.is_below_reorder_point
                      ? "warn"
                      : "success"
                  }
                >
                  {formatNumber(item.available)}
                </Badge>
              </Cell>
              <Cell muted>
                {item.is_below_reorder_point ? (
                  <Badge tone="warn">نیاز به سفارش مجدد</Badge>
                ) : (
                  <span className="text-text-faint">عادی</span>
                )}
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}

      {active.status === "ready" && tab === "serials" && active.data.length > 0 && (
        <DataTable
          columns={["شماره سریال", "کالا", "انبار", "وضعیت", "تاریخ ورود"]}
        >
          {active.data.map((serial) => (
            <Row key={serial.id}>
              <Cell className="font-mono text-xs">{serial.serial_number}</Cell>
              <Cell muted>{serial.product_title}</Cell>
              <Cell muted>{serial.warehouse_name}</Cell>
              <Cell>
                <Badge tone={SERIAL_STATUS_TONES[serial.status] ?? "neutral"}>
                  {serial.status_label}
                </Badge>
              </Cell>
              <Cell muted>{formatDate(serial.received_at)}</Cell>
            </Row>
          ))}
        </DataTable>
      )}

      <ReceiveStockModal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onReceived={() => {
          setReceiveOpen(false);
          stock.refetch();
          serials.refetch();
          toast.success("ورود کالا ثبت شد و دفتر انبار به‌روزرسانی شد.");
        }}
        toast={toast}
      />
    </div>
  );
}

function ReceiveStockModal({ open, onClose, onReceived, toast }) {
  const options = useApi(
    () => open
      ? Promise.all([api.getWarehouses(), api.getVariants()])
      : Promise.resolve([[], []]),
    [open]
  );
  const [warehouse, setWarehouse] = useState("");
  const [variant, setVariant] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [serialText, setSerialText] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const receive = useMutation((payload) => api.receiveStock(payload));
  const [warehouses, variants] = options.data ?? [[], []];
  const selectedVariant = variants.find((item) => String(item.id) === variant);

  async function submit(event) {
    event.preventDefault();
    if (!warehouse || !variant || Number(quantity) < 1) {
      toast.error("انبار، کالا و تعداد معتبر را وارد کنید.");
      return;
    }
    const serialNumbers = serialText
      ? serialText.split(/[\n,،\r]+/).map((value) => value.trim()).filter(Boolean)
      : [];
    const result = await receive.run({
      warehouse: Number(warehouse),
      variant: Number(variant),
      quantity: Number(quantity),
      serial_numbers: serialNumbers,
      reference,
      note,
    });
    if (!result.ok) return toast.error(result.error.message);
    setWarehouse("");
    setVariant("");
    setQuantity("1");
    setSerialText("");
    setReference("");
    setNote("");
    onReceived();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت ورود کالا به انبار"
      subtitle="موجودی فقط از طریق این عملیات به‌روزرسانی و در دفتر انبار ثبت می‌شود."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>انصراف</Button>
          <Button form="receive-stock" type="submit" loading={receive.pending}>ثبت ورود</Button>
        </div>
      }
    >
      {options.status === "loading" && <TableSkeleton rows={3} cols={2} />}
      {options.status === "error" && <ErrorState message={options.error} onRetry={options.refetch} />}
      {options.status === "ready" && (
        <form id="receive-stock" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="انبار">
            <Select value={warehouse} onChange={setWarehouse} required options={[
              { value: "", label: "انتخاب انبار" },
              ...warehouses.map((item) => ({ value: String(item.id), label: item.name })),
            ]} />
          </Field>
          <Field label="کالا / نسخه">
            <Select value={variant} onChange={(value) => { setVariant(value); setSerialText(""); }} required options={[
              { value: "", label: "انتخاب نسخه کالا" },
              ...variants.map((item) => ({ value: String(item.id), label: `${item.product_name} — ${item.name} · ${item.sku}` })),
            ]} />
          </Field>
          <Field label="تعداد">
            <Input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          </Field>
          <Field label="مرجع رسید" hint="اختیاری؛ مثل شماره فاکتور خرید">
            <Input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={100} />
          </Field>
          {selectedVariant?.requires_serial && (
            <Field label="شماره سریال‌ها" hint={`دقیقاً ${quantity || 0} سریال یکتا وارد کنید.`} className="sm:col-span-2">
              <Textarea value={serialText} onChange={(event) => setSerialText(event.target.value)} placeholder="هر سریال را در یک خط یا با ویرگول جدا کنید" dir="ltr" />
            </Field>
          )}
          <Field label="توضیحات" className="sm:col-span-2">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={255} />
          </Field>
        </form>
      )}
    </Modal>
  );
}
