import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic
        primary: { DEFAULT: "#14a87a", dark: "#0a8963", light: "#34c896" },
        surface: "#1c1c22",
        "surface-raised": "#222229",
        base: "#151519",
        "text-primary": "#c0c0c8",
        "text-secondary": "#6b6b7b",
        border: "rgba(255,255,255,0.06)",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)",
        elevated: "0 4px 12px rgba(0, 0, 0, 0.25)",
        modal: "0 8px 30px rgba(0, 0, 0, 0.4)",
      },
      fontFamily: {
        heading: ["var(--font-secular-one)", "sans-serif"],
        body: ["var(--font-heebo)", "sans-serif"],
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
