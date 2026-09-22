import { useState } from "react";
import { FileText } from "lucide-react";
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
import { formatNumber, useApi } from "../lib/hooks";

export default function Contracts() {
  const [query, setQuery] = useState("");
  const { data, status, error } = useApi(() => api.getContracts(query), [query]);

  return (
    <div>
      <PageHeader
        title="قراردادها"
        badge={
          status === "ready" && (
            <Badge>{formatNumber(data?.length ?? 0)} قرارداد</Badge>
          )
        }
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="جستجوی قرارداد..."
        />
      </PageHeader>

      {status === "loading" && <TableSkeleton cols={6} />}
      {status === "error" && <ErrorState message={error} />}

      {status === "ready" && data.length === 0 && (
        <EmptyState
          icon={FileText}
          title="قراردادی پیدا نشد"
          description="عبارت جستجو را تغییر دهید یا فیلتر را پاک کنید."
        />
      )}

      {status === "ready" && data.length > 0 && (
        <DataTable
          columns={[
            "شماره قرارداد",
            "عنوان",
            "شرکت نماینده",
            "سقف دستگاه",
            "تاریخ انقضا",
            "وضعیت",
          ]}
        >
          {data.map((c) => (
            <Row key={c.id}>
              <Cell muted className="font-mono text-xs">
                {c.number}
              </Cell>
              <Cell>{c.title}</Cell>
              <Cell muted>{c.company}</Cell>
              <Cell muted>{formatNumber(c.device_cap)}</Cell>
              <Cell muted>{c.end_date}</Cell>
              <Cell>
                <Badge tone="success">{c.status}</Badge>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}
