import { useCallback, useState } from "react";
import { Building2, Pencil, Plus, Power, Trash2, Truck, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
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
  StatCard,
  TableSkeleton,
} from "../components/ui";
import { useToast } from "../components/toast-context";
import { api } from "../lib/api";
import { formatNumber, useApi, useDebounced, useMutation } from "../lib/hooks";

const supplierConfig = {
  kind: "supplier",
  title: "تأمین‌کنندگان",
  subtitle: "ثبت اطلاعات تأمین‌کنندگان و مدیریت وضعیت همکاری",
  singular: "تأمین‌کننده",
  icon: Truck,
  searchPlaceholder: "جستجو بر اساس نام، کد، رابط یا تلفن...",
  filterOptions: [
    { value: "", label: "همه وضعیت‌ها" },
    { value: "active", label: "فعال" },
    { value: "suspended", label: "معلق" },
  ],
  columns: ["تأمین‌کننده", "رابط", "تلفن", "زمان تحویل", "وضعیت", "عملیات"],
  fields: [
    { name: "name", label: "نام تأمین‌کننده", required: true },
    { name: "code", label: "کد تأمین‌کننده", required: true, dir: "ltr" },
    { name: "contact_person", label: "نام رابط" },
    { name: "phone", label: "تلفن", dir: "ltr", inputMode: "tel" },
    {
      name: "lead_time_days",
      label: "زمان تحویل (روز)",
      type: "number",
      min: 0,
      required: true,
    },
    {
      name: "status",
      label: "وضعیت همکاری",
      type: "select",
      options: [
        { value: "active", label: "فعال" },
        { value: "suspended", label: "معلق" },
      ],
    },
  ],
  initial: {
    name: "",
    code: "",
    contact_person: "",
    phone: "",
    lead_time_days: "7",
    status: "active",
  },
  fetch: api.getSuppliers,
  create: api.createSupplier,
  update: api.updateSupplier,
  remove: api.deleteSupplier,
  filter: (status) => ({ status }),
  toPayload: (form) => ({ ...form, lead_time_days: Number(form.lead_time_days) }),
  statusPatch: (record) => ({
    status: record.status === "active" ? "suspended" : "active",
  }),
  isActive: (record) => record.status === "active",
  statusLabel: (record) => record.status_label || (record.status === "active" ? "فعال" : "معلق"),
  statusTone: (record) => (record.status === "active" ? "success" : "neutral"),
  getCells: (record) => [
    <Cell key="name">
      <div className="font-bold">{record.name}</div>
      <div className="mt-1 font-mono text-[11px] text-text-faint" dir="ltr">{record.code}</div>
    </Cell>,
    <Cell key="contact" muted>{record.contact_person || "—"}</Cell>,
    <Cell key="phone" muted dir="ltr" className="text-right">{record.phone || "—"}</Cell>,
    <Cell key="lead">{formatNumber(record.lead_time_days)} روز</Cell>,
  ],
  deleteDescription: "حذف تأمین‌کننده قابل بازگشت نیست.",
};

const customerConfig = {
  kind: "customer",
  title: "مشتریان",
  subtitle: "مدیریت شرکت‌های نماینده و وضعیت قراردادهای آن‌ها",
  singular: "مشتری",
  icon: Users,
  searchPlaceholder: "جستجو بر اساس نام شرکت...",
  filterOptions: [
    { value: "", label: "همه وضعیت‌ها" },
    { value: "true", label: "فعال" },
    { value: "false", label: "غیرفعال" },
  ],
  columns: ["نام شرکت", "قراردادها", "وضعیت", "عملیات"],
  fields: [
    { name: "name", label: "نام شرکت مشتری", required: true },
    {
      name: "is_active",
      label: "وضعیت مشتری",
      type: "select",
      options: [
        { value: "true", label: "فعال" },
        { value: "false", label: "غیرفعال" },
      ],
    },
  ],
  initial: { name: "", is_active: "true" },
  fetch: api.getCustomers,
  create: api.createCustomer,
  update: api.updateCustomer,
  remove: api.deleteCustomer,
  filter: (isActive) => ({ isActive }),
  toPayload: (form) => ({ ...form, is_active: form.is_active === "true" }),
  statusPatch: (record) => ({ is_active: !record.is_active }),
  isActive: (record) => record.is_active,
  statusLabel: (record) => record.status_label || (record.is_active ? "فعال" : "غیرفعال"),
  statusTone: (record) => (record.is_active ? "success" : "neutral"),
  getCells: (record) => [
    <Cell key="name">
      <div className="font-bold">{record.name}</div>
      <div className="mt-1 text-[11px] text-text-faint">شناسه {formatNumber(record.id)}</div>
    </Cell>,
    <Cell key="contracts">{formatNumber(record.contracts_count ?? 0)}</Cell>,
  ],
  deleteDescription:
    "اگر برای این مشتری قراردادی ثبت شده باشد، حذف انجام نمی‌شود؛ در آن حالت وضعیت مشتری را غیرفعال کنید.",
};

