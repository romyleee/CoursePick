/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cream / oatmeal palette
        cream: "#FAF7F2",
        paper: "#FFFFFF",

        // Navy ink scale
        ink: "#1A2B4A",       // deep navy (본문)
        "ink-2": "#3D4A65",   // medium navy
        "ink-3": "#5C6B85",   // soft navy gray (보조)

        // Lines
        line: "#E8E2D8",
        "line-2": "#D8D1C5",

        // Accent (살짝만)
        terracotta: "#E8704F",
        "terracotta-2": "#D55E3D",
        "terracotta-soft": "#FBEDE5",

        // Aliases
        primary: "#E8704F",
        bg: "#FAF7F2",
        accent: "#1A2B4A",
      },
      fontFamily: {
        sans: ["'Pretendard Variable'", "Pretendard", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "20px",
      },
      boxShadow: {
        none: "none",
      },
    },
  },
  plugins: [],
};
