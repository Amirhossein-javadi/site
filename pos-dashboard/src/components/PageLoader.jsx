import { LoaderCircle } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <LoaderCircle size={24} className="animate-spin" />
        <p className="text-xs">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
