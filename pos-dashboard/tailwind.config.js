/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e16",
        surface: "#12161f",
        surface2: "#171c27",
        border: "#212637",
        accent: "#3b82f6",
        accentDim: "#2f6fed",
        "accent-soft": "rgba(59, 130, 246, 0.14)",
        text: "#e7e9ee",
        "text-muted": "#8b93a7",
        "text-faint": "#5b6272",
      },
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
