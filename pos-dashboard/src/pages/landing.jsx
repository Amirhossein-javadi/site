import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  PackageCheck,
  ScanBarcode,
  ShoppingCart,
  Truck,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

const FEATURES = [
  { icon: Boxes, title: "کاتالوگ یکپارچه کالا", body: "محصول، نسخه، برند، کد کالا و قیمت پایه را در یک جا مدیریت کنید." },
  { icon: ScanBarcode, title: "موجودی و سریال", body: "موجودی هر انبار، رزروها و شماره‌سریال دستگاه‌ها را زنده ببینید." },
  { icon: FileText, title: "قرارداد و سفارش", body: "سقف قرارداد را کنترل کنید و سفارش را تا پیش‌فاکتور دنبال کنید." },
  { icon: ClipboardCheck, title: "پیگیری عملیات", body: "وضعیت سفارش‌ها، پرداخت‌ها و هشدارهای مهم از پنل قابل پیگیری‌اند." },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border/20 bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#home" className="flex shrink-0 items-center gap-2.5 text-sm font-extrabold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient text-white shadow-lg shadow-accent/20"><Boxes size={18} /></span>
            <span>سپهر <span className="font-medium text-text-muted">| فروش و انبار</span></span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-xs font-semibold text-text-muted transition hover:text-accent">قابلیت‌ها</a>
            <a href="#workflow" className="text-xs font-semibold text-text-muted transition hover:text-accent">گردش کار</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <ThemeToggle compact />
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2.5 text-xs font-extrabold text-[#05243a] shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:bg-sky-500 sm:px-4">
              <span className="hidden sm:inline">ورود به پنل</span><span className="sm:hidden">ورود</span><ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main id="home">
        <section className="relative px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-[14%] h-[500px] w-[500px] rounded-full bg-accent/10 blur-[140px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-2 text-[11px] font-bold text-accent">
                <ChartNoAxesCombined size={15} />
                سامانه مدیریت فروش و عملیات
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.35] tracking-tight text-text sm:text-5xl xl:text-[58px]">
                از موجودی تا سفارش،<span className="block text-accent">همه‌چیز روشن است.</span>
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-8 text-text-muted sm:text-base">
                کالاها و انبارها را مدیریت کنید، سفارش مشتریان را با قراردادها هماهنگ کنید و مسیر فروش را از یک پنل دنبال کنید.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-extrabold text-[#05243a] shadow-xl shadow-accent/20 transition hover:-translate-y-0.5 hover:bg-sky-500">
                  ورود به سامانه <ArrowLeft size={16} />
                </Link>
                <a href="#features" className="rounded-xl border border-border/25 bg-surface px-5 py-3 text-sm font-bold text-text transition hover:border-accent/40 hover:text-accent">
                  آشنایی با قابلیت‌ها
                </a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-text-muted">
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" />فارسی و راست‌به‌چپ</span>
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" />داده‌ها از سامانه شما</span>
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" />تم روشن و تیره</span>
              </div>
            </div>

            <DashboardPreview />
          </div>
        </section>

        <section id="features" className="border-y border-border/15 bg-surface/45 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-extrabold tracking-wide text-accent">ابزارهای روزانه‌ی شما</p>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">مدیریت فروش در یک نگاه</h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-text-muted">اطلاعات عملیاتی در صفحه‌های مشخص و خوانا کنار هم قرار گرفته‌اند.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, body }, index) => (
                <article key={title} className="rounded-2xl border border-border/20 bg-surface p-5 transition hover:-translate-y-1 hover:border-accent/35 hover:shadow-card">
                  <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-[14px] bg-accent/10 text-accent"><Icon size={20} /></span>
                  <p className="mb-2 text-sm font-extrabold text-text">{title}</p>
                  <p className="text-xs leading-6 text-text-muted">{body}</p>
                  <p className="mt-5 text-[10px] font-bold text-text-faint">۰{index + 1}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 rounded-[26px] border border-accent/20 bg-gradient-to-br from-accent/10 via-surface to-surface p-6 sm:p-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-extrabold text-accent">از ابتدا تا انتها</p>
              <h2 className="text-2xl font-extrabold leading-relaxed sm:text-3xl">گردش کار شفاف،<br />تصمیم‌گیری سریع‌تر</h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-text-muted">مراحل مرتبط به هم وصل‌اند تا تیم شما برای فهمیدن وضعیت سفارش یا کالا بین فایل‌ها جابه‌جا نشود.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <WorkflowStep icon={Boxes} index="۱" title="تعریف کالا" detail="محصول، نسخه و قیمت" />
              <WorkflowStep icon={PackageCheck} index="۲" title="کنترل موجودی" detail="انبار، رزرو و سریال" />
              <WorkflowStep icon={ShoppingCart} index="۳" title="ثبت سفارش" detail="قرارداد و وضعیت سفارش" />
              <WorkflowStep icon={Truck} index="۴" title="تحویل و پرداخت" detail="ارسال، پیش‌فاکتور و پرداخت" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/20 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-text-faint sm:flex-row sm:items-center">
          <span>سپهر · سامانه فروش و انبار</span>
          <span>اطلاعات صفحه‌ی پیش‌نمایش نمونه هستند؛ پنل پس از ورود داده‌های سامانه را نمایش می‌دهد.</span>
        </div>
      </footer>
    </div>
  );
}

