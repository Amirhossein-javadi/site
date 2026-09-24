import { CreditCard } from "lucide-react";
import { EmptyState, PageHeader } from "../components/ui";

export default function Payments() {
  return (
    <>
      <PageHeader title="پرداخت‌ها" subtitle="وضعیت تراکنش‌ها و عملیات تأیید پرداخت" />
      <EmptyState icon={CreditCard} title="در حال آماده‌سازی داده‌ها" description="اتصال عملیاتی پرداخت‌ها در مرحله بعد تکمیل می‌شود." />
    </>
  );
}
