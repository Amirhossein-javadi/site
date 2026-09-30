import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardMock } from "./Hero";

const COLORS = [
  { id: "space", name: "خاکستری فضایی", hex: "#8b93a7", note: "آرام و بی‌حاشیه برای کار روزانه انبار." },
  { id: "silver", name: "نقره‌ای", hex: "#d3dfe6", note: "روشن و شفاف؛ ارقام حتی در نور زیاد خوانا می‌مانند." },
  { id: "midnight", name: "نیمه‌شب", hex: "#4f7cff", note: "تاکید قوی روی اعداد و وضعیت‌ها." },
  { id: "purple", name: "بنفش عمیق", hex: "#8b5cf6", note: "هویت بصری متمایز برای برند شما." },
];

export default function ColorPicker() {
  const [active, setActive] = useState(COLORS[0]);
  return (
    <section id="customizer" className="px-5 py-28 sm:py-40">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="bg-gradient-to-b from-white to-white/50 bg-clip-text pb-1 text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl">پنل، با رنگ شما.</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/60 sm:text-lg">رنگ تاکیدی را انتخاب کنید و پیش‌نمایش را ببینید.</p>

        <div className="relative mt-14">
          <AnimatePresence>
            <motion.div key={active.id} aria-hidden className="pointer-events-none absolute -inset-10 rounded-full blur-[110px]"
              initial={{ opacity: 0 }} animate={{ opacity: 0.28 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}
              style={{ background: active.hex }} />
          </AnimatePresence>
          <motion.div layout className="relative rounded-[28px] bg-[#161617] p-2 ring-1 ring-white/10 sm:p-3">
            <DashboardMock accent={active.hex} />
          </motion.div>
        </div>

        <div role="radiogroup" aria-label="رنگ تاکیدی" className="mt-10 flex items-center justify-center gap-4">
          {COLORS.map((c) => {
            const on = c.id === active.id;
            return (
              <button key={c.id} role="radio" aria-checked={on} aria-label={c.name} onClick={() => setActive(c)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full">
                {on && <motion.span layoutId="swatch-ring" className="absolute inset-0 rounded-full ring-2 ring-white" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                <span className="h-7 w-7 rounded-full" style={{ background: c.hex }} />
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-6 min-h-[84px] max-w-md">
          <AnimatePresence mode="wait">
            <motion.div key={active.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <p className="text-lg font-bold text-white">{active.name}</p>
              <p dir="ltr" className="mt-1 font-mono text-xs text-white/40">{active.hex}</p>
              <p className="mt-2 text-sm leading-7 text-white/60">{active.note}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
