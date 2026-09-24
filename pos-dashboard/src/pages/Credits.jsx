import { Wallet } from "lucide-react";
import { EmptyState, PageHeader } from "../components/ui";

export default function Credits() {
  return (
    <>
      <PageHeader title="اعتبارات و دفتر مالی" subtitle="مانده قراردادها و گردش‌های مالی ثبت‌شده" />
      <EmptyState icon={Wallet} title="در حال آماده‌سازی داده‌ها" description="اتصال عملیاتی دفتر مالی در مرحله بعد تکمیل می‌شود." />
    </>
  );
}