export function PartnerDirectory({ type }) {
  const config = type === "supplier" ? supplierConfig : customerConfig;
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(config.initial);
  const [deleting, setDeleting] = useState(null);
  const debouncedSearch = useDebounced(search);

  const listFetcher = useCallback(
    () => config.fetch({ search: debouncedSearch, ...config.filter(filter) }),
    [config, debouncedSearch, filter]
  );
  const { data: records, status, error, refetch } = useApi(listFetcher, [
    config,
    debouncedSearch,
    filter,
  ]);
  const save = useMutation((id, payload) =>
    id ? config.update(id, payload) : config.create(payload)
  );
  const changeStatus = useMutation((record) =>
    config.update(record.id, config.statusPatch(record))
  );
  const remove = useMutation((id) => config.remove(id));

  function openCreate() {
    setEditing(null);
    setForm({ ...config.initial });
    setFormOpen(true);
  }

  function openEdit(record) {
    setEditing(record);
    setForm(
      Object.fromEntries(
        config.fields.map(({ name }) => [
          name,
          name === "is_active"
            ? String(record[name])
            : String(record[name] ?? config.initial[name] ?? ""),
        ])
      )
    );
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    const result = await save.run(editing?.id, config.toPayload(form));
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(editing ? `${config.singular} ویرایش شد.` : `${config.singular} ثبت شد.`);
    setFormOpen(false);
    refetch();
  }

  async function toggleStatus(record) {
    const result = await changeStatus.run(record);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("وضعیت همکاری به‌روزرسانی شد.");
    refetch();
  }

  async function confirmDelete() {
    const result = await remove.run(deleting.id);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`${config.singular} حذف شد.`);
    setDeleting(null);
    refetch();
  }

  const activeCount = records?.filter(config.isActive).length ?? 0;
  const Icon = config.icon;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={type === "supplier" ? "انبار" : "فروش"}
        title={config.title}
        subtitle={config.subtitle}
        badge={status === "ready" && <Badge>{formatNumber(records.length)} مورد</Badge>}
        actions={
          <Button icon={Plus} onClick={openCreate}>
            ثبت {config.singular}
          </Button>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder={config.searchPlaceholder} />
          <Select
            aria-label="فیلتر وضعیت"
            value={filter}
            onChange={setFilter}
            options={config.filterOptions}
            className="sm:w-44"
          />
        </div>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label={`همه ${config.title}`} value={formatNumber(records?.length ?? 0)} icon={Icon} />
        <StatCard label="مورد فعال در نتایج" value={formatNumber(activeCount)} icon={Building2} tone="success" />
      </div>

      {status === "loading" && <TableSkeleton rows={6} cols={config.columns.length} />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}
      {status === "ready" && records.length === 0 && (
        <EmptyState
          icon={Icon}
          title={`${config.singular}ی یافت نشد`}
          description={search || filter ? "با این جستجو یا فیلتر نتیجه‌ای پیدا نشد." : `اولین ${config.singular} را ثبت کنید.`}
          action={!search && !filter && <Button icon={Plus} onClick={openCreate}>ثبت {config.singular}</Button>}
        />
      )}
      {status === "ready" && records.length > 0 && (
        <DataTable columns={config.columns}>
          {records.map((record) => (
            <Row key={record.id}>
              {config.getCells(record)}
              <Cell>
                <Badge tone={config.statusTone(record)} dot>{config.statusLabel(record)}</Badge>
              </Cell>
              <Cell>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`ویرایش ${record.name}`}
                    title="ویرایش"
                    onClick={() => openEdit(record)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-ink/[0.06] hover:text-accent"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={config.isActive(record) ? "غیرفعال‌کردن" : "فعال‌کردن"}
                    title={config.isActive(record) ? "غیرفعال‌کردن" : "فعال‌کردن"}
                    onClick={() => toggleStatus(record)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-ink/[0.06] hover:text-warning"
                  >
                    <Power size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`حذف ${record.name}`}
                    title="حذف"
                    onClick={() => setDeleting(record)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `ویرایش ${config.singular}` : `ثبت ${config.singular} جدید`}
        subtitle="اطلاعات را وارد کنید و ذخیره را بزنید."
      >
        <form id={`${type}-form`} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {config.fields.map((field) => (
            <Field key={field.name} label={field.label} className={field.name === "name" ? "sm:col-span-2" : ""}>
              {field.type === "select" ? (
                <Select
                  value={form[field.name]}
                  onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
                  options={field.options}
                  required={field.required}
                />
              ) : (
                <Input
                  type={field.type || "text"}
                  value={form[field.name]}
                  onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                  required={field.required}
                  min={field.min}
                  dir={field.dir}
                  inputMode={field.inputMode}
                  className={field.dir === "ltr" ? "text-left" : ""}
                />
              )}
            </Field>
          ))}
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => setFormOpen(false)}>انصراف</Button>
          <Button type="submit" form={`${type}-form`} loading={save.pending}>
            {editing ? "ذخیره تغییرات" : "ثبت"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`حذف ${config.singular}`}
        subtitle={config.deleteDescription}
        size="sm"
      >
        <Card className="mb-5 p-4">
          <p className="text-sm font-bold text-text">{deleting?.name}</p>
        </Card>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>انصراف</Button>
          <Button variant="danger" icon={Trash2} loading={remove.pending} onClick={confirmDelete}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}
