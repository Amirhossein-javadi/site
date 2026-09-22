import { useState } from "react";
import { ScanBarcode } from "lucide-react";
import {
  Badge,
  Cell,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Row,
  SearchInput,
  Select,
  TableSkeleton,
} from "../components/ui";
import { api } from "../lib/api";
import { formatDate, formatNumber, useApi } from "../lib/hooks";

const SERIAL_STATUS_TONES = {
  in_stock: "success",
  reserved: "warn",
  sold: "neutral",
  returned: "warn",
  defective: "danger",
};

export default function Inventory() {
  const [tab, setTab] = useState("stock"); // stock | serials
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
                    ? "bg-accent text-white shadow-md shadow-accent/20"
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
    </div>
  );
}