function DashboardPreview() {
  const bars = [35, 53, 43, 78, 62, 94, 70, 83, 55, 76, 42, 66];
  const rows = [
    { color: "bg-accent", title: "ثبت سفارش نماینده", subtitle: "همین امروز · در انتظار بررسی", state: "در انتظار" },
    { color: "bg-success", title: "به‌روزرسانی موجودی", subtitle: "امروز · انبار مرکزی", state: "انجام شد" },
    { color: "bg-warning", title: "قرارداد نزدیک به تمدید", subtitle: "این هفته · نماینده فروش", state: "پیگیری" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <div aria-hidden="true" className="absolute -inset-6 rounded-[36px] bg-accent/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[24px] border border-border/25 bg-surface p-3 shadow-[0_36px_100px_-45px_rgba(3,34,63,.55)] sm:rounded-[30px] sm:p-4">
        <div className="flex items-center justify-between border-b border-border/20 px-2 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gradient text-white"><Boxes size={16} /></span>
            <div><p className="text-[11px] font-extrabold text-text">نمای کلی</p><p className="text-[9px] text-text-faint">پیش‌نمایش نمونه</p></div>
          </div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400/70" /><span className="h-2 w-2 rounded-full bg-amber-400/70" /><span className="h-2 w-2 rounded-full bg-emerald-400/70" /></div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 py-3 sm:gap-3">
          <PreviewMetric label="سفارش‌های باز" value="پیگیری" icon={ShoppingCart} />
          <PreviewMetric label="موجودی انبار" value="بررسی" icon={PackageCheck} />
          <PreviewMetric label="قراردادها" value="به‌روز" icon={FileText} />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_0.95fr]">
          <div className="rounded-2xl border border-border/15 bg-bg/55 p-4">
            <div className="mb-5 flex items-center justify-between"><p className="text-[11px] font-bold text-text">فعالیت سفارش‌ها</p><span className="text-[9px] text-text-faint">نمودار نمونه</span></div>
            <div className="flex h-28 items-end gap-1.5 sm:h-36 sm:gap-2">
              {bars.map((height, index) => <div key={index} className={`flex-1 rounded-t-md ${index > 8 ? "bg-accent" : "bg-accent/45"}`} style={{ height: `${height}%` }} />)}
            </div>
            <div className="mt-3 flex justify-between text-[9px] text-text-faint"><span>شنبه</span><span>دوشنبه</span><span>چهارشنبه</span><span>جمعه</span></div>
          </div>

          <div className="rounded-2xl border border-border/15 bg-bg/55 p-4">
            <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-bold text-text">رویدادهای اخیر</p><span className="text-[9px] text-accent">مشاهده همه</span></div>
            <div className="divide-y divide-border/15">
              {rows.map((row) => (
                <div key={row.title} className="flex items-center gap-2.5 py-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${row.color}`} />
                  <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-text">{row.title}</p><p className="mt-0.5 truncate text-[9px] text-text-faint">{row.subtitle}</p></div>
                  <span className="text-[9px] text-text-muted">{row.state}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -right-4 hidden items-center gap-2 rounded-2xl border border-border/20 bg-surface px-4 py-3 shadow-card sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/10 text-success"><ClipboardCheck size={16} /></span>
        <div><p className="text-[10px] font-bold text-text">مدیریت متمرکز</p><p className="text-[9px] text-text-faint">از موجودی تا فروش</p></div>
      </div>
    </div>
  );
}

function PreviewMetric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border/15 bg-bg/50 p-2.5 sm:p-3">
      <div className="flex items-center justify-between gap-1"><p className="truncate text-[9px] text-text-faint sm:text-[10px]">{label}</p><Icon size={14} className="shrink-0 text-accent" /></div>
      <p className="mt-2 text-xs font-extrabold text-text sm:text-sm">{value}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-accent/10"><div className="h-full w-2/3 rounded-full bg-accent" /></div>
    </div>
  );
}

function WorkflowStep({ icon: Icon, index, title, detail }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/15 bg-surface/90 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={18} /></span>
      <div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-text">{title}</p><p className="mt-1 text-[10px] text-text-muted">{detail}</p></div>
      <span className="text-[11px] font-extrabold text-text-faint">{index}</span>
    </div>
  );
}
