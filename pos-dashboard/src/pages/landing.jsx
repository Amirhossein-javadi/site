import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpLeft,
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

const MODULES = [
  { icon: Boxes, number: "01", title: "کاتالوگ کالا", body: "محصول‌ها، نسخه‌ها، قیمت‌ها و کدهای کالا را یک‌جا مدیریت کنید." },
  { icon: ScanBarcode, number: "02", title: "انبار و سریال", body: "موجودی هر انبار، رزروها و سریال تک‌تک دستگاه‌ها را ببینید." },
  { icon: FileText, number: "03", title: "PSP و قرارداد", body: "مشتری‌های PSP، سقف خرید و اعتبار قراردادها را دنبال کنید." },
  { icon: ShoppingCart, number: "04", title: "سفارش و مالی", body: "سفارش، پیش‌فاکتور، پرداخت و گزارش مالی به هم متصل‌اند." },
];

const FLOW = [
  [Boxes, "تعریف دستگاه", "مدل و نسخه کارتخوان"],
  [PackageCheck, "ورود به انبار", "موجودی و سریال"],
  [FileText, "تخصیص قرارداد", "سقف خرید PSP"],
  [Truck, "ارسال سفارش", "رهگیری تا تحویل"],
];

export default function Landing() {
  return (
    <div dir="rtl" className="min-h-screen overflow-hidden bg-bg text-text">
      <header className="border-b border-border/50 bg-bg">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8">
          <a href="#home" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-white">
              <Boxes size={19} />
            </span>
            <span>
              <span className="block text-sm font-extrabold">سپهر</span>
              <span className="block text-[10px] tracking-wide text-text-faint">فروش و عملیات</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#modules" className="text-xs font-semibold text-text-muted transition hover:text-text">امکانات</a>
            <a href="#flow" className="text-xs font-semibold text-text-muted transition hover:text-text">گردش کار</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle compact />
            <Link to="/login" className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-extrabold text-bg transition hover:bg-accentDim">
              ورود به پنل <ArrowLeft size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main id="home">
        <section className="px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-navy/50 bg-navy/30 px-3 py-2 text-[10px] font-bold tracking-[0.1em] text-frost">
                <ChartNoAxesCombined size={15} />
                SEPEHR · OPERATIONS
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.35] tracking-tight text-text sm:text-5xl xl:text-6xl">
                فروش و انبار،<br />
                <span className="text-frost">یک تصویر روشن.</span>
              </h1>
              <p className="mt-6 max-w-lg text-sm leading-8 text-text-muted sm:text-base">
                سامانه‌ی مدیریت پایانه‌های فروش؛ از ثبت مدل و سریال دستگاه تا قرارداد PSP، سفارش و تحویل.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/login" className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-extrabold text-bg transition hover:bg-accentDim">
                  ورود به مرکز عملیات <ArrowLeft size={16} />
                </Link>
                <a href="#modules" className="inline-flex h-12 items-center gap-2 rounded-lg border border-border/60 bg-surface px-5 text-sm font-bold text-text transition hover:border-frost/50 hover:bg-surface2">
                  مشاهده امکانات <ArrowUpLeft size={16} />
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-border/50 pt-5 text-[11px] font-semibold text-text-muted">
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-frost" />کنترل سریال دستگاه</span>
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-frost" />سقف قرارداد PSP</span>
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-frost" />چند انبار و شعبه</span>
              </div>
            </div>

            <OperationsPreview />
          </div>
        </section>

        <section id="modules" className="border-y border-border/50 bg-surface px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-9 grid gap-4 md:grid-cols-[1fr_0.7fr] md:items-end">
              <div>
                <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-frost">یک سامانه، چهار بخش اصلی</p>
                <h2 className="text-2xl font-extrabold sm:text-3xl">از ورود کالا تا گزارش نهایی</h2>
              </div>
              <p className="max-w-lg text-sm leading-7 text-text-muted">هر بخش برای یک کار روزانه طراحی شده؛ داده‌ها بین انبار، فروش و مالی پیوسته می‌مانند.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {MODULES.map(({ icon: Icon, number, title, body }) => (
                <article key={number} className="group border border-border/55 bg-bg p-5 transition-colors hover:border-frost/50 hover:bg-navy/10 sm:p-6">
                  <div className="mb-8 flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-white"><Icon size={19} /></span>
                    <span className="font-mono text-[11px] text-text-faint">{number}</span>
                  </div>
                  <h3 className="text-sm font-extrabold">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-text-muted">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="flow" className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-[1440px] gap-10 border border-border/55 bg-surface p-6 sm:p-9 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-frost">گردش کار یکپارچه</p>
              <h2 className="text-2xl font-extrabold leading-relaxed sm:text-3xl">موجودی دقیق.<br />قرارداد شفاف.</h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-text-muted">سفارش از موجودی قابل فروش کم می‌شود و هر جابه‌جایی در سوابق انبار ثبت می‌ماند.</p>
            </div>
            <div className="grid gap-px border border-border/50 bg-border/50 sm:grid-cols-2">
              {FLOW.map(([Icon, title, detail], index) => (
                <div key={title} className="flex min-h-[104px] items-center gap-3 bg-surface p-4 sm:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white"><Icon size={18} /></span>
                  <div className="min-w-0 flex-1"><p className="text-xs font-extrabold">{title}</p><p className="mt-1 text-[10px] text-text-muted">{detail}</p></div>
                  <span className="font-mono text-[10px] text-text-faint">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-surface px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-3 text-[11px] text-text-faint sm:flex-row sm:items-center">
          <span>سپهر · سامانه فروش و انبار</span>
          <span>پیش‌نمایش معرفی سامانه</span>
        </div>
      </footer>
    </div>
  );
}

function OperationsPreview() {
  const bars = [35, 52, 44, 73, 58, 90, 64, 82, 57, 75, 43, 69];
  const products = [
    ["PAX A920 Pro", "۴G · تهران", "۲۲۰"],
    ["PAX D210", "۴G · شیراز", "۳۰"],
    ["PAX A930", "۴G · تهران", "۲۲۰"],
  ];

  return (
    <div className="relative mx-auto w-full max-w-[720px]">
      <div className="absolute -right-8 -top-8 h-40 w-40 bg-navy/35 blur-3xl" />
      <div className="relative overflow-hidden border border-border/60 bg-[#090c12] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#101a2d]"><Boxes size={17} /></span>
            <div><p className="text-xs font-extrabold text-white">مرکز عملیات</p><p className="mt-0.5 text-[9px] text-white/45">پیش‌نمایش مدیریتی</p></div>
          </div>
          <span className="rounded-md border border-white/10 bg-[#14213d] px-2.5 py-1.5 text-[9px] font-bold tracking-wide text-white/80">SAMPLE DATA</span>
        </div>

        <div className="grid grid-cols-3 gap-px border-b border-white/10 bg-white/10">
          <PreviewStat label="دستگاه در انبار" value="۱٬۷۵۰" />
          <PreviewStat label="PSP فعال" value="۸" />
          <PreviewStat label="مدل PAX" value="۷" />
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[1.1fr_0.9fr] sm:p-5">
          <div className="border border-white/10 bg-[#0e131c] p-4">
            <div className="mb-5 flex items-center justify-between"><p className="text-[11px] font-bold text-white">موجودی PAX</p><span className="text-[9px] text-white/45">تهران / شیراز</span></div>
            <div className="flex h-32 items-end gap-2 border-b border-white/10 px-1">
              {bars.map((height, index) => <div key={index} className={`flex-1 ${index > 8 ? "bg-frost" : "bg-[#263b60]"}`} style={{ height: `${height}%` }} />)}
            </div>
            <div className="mt-3 flex justify-between text-[9px] text-white/40"><span>A920</span><span>A910</span><span>A930</span><span>D210</span><span>S90</span></div>
          </div>

          <div className="border border-white/10 bg-[#0e131c] p-4">
            <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-bold text-white">مدل‌های پرفروش</p><PackageCheck size={15} className="text-frost" /></div>
            <div className="divide-y divide-white/10">
              {products.map(([name, detail, count]) => (
                <div key={name} className="flex items-center gap-2.5 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#17294a] text-white"><ScanBarcode size={13} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-white">{name}</p><p className="mt-0.5 text-[9px] text-white/45">{detail}</p></div>
                  <span className="text-[10px] font-extrabold text-white/80">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 bg-[#101a2d] px-5 py-3 text-[9px] text-white/60">
          <span className="inline-flex items-center gap-2"><ClipboardCheck size={13} /> موجودی و سریال قابل رهگیری</span>
          <span>پیش‌نمایش</span>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ label, value }) {
  return (
    <div className="bg-[#0c1017] px-4 py-4 sm:px-5">
      <p className="text-[9px] font-medium text-white/45">{label}</p>
      <p className="mt-2 text-lg font-extrabold tracking-tight text-white sm:text-xl">{value}</p>
    </div>
  );
}
