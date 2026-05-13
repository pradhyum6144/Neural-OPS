import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "nos-bg": "var(--nos-bg)",
        "nos-surface": "var(--nos-surface)",
        "nos-surface-2": "var(--nos-surface-2)",
        "nos-border": "var(--nos-border)",
        "nos-accent": "var(--nos-accent)",
        "nos-accent-muted": "var(--nos-accent-muted)",
        "nos-text": "var(--nos-text)",
        "nos-text-muted": "var(--nos-text-muted)",
        "nos-text-dim": "var(--nos-text-dim)",
        "nos-green": "var(--nos-green)",
        "nos-amber": "var(--nos-amber)",
        "nos-red": "var(--nos-red)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "nos-glow": "0 0 20px rgba(99, 102, 241, 0.15)",
        "nos-glow-lg": "0 0 40px rgba(99, 102, 241, 0.25)",
        "nos-inset": "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
