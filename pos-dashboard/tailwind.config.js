/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        surface2: "rgb(var(--color-surface-2) / <alpha-value>)",
        surface3: "rgb(var(--color-surface-3) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        "border-soft": "rgb(var(--color-border) / 0.12)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        accentDim: "rgb(var(--color-accent-dim) / <alpha-value>)",
        accent2: "rgb(var(--color-accent-2) / <alpha-value>)",
        "accent-soft": "rgb(var(--color-accent) / 0.14)",
        frost: "rgb(var(--color-frost) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        "text-faint": "rgb(var(--color-text-faint) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Vazirmatn", "-apple-system", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #127ebc 0%, #1668d2 100%)",
        "accent-gradient-soft":
          "linear-gradient(135deg, rgba(211,223,230,0.14) 0%, rgba(75,90,108,0.2) 100%)",
        "surface-sheen":
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
      },
      boxShadow: {
        glow: "0 0 50px -12px rgba(180, 200, 214, 0.4)",
        "glow-violet": "0 0 50px -12px rgba(75, 90, 108, 0.55)",
        card: "0 20px 50px -24px rgba(0, 0, 0, 0.65)",
        "card-lg": "0 30px 70px -30px rgba(0, 0, 0, 0.7)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(24px, -28px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-30px, 20px)" },
        },
        fadeUp: {
          from: { opacity: 0, transform: "translateY(14px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        float: "float 14s ease-in-out infinite",
        "float-slow": "float-slow 18s ease-in-out infinite",
        "fade-up": "fadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};
