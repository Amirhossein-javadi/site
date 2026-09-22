import { useState } from "react";
import { Package } from "lucide-react";
import {
  Badge,
  Cell,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Row,
  SearchInput,
  TableSkeleton,
} from "../components/ui";
import { api } from "../lib/api";
import { formatMoney, formatNumber, useApi } from "../lib/hooks";

/** رنگ نشان موجودی بر اساس تعداد قابل فروش. */
function stockTone(available) {
  if (available <= 0) return "danger";
  if (available <= 10) return "warn";
  return "success";
}

export default function Products() {
  const [query, setQuery] = useState("");
  const { data, status, error } = useApi(() => api.getProducts(query), [query]);

  // هر نسخه محصول یک ردیف جدول می‌شود، چون قیمت و موجودی روی نسخه است.
  const rows =
    data?.flatMap((product) =>
      product.variants.map((variant) => ({ product, variant }))
    ) ?? [];

  return (
    <div>
      <PageHeader
        title="محصولات"
        badge={
          status === "ready" && <Badge>{formatNumber(rows.length)} نسخه</Badge>
        }
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="جستجو بر اساس نام، کد یا SKU..."
        />
      </PageHeader>

      {status === "loading" && <TableSkeleton cols={6} />}
      {status === "error" && <ErrorState message={error} />}

      {status === "ready" && rows.length === 0 && (
        <EmptyState
          icon={Package}
          title="محصولی پیدا نشد"
          description="عبارت جستجو را تغییر دهید یا از پنل ادمین محصول اضافه کنید."
        />
      )}

      {status === "ready" && rows.length > 0 && (
        <DataTable
          columns={[
            "SKU",
            "محصول",
            "برند",
            "دسته",
            "قیمت پایه",
            "قابل فروش",
            "سریال‌دار",
          ]}
        >
          {rows.map(({ product, variant }) => (
            <Row key={variant.id}>
              <Cell muted className="font-mono text-xs">
                {variant.sku}
              </Cell>
              <Cell>
                {product.name}
                <span className="block text-xs text-text-faint">
                  {variant.name}
                </span>
              </Cell>
              <Cell muted>{product.brand_name}</Cell>
              <Cell muted>{product.category_name}</Cell>
              <Cell muted>
                {formatMoney(variant.base_price, variant.currency)}
              </Cell>
              <Cell>
                <Badge tone={stockTone(variant.total_available)}>
                  {formatNumber(variant.total_available)}
                </Badge>
              </Cell>
              <Cell muted>
                {variant.requires_serial ? (
                  <Badge tone="neutral">بله</Badge>
                ) : (
                  <span className="text-text-faint">—</span>
                )}
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}
