import { Receipt } from "lucide-react";
import { EmptyState, PageHeader } from "../components/ui";

export default function Proformas() {
  return (
    <>
      <PageHeader title="پیش‌فاکتورها" subtitle="صدور و پیگیری پیش‌فاکتورهای سفارش‌ها" />
      <EmptyState icon={Receipt} title="در حال آماده‌سازی داده‌ها" description="اتصال عملیاتی پیش‌فاکتورها در مرحله بعد تکمیل می‌شود." />
    </>
  );
}
