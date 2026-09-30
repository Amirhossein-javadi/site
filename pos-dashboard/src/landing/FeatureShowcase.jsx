import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

const STEPS = [
  { title: "موجودی، لحظه‌ای و دقیق", body: "موجودی فیزیکی، رزروشده و قابل فروش هر کالا در هر انبار، همیشه به‌روز و بدون جمع‌زدن دستی." },
  { title: "قرارداد و رزرو بی‌خطا", body: "سقف دستگاه و تاریخ انقضای هر قرارداد کنترل می‌شود و رزرو نامعتبر ثبت نمی‌شود." },
  { title: "یک مسیر، از سفارش تا تسویه", body: "سفارش، پیش‌فاکتور، پرداخت و اعتبار نمایندگان در یک جریان یکپارچه به هم وصل‌اند." },
];

const Panel = ({ children }) => <div className="flex h-full flex-col justify-center gap-3 p-6 sm:p-8">{children}</div>;

function StockVisual() {
  const rows = [["فیزیکی", 92], ["رزروشده", 34], ["قابل فروش", 58]];
  return (
    <Panel>
      {rows.map(([l, v], i) => (
        <div key={l}>
          <div className="mb-1.5 flex justify-between text-xs text-white/60"><span>{l}</span><span>{v.toLocaleString("fa-IR")}٪</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full origin-right rounded-full bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: v / 100 }} transition={{ delay: 0.1 * i, duration: 0.9, ease: [0.16, 1, 0.3, 1] }} style={{ width: "100%" }} />
          </div>
        </div>
      ))}
    </Panel>
  );
}

function ContractVisual() {
  return (
    <Panel>
      <div className="mx-auto flex flex-col items-center">
        <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
          <motion.circle cx="60" cy="60" r="50" fill="none" stroke="#8fa8bd" strokeWidth="9" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 0.72 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
        </svg>
        <p className="-mt-24 mb-14 text-2xl font-extrabold text-white">۷۲٪</p>
        <p className="text-xs text-white/50">مصرف سقف دستگاه قرارداد</p>
      </div>
    </Panel>
  );
}

function FlowVisual() {
  const nodes = ["سفارش", "پیش‌فاکتور", "پرداخت", "اعتبار"];
  return (
    <Panel>
      {nodes.map((n, i) => (
        <motion.div key={n} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 * i, duration: 0.6 }}
          className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white">
          <span className="h-2 w-2 rounded-full bg-accent" />{n}
        </motion.div>
      ))}
    </Panel>
  );
}

const VISUALS = [StockVisual, ContractVisual, FlowVisual];

export default function FeatureShowcase() {
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setIdx(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length))));
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const Visual = VISUALS[idx];

  return (
    <section id="features" ref={ref} className="relative h-[320vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-5">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 pt-14 lg:grid-cols-2 lg:gap-16">
          <div className="relative min-h-[190px] lg:min-h-[260px]">
            <AnimatePresence mode="wait">
              <motion.div key={idx} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                <h2 className="bg-gradient-to-b from-white to-white/50 bg-clip-text pb-1 text-3xl font-extrabold leading-tight text-transparent sm:text-5xl">{STEPS[idx].title}</h2>
                <p className="mt-5 max-w-md text-base leading-8 text-white/60 sm:text-lg">{STEPS[idx].body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full origin-right rounded-full bg-white" style={{ scaleX: fill, width: "100%" }} />
            </div>
          </div>

          <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-[#161617] ring-1 ring-white/10">
            <AnimatePresence mode="wait">
              <motion.div key={idx} className="h-full" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.35 }}>
                <Visual />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
