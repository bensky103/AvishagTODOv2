import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        primary: { DEFAULT: "#0ea5e9", dark: "#0284c7", light: "#38bdf8" },
        surface: "#ffffff",
        base: "#f8fafc",
        "text-primary": "#0f172a",
        "text-secondary": "#64748b",
        border: "#e2e8f0",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06)",
        elevated: "0 4px 12px rgba(15, 23, 42, 0.1)",
        modal: "0 8px 30px rgba(15, 23, 42, 0.15)",
        pill: "0 2px 8px rgba(14, 165, 233, 0.3)",
      },
      fontFamily: {
        heading: ["var(--font-secular-one)", "sans-serif"],
        body: ["var(--font-heebo)", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        pill: "20px",
      },
    },
  },
  plugins: [],
};
export default config;
