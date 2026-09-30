import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import Lenis from "lenis";
import Navbar from "../landing/Navbar";
import Hero from "../landing/Hero";
import FeatureShowcase from "../landing/FeatureShowcase";
import ColorPicker from "../landing/ColorPicker";
import BentoGrid from "../landing/BentoGrid";
import Footer from "../landing/Footer";

export default function Landing() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1 });
    window.__lenis = lenis;
    let id = requestAnimationFrame(function raf(t) {
      lenis.raf(t);
      id = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-black text-white">
        <Navbar />
        <main>
          <Hero />
          <FeatureShowcase />
          <ColorPicker />
          <BentoGrid />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
