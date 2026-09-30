import { Link } from "react-router-dom";
import { goTo } from "./Navbar";

const COLS = [
  { title: "سامانه", items: [["features", "قابلیت‌ها"], ["customizer", "ظاهر پنل"], ["specs", "ارقام"]] },
];

export default function Footer() {
  const year = new Date().toLocaleDateString("fa-IR", { year: "numeric" });
  return (
    <footer className="border-t border-white/10 px-5 py-14 text-xs text-neutral-500">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[2fr_1fr_1fr]">
        <p className="max-w-xs leading-7">سیستم جامع POS؛ مدیریت محصول، انبار، قرارداد و سفارش نمایندگان در یک پنل.</p>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="mb-3 font-semibold text-neutral-300">{c.title}</p>
            <ul className="space-y-2">
              {c.items.map(([id, label]) => (
                <li key={id}><a href={`#${id}`} onClick={(e) => { e.preventDefault(); goTo(id); }} className="hover:text-neutral-200">{label}</a></li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="mb-3 font-semibold text-neutral-300">دسترسی</p>
          <Link to="/login" className="hover:text-neutral-200">ورود به سیستم</Link>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-white/5 pt-6 leading-6">
        <p>© {year} سیستم جامع POS. همه حقوق محفوظ است.</p>
        <p className="mt-1">داده‌ها و تصاویر پیش‌نمایش صرفاً نمایشی‌اند و اطلاعات واقعی سازمان را نشان نمی‌دهند.</p>
      </div>
    </footer>
  );
}
