import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { Languages, ServerCog } from "lucide-react";

function Counter({ to, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 2, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref}>{prefix}{n.toLocaleString("fa-IR")}{suffix}</span>;
}

// کارت با هاله‌ی نوری که دنبال مکان‌نما می‌آید
function GlowCard({ className = "", children }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div onMouseMove={onMove} className={`group relative overflow-hidden rounded-3xl bg-[#161617] p-7 ring-1 ring-white/10 sm:p-9 ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(360px circle at var(--mx,50%) var(--my,50%), rgba(143,168,189,0.18), transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 ring-1 ring-accent/60 transition-opacity duration-300 group-hover:opacity-100"
        style={{ WebkitMask: "radial-gradient(220px circle at var(--mx,50%) var(--my,50%), #000, transparent)", mask: "radial-gradient(220px circle at var(--mx,50%) var(--my,50%), #000, transparent)" }} />
      <div className="relative">{children}</div>
    </div>
  );
}

const Big = ({ children }) => (
  <p className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl">{children}</p>
);

export default function BentoGrid() {
  return (
    <section id="specs" className="px-5 pb-28 sm:pb-40">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-4xl font-extrabold tracking-tight text-white sm:text-6xl">ارقامی که مهم‌اند.</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <GlowCard className="md:col-span-2 md:row-span-2">
            <Big><Counter to={5000} prefix="+" /></Big>
            <p className="mt-4 text-lg text-white/60">کالا و محصول مدیریت‌شده با قیمت، برند و موجودی لحظه‌ای.</p>
          </GlowCard>
          <GlowCard>
            <Big><Counter to={120} prefix="+" /></Big>
            <p className="mt-3 text-white/60">نماینده و تامین‌کننده فعال.</p>
          </GlowCard>
          <GlowCard>
            <Big><Counter to={100} suffix="٪" /></Big>
            <p className="mt-3 text-white/60">دقت در رزرو و ثبت قراردادها.</p>
          </GlowCard>
          <GlowCard className="md:col-span-2">
            <ServerCog className="mb-4 text-accent" size={28} />
            <p className="text-xl font-bold text-white">منطق کسب‌وکار در بک‌اند</p>
            <p className="mt-2 max-w-md text-white/60">محاسبه موجودی قابل فروش، اعتبارسنجی رزرو و قیمت‌گذاری سمت سرور انجام می‌شود و پنل فقط نمایش می‌دهد.</p>
          </GlowCard>
          <GlowCard>
            <Languages className="mb-4 text-accent" size={28} />
            <p className="text-xl font-bold text-white">فارسی و راست‌به‌چپ</p>
            <p className="mt-2 text-white/60">از اعداد تا تاریخ، همه‌چیز فارسی.</p>
          </GlowCard>
        </div>
      </div>
    </section>
  );
}
