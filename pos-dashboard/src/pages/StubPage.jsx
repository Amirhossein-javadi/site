import { PageHeader, EmptyState } from "../components/ui";

export default function StubPage({ title, icon }) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        icon={icon}
        title="این بخش هنوز به بک‌اند وصل نشده"
        description="پس از تکمیل API مربوطه در جنگو، این صفحه با داده واقعی پر می‌شود."
      />
    </div>
  );
}
