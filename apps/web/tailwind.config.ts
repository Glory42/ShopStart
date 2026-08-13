import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f5f5f7",
        graphite: "#98989d",
        hairline: "#38383a",
        canvas: "#000000",
        paper: {
          2: "#1c1c1e",
          3: "#2c2c2e",
        },
        accent: {
          DEFAULT: "#0a84ff",
          hover: "#409cff",
          dark: "#0060c2",
        },
        danger: "#ff453a",
        warning: "#ff9f0a",
        success: "#30d158",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          "ui-monospace",
          "Menlo",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
        eyebrow: "0.14em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.6s ease both",
      },
    },
  },
  plugins: [],
} satisfies Config;
