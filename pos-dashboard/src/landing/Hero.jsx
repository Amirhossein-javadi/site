import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Play, X } from "lucide-react";

// آدرس ویدیوی معرفی؛ خالی باشد پیام «به‌زودی» نمایش داده می‌شود.
const FILM_SRC = "";

export function DashboardMock({ accent = "#8fa8bd" }) {
  const bars = [40, 64, 52, 78, 60, 92, 70];
  const stats = [["موجودی قابل فروش", "۱,۲۴۰"], ["رزرو شده", "۱۸۶"], ["قرارداد فعال", "۴۲"]];
  const rows = [["V72P-20418", "انبار مرکزی", "آزاد"], ["V72-11093", "نماینده ۱۴", "تحویل شده"], ["V72P-20419", "انبار مرکزی", "رزرو"], ["V72-11094", "انبار مرکزی", "آزاد"]];
  return (
    <div dir="rtl" className="flex aspect-[16/11] w-full overflow-hidden rounded-2xl bg-[#0b0b0c] text-[10px] text-ink/60 sm:aspect-[16/10] sm:text-xs">
      <aside className="hidden w-14 shrink-0 flex-col items-center gap-3 border-e border-ink/5 py-4 sm:flex">
        <span className="h-6 w-6 rounded-md" style={{ background: accent }} />
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-1.5 w-6 rounded-full bg-ink/10" />)}
      </aside>
      <div className="flex-1 space-y-3 p-3 sm:p-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map(([l, v]) => (
            <div key={l} className="rounded-xl bg-[#161617] p-2.5 sm:p-3">
              <p className="truncate">{l}</p>
              <p className="mt-1 text-base font-bold text-white transition-colors duration-500 sm:text-xl" style={{ color: accent }}>{v}</p>
            </div>
          ))}
        </div>
        <div className="flex h-16 items-end gap-1.5 rounded-xl bg-[#161617] p-3 sm:h-24">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm transition-colors duration-500" style={{ height: `${h}%`, background: accent, opacity: 0.35 + i * 0.09 }} />
          ))}
        </div>
        <div className="divide-y divide-ink/5 rounded-xl bg-[#161617]">
          {rows.map(([a, b, c]) => (
            <div key={a} className="flex items-center justify-between px-3 py-1.5 sm:py-2">
              <span dir="ltr" className="font-mono text-ink/80">{a}</span>
              <span className="hidden sm:inline">{b}</span>
              <span className="rounded-full bg-ink/5 px-2 py-0.5">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilmModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label="ویدیوی معرفی"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
          <motion.div initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-3xl bg-[#161617] ring-1 ring-ink/10">
            <button onClick={onClose} aria-label="بستن" className="absolute end-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black">
              <X size={18} />
            </button>
            {FILM_SRC ? (
              <video src={FILM_SRC} controls autoPlay className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink/50">ویدیوی معرفی به‌زودی اضافه می‌شود.</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Hero() {
  const [film, setFilm] = useState(false);
  const stageRef = useRef(null);

  // بزرگ‌شدن تدریجی کارت با اسکرول: ۰٫۸ ← ۱
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [28, 0]);

  // تیلت سه‌بعدی با ماوس
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 18 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <section id="overview" className="relative px-5 pt-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(143,168,189,0.22),transparent_65%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-b from-white to-white/40 bg-clip-text pb-2 text-5xl font-extrabold leading-[1.2] tracking-tight text-transparent sm:text-6xl lg:text-7xl">
          فروش و انبار شما،<br />از یک پنل تحت کنترل.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.9 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-8 text-ink/60 sm:text-xl">
          محصولات را تعریف کنید، موجودی و سریال دستگاه‌ها را پایش کنید و سفارش نمایندگان را در کسری از ثانیه مدیریت کنید.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.9 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-black transition-all hover:ring-4 hover:ring-ink/25">
            ورود به سیستم <ArrowLeft size={16} />
          </Link>
          <button onClick={() => setFilm(true)} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-ink/80 ring-1 ring-ink/20 transition-colors hover:bg-ink/10 hover:text-white">
            <Play size={14} fill="currentColor" /> تماشای معرفی
          </button>
        </motion.div>
      </div>

      <div ref={stageRef} className="relative mx-auto mt-16 max-w-5xl pb-24 [perspective:1400px] sm:mt-24">
        <motion.div style={{ scale, y: lift }} onMouseMove={onMove} onMouseLeave={onLeave}>
          <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="rounded-[28px] bg-[#161617] p-2 shadow-[0_60px_120px_-30px_rgba(143,168,189,0.35)] ring-1 ring-ink/10 sm:p-3">
            <DashboardMock />
          </motion.div>
        </motion.div>
      </div>

      <FilmModal open={film} onClose={() => setFilm(false)} />
    </section>
  );
}
