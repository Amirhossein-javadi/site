import { ShoppingCart } from "lucide-react";
import {
  Badge, Cell, DataTable, EmptyState, ErrorState,
  PageHeader, Row, TableSkeleton,
} from "../components/ui";
import { api } from "../lib/api";
import { formatNumber, useApi } from "../lib/hooks";

export default function Orders() {
  const { data, status, error } = useApi(() => api.getOrders(""), []);

  return (
    <div>
      <PageHeader
        title="سفارشات"
        badge={
          status === "ready" && (
            <Badge>{formatNumber(data?.length ?? 0)} سفارش</Badge>
          )
        }
      />

      {status === "loading" && <TableSkeleton cols={4} />}
      {status === "error" && <ErrorState message={error} />}

      {status === "ready" && data.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          title="سفارشی پیدا نشد"
          description="هنوز هیچ سفارشی در سیستم ثبت نشده است."
        />
      )}

      {status === "ready" && data.length > 0 && (
        <DataTable columns={["شماره سفارش", "مبلغ کل", "تاریخ ثبت", "وضعیت"]}>
          {data.map((order) => (
            <Row key={order.id}>
              <Cell muted className="font-mono text-xs">#{order.id}</Cell>
              <Cell>{formatNumber(order.total_amount)} ریال</Cell>
              <Cell muted dir="ltr">
                {new Date(order.created_at).toLocaleDateString("fa-IR")}
              </Cell>
              <Cell>
                <Badge tone={order.status === "pending" ? "warn" : "success"}>
                  {order.status_label}
                </Badge>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}
