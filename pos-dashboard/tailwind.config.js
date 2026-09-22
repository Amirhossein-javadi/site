/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07090f",
        surface: "#12161f",
        surface2: "#171c27",
        surface3: "#1d2331",
        border: "#212637",
        "border-soft": "rgba(231, 233, 238, 0.08)",
        accent: "#8fa8bd",
        accentDim: "#6f8699",
        accent2: "#3d4a5c",
        "accent-soft": "rgba(143, 168, 189, 0.14)",
        frost: "#c9d6de",
        text: "#eef0f5",
        "text-muted": "#8b93a7",
        "text-faint": "#5b6272",
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
        "accent-gradient": "linear-gradient(135deg, #d3dfe6 0%, #4b5a6c 100%)",
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
