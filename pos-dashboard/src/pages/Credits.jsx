import { useCallback, useState } from "react";
import { Wallet } from "lucide-react";
import {
  Badge,
  Cell,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Row,
  Select,
  StatCard,
  TableSkeleton,
} from "../components/ui";
import { api } from "../lib/api";
import { formatDateTime, formatMoney, formatNumber, useApi } from "../lib/hooks";

export default function Credits() {
  const [contractId, setContractId] = useState("");
  const contracts = useApi(() => api.getContracts(), []);
  const fetcher = useCallback(
    () => contractId
      ? Promise.all([
          api.getLedgerEntries(contractId),
          api.getContractBalance(contractId),
        ]).then(([entries, balance]) => ({ entries, balance }))
      : Promise.resolve({ entries: [], balance: null }),
    [contractId]
  );
  const { data, status, error, refetch } = useApi(fetcher);
  const contractOptions = [
    { value: "", label: "انتخاب قرارداد" },
    ...(contracts.data ?? []).map((contract) => ({
      value: String(contract.id),
      label: `${contract.number} — ${contract.company}`,
    })),
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="مالی"
        title="اعتبارات و دفتر مالی"
        subtitle="مانده بدهکار و بستانکار و گردش‌های ثبت‌شده هر قرارداد"
      >
        <Select
          aria-label="قرارداد"
          value={contractId}
          onChange={setContractId}
          options={contractOptions}
          className="sm:max-w-md"
        />
      </PageHeader>

      {contracts.status === "error" && <ErrorState message={contracts.error} onRetry={contracts.refetch} />}
      {!contractId && contracts.status === "ready" && contracts.data.length === 0 && (
        <EmptyState icon={Wallet} title="قراردادی وجود ندارد" description="پس از ثبت قرارداد، گردش مالی اینجا نمایش داده می‌شود." />
      )}
      {contractId && status === "loading" && <TableSkeleton rows={4} cols={4} />}
      {contractId && status === "error" && <ErrorState message={error} onRetry={refetch} />}
      {contractId && status === "ready" && data.balance && (
        <>
          <div className="mb-7 grid gap-4 md:grid-cols-3">
            <StatCard label="جمع بدهکار" value={formatMoney(data.balance.debit, "IRT")} icon={Wallet} />
            <StatCard label="جمع بستانکار" value={formatMoney(data.balance.credit, "IRT")} icon={Wallet} tone="success" />
            <StatCard
              label="مانده حساب"
              value={formatMoney(data.balance.balance, "IRT")}
              icon={Wallet}
              tone={Number(data.balance.balance) > 0 ? "warn" : "frost"}
              meta={Number(data.balance.balance) > 0 ? "مانده بدهکار" : "تسویه‌شده یا بستانکار"}
            />
          </div>
          {data.entries.length === 0 ? (
            <EmptyState icon={Wallet} title="گردشی ثبت نشده" description="با صدور پیش‌فاکتور یا ثبت پرداخت، گردش‌های مالی ظاهر می‌شوند." />
          ) : (
            <DataTable columns={["نوع گردش", "مبلغ", "مرجع", "توضیح", "زمان ثبت"]}>
              {data.entries.map((entry) => (
                <Row key={entry.id}>
                  <Cell><Badge tone={entry.kind === "debit" ? "warn" : "success"}>{entry.kind_label}</Badge></Cell>
                  <Cell className="font-bold">{formatMoney(entry.amount_irt, "IRT")}</Cell>
                  <Cell muted className="font-mono text-xs" dir="ltr">{entry.reference}</Cell>
                  <Cell muted>{entry.note || "—"}</Cell>
                  <Cell muted className="whitespace-nowrap text-xs">{formatDateTime(entry.created_at)}</Cell>
                </Row>
              ))}
            </DataTable>
          )}
          <p className="mt-3 text-[11px] leading-5 text-text-faint">
            {formatNumber(data.entries.length)} گردش مالی؛ ثبت بدهکار از پیش‌فاکتور و بستانکار از پرداخت تأییدشده انجام می‌شود.
          </p>
        </>
      )}
    </div>
  );
}
