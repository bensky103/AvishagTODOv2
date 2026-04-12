import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand — warm teal
        brand: {
          50: "#effcf6",
          100: "#d0f7e6",
          200: "#a4edd0",
          300: "#6adeb5",
          400: "#34c896",
          500: "#14a87a",
          600: "#0a8963",
          700: "#096e52",
          800: "#0b5743",
          900: "#0b4838",
          950: "#032820",
        },
        // Ocean blues — keep for accent
        ocean: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // Warm accent
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Semantic
        primary: { DEFAULT: "#14a87a", dark: "#0a8963", light: "#34c896" },
        surface: "#ffffff",
        base: "#f7f8fa",
        "text-primary": "#1a1d23",
        "text-secondary": "#5f6980",
        border: "#e5e7eb",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        // Sidebar
        sidebar: {
          bg: "#1a1d23",
          hover: "#252830",
          active: "#2d3139",
          text: "#9ca3af",
          "text-active": "#ffffff",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
        elevated: "0 4px 12px rgba(0, 0, 0, 0.08)",
        modal: "0 8px 30px rgba(0, 0, 0, 0.12)",
        pill: "0 2px 8px rgba(20, 168, 122, 0.25)",
        glow: "0 0 20px rgba(20, 168, 122, 0.15)",
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
      fontFamily: {
        heading: ["var(--font-secular-one)", "sans-serif"],
        body: ["var(--font-heebo)", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        pill: "20px",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #14a87a 0%, #0a8963 100%)",
        "gradient-ocean": "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        "gradient-warm": "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        "gradient-danger": "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        "gradient-sidebar": "linear-gradient(180deg, #1a1d23 0%, #111318 100%)",
        "gradient-page": "linear-gradient(135deg, #f7f8fa 0%, #eef0f4 100%)",
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in-from-bottom 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "count-up": "count-up 0.6s ease-out",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "count-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
