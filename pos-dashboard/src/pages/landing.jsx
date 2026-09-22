import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Users,
  FileSignature,
  BarChart3,
  ScanBarcode,
  ShoppingCart,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Package,
    title: "مدیریت محصولات",
    desc: "کاتالوگ کامل کالاها با قیمت، برند، دسته‌بندی و موجودی قابل فروش در لحظه.",
  },
  {
    icon: ScanBarcode,
    title: "انبار و سریال",
    desc: "رهگیری دقیق موجودی فیزیکی، رزروشده و شماره سریال هر دستگاه در هر انبار.",
  },
  {
    icon: FileSignature,
    title: "قراردادها",
    desc: "ثبت و پایش قراردادهای نمایندگی با سقف دستگاه و تاریخ انقضا.",
  },
  {
    icon: ShoppingCart,
    title: "سفارشات",
    desc: "ثبت سفارش نمایندگان و پیگیری وضعیت از ایجاد تا تسویه، در یک جریان یکپارچه.",
  },
];

const STATS = [
  { icon: Package, value: "+۵,۰۰۰", label: "کالا و محصول مدیریت شده", tone: "text-accent" },
  { icon: Users, value: "+۱۲۰", label: "نماینده و تامین‌کننده فعال", tone: "text-emerald-400" },
  { icon: ShieldCheck, value: "۱۰۰٪", label: "دقت در رزرو و ثبت قراردادها", tone: "text-frost" },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-text">
      {/* هاله‌های نور پس‌زمینه */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-[520px] w-[520px] animate-float rounded-full bg-accent/15 blur-[140px]" />
        <div className="absolute top-1/3 -left-32 h-[420px] w-[420px] animate-float-slow rounded-full bg-accent2/15 blur-[140px]" />
        <div className="absolute bottom-0 right-1/3 h-[360px] w-[360px] animate-float rounded-full bg-frost/10 blur-[140px]" />
      </div>

      {/* هدر */}
      <header className="glass sticky top-0 z-50 border-b border-border-soft">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3 text-lg font-extrabold text-text">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient shadow-lg shadow-accent/30">
              <BarChart3 size={20} className="text-white" />
            </div>
            سیستم جامع POS
          </div>
          <Link
            to="/login"
            className="rounded-xl bg-accent-gradient px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-glow hover:-translate-y-0.5"
          >
            ورود به سیستم
          </Link>
        </div>
      </header>

      {/* بخش اصلی (هیرو) */}
      <section className="relative mx-auto max-w-4xl px-6 py-28 text-center">
        <span className="mb-6 inline-flex items-center rounded-full border border-border-soft bg-surface2/60 px-4 py-1.5 text-xs font-semibold text-text-muted">
          پلتفرم یکپارچه فروش و انبارداری
        </span>
        <h1 className="text-4xl font-extrabold leading-[1.25] tracking-tight md:text-5xl lg:text-6xl">
          فروش و انبار شما، <br />
          <span className="text-gradient">از یک پنل</span> تحت کنترل.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-text-muted md:text-xl">
          با سیستم یکپارچه ما، محصولات را تعریف کنید، موجودی انبار را پایش کنید و
          سفارشات نمایندگان را در کسری از ثانیه مدیریت کنید.
        </p>
        <Link
          to="/login"
          className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-accent-gradient px-8 py-4 text-lg font-bold text-white shadow-xl shadow-accent/30 transition-all hover:-translate-y-1 hover:shadow-glow"
        >
          شروع کار با داشبورد
          <ArrowLeft size={22} />
        </Link>
      </section>

      {/* ویژگی‌ها */}
      <section className="relative mx-auto max-w-6xl px-6 pb-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border-soft bg-surface/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-card"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-gradient-soft text-accent">
                <f.icon size={22} strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-base font-bold text-text">{f.title}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* آمار */}
      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-3xl border border-border-soft bg-surface/70 p-10 text-center backdrop-blur-sm shadow-card"
            >
              <s.icon size={44} className={`mb-6 ${s.tone}`} strokeWidth={1.75} />
              <h3 className={`mb-3 text-3xl font-extrabold ${s.tone}`}>{s.value}</h3>
              <p className="font-semibold text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* فوتر */}
      <footer className="relative border-t border-border-soft py-8 text-center text-sm text-text-faint">
        © {new Date().getFullYear()} سیستم جامع POS — تمامی حقوق محفوظ است.
      </footer>
    </div>
  );
}
