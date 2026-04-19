/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  "#fff7f3",
          100: "#ffedde",
          200: "#ffd6b0",
          300: "#ffb87a",
          400: "#ff8f3f",
          500: "#FF6B35",
          600: "#e84d15",
          700: "#c03a0e",
          800: "#9c3012",
          900: "#7e2b14",
        },
        dark: {
          900: "#0d0d1a",
          800: "#1A1A2E",
          700: "#16213e",
          600: "#0f3460",
          500: "#1e2a4a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
