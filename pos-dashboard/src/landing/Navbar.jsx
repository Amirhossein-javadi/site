import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { BarChart3 } from "lucide-react";

const LINKS = [
  { id: "overview", label: "نمای کلی" },
  { id: "features", label: "قابلیت‌ها" },
  { id: "customizer", label: "ظاهر پنل" },
  { id: "specs", label: "ارقام" },
];

export function goTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -56 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export default function Navbar() {
  const { scrollY } = useScroll();
  const height = useTransform(scrollY, [0, 120], [80, 56]);
  const bg = useTransform(scrollY, [0, 120], ["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]);
  const blur = useTransform(scrollY, [0, 120], ["blur(0px)", "blur(16px)"]);
  const line = useTransform(scrollY, [0, 120], ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]);

  return (
    <motion.header
      style={{ height, backgroundColor: bg, backdropFilter: blur, WebkitBackdropFilter: blur, borderColor: line }}
      className="fixed inset-x-0 top-0 z-50 border-b"
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">
        <a href="#overview" onClick={(e) => { e.preventDefault(); goTo("overview"); }} className="flex items-center gap-2.5 text-sm font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gradient">
            <BarChart3 size={16} className="text-white" />
          </span>
          سیستم جامع POS
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={(e) => { e.preventDefault(); goTo(l.id); }}
              className="text-xs text-ink/60 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <Link to="/login"
          className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition-all hover:ring-4 hover:ring-ink/25 focus-visible:ring-4 focus-visible:ring-ink/25">
          ورود به سیستم
        </Link>
      </div>
    </motion.header>
  );
}
