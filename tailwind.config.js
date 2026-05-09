import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        app: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          card: "var(--bg-card)",
          input: "var(--bg-input)",
          sidebar: "var(--bg-sidebar)",
          accent: "var(--accent-color)",
          accentHover: "var(--accent-hover)",
          border: "var(--border-color)",
          borderInput: "var(--border-input)",
          text: "var(--text-primary)",
          textSecondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          dim: "var(--text-dim)",
        },
      },
      boxShadow: {
        app: "0 18px 48px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [animate, typography],
};
