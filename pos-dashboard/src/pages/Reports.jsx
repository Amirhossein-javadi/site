import { useCallback, useState } from "react";
import { Download, FileDown, Wallet } from "lucide-react";
import {
  Badge,
  Button,
  Cell,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Row,
  Select,
  StatCard,
  TableSkeleton,
} from "../components/ui";
import { api } from "../lib/api";
import { formatDateTime, formatMoney, formatNumber, useApi } from "../lib/hooks";

export default function Reports() {
  const [contractId, setContractId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const contracts = useApi(() => api.getContracts(), []);
  const fetchLedger = useCallback(
    () => api.getLedgerEntries({
      contract: contractId,
      from_date: fromDate,
      to_date: toDate,
    }),
    [contractId, fromDate, toDate]
  );
  const { data: entries, status, error, refetch } = useApi(
    fetchLedger,
    [contractId, fromDate, toDate]
  );

  const contractOptions = [
    { value: "", label: "همه قراردادها" },
    ...(contracts.data ?? []).map((contract) => ({
      value: String(contract.id),
      label: `${contract.number} — ${contract.company}`,
    })),
  ];

  const handleExport = async () => {
    setExporting(true);
    setExportError("");
    try {
      const { blob, filename } = await api.exportLedgerCsv({
        contract: contractId,
        from_date: fromDate,
        to_date: toDate,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setExportError(downloadError.message || "ساخت گزارش انجام نشد.");
    } finally {
      setExporting(false);
    }
  };

  const totals = (entries ?? []).reduce(
    (sum, entry) => {
      if (entry.kind === "debit") sum.debit += Number(entry.amount_irt);
      else sum.credit += Number(entry.amount_irt);
      return sum;
    },
    { debit: 0, credit: 0 }
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="مالی"
        title="گزارش مالی"
        subtitle="گردش دفتر مالی را بر اساس قرارداد و بازه زمانی مرور و فایل CSV سازگار با Excel دریافت کنید."
        actions={(
          <Button icon={Download} loading={exporting} onClick={handleExport}>
            دریافت گزارش CSV
          </Button>
        )}
      >
        <div className="grid gap-3 rounded-2xl border border-border/20 bg-surface/70 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="قرارداد">
            <Select
              aria-label="فیلتر قرارداد"
              value={contractId}
              onChange={setContractId}
              options={contractOptions}
            />
          </Field>
          <Field label="از تاریخ">
            <Input
              type="date"
              aria-label="از تاریخ"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </Field>
          <Field label="تا تاریخ">
            <Input
              type="date"
              aria-label="تا تاریخ"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </Field>
        </div>
      </PageHeader>

      {exportError && (
        <p className="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {exportError}
        </p>
      )}
      {contracts.status === "error" && (
        <ErrorState message={contracts.error} onRetry={contracts.refetch} />
      )}
      {status === "loading" && <TableSkeleton rows={5} cols={7} />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}
      {status === "ready" && entries && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard label="جمع بدهکار" value={formatMoney(totals.debit, "IRT")} icon={Wallet} tone="warn" />
            <StatCard label="جمع بستانکار" value={formatMoney(totals.credit, "IRT")} icon={Wallet} tone="success" />
            <StatCard
              label="خالص گردش بازه"
              value={formatMoney(totals.debit - totals.credit, "IRT")}
              icon={Wallet}
              tone={totals.debit > totals.credit ? "warn" : "frost"}
            />
          </div>

          {entries.length === 0 ? (
            <EmptyState
              icon={FileDown}
              title="گردشی در این بازه پیدا نشد"
              description="فیلتر قرارداد یا تاریخ را تغییر دهید؛ گزارش CSV همین فیلترها را اعمال می‌کند."
            />
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-text-faint">
                <span>{formatNumber(entries.length)} ردیف مالی</span>
                <Badge tone="neutral">مبالغ به تومان</Badge>
              </div>
              <DataTable columns={["زمان ثبت", "قرارداد", "نوع گردش", "بدهکار", "بستانکار", "مرجع", "توضیح"]}>
                {entries.map((entry) => (
                  <Row key={entry.id}>
                    <Cell muted className="whitespace-nowrap text-xs">{formatDateTime(entry.created_at)}</Cell>
                    <Cell className="font-mono text-xs" dir="ltr">{entry.contract_number}</Cell>
                    <Cell>
                      <Badge tone={entry.kind === "debit" ? "warn" : "success"}>
                        {entry.kind_label}
                      </Badge>
                    </Cell>
                    <Cell className="font-semibold">
                      {entry.kind === "debit" ? formatMoney(entry.amount_irt, "IRT") : "—"}
                    </Cell>
                    <Cell className="font-semibold">
                      {entry.kind === "credit" ? formatMoney(entry.amount_irt, "IRT") : "—"}
                    </Cell>
                    <Cell muted className="font-mono text-xs" dir="ltr">{entry.reference}</Cell>
                    <Cell muted>{entry.note || "—"}</Cell>
                  </Row>
                ))}
              </DataTable>
            </>
          )}
        </>
      )}
    </div>
  );
}
