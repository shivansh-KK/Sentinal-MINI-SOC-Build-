/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg: "#070a13",
          surface: "rgba(13, 20, 36, 0.72)",
          card: "rgba(15, 23, 42, 0.65)",
          border: "rgba(255, 255, 255, 0.08)",
          borderGlow: "rgba(0, 240, 255, 0.25)",
          cyan: "#00f0ff",
          cyanMuted: "#38bdf8",
          blue: "#3b82f6",
          blueDeep: "#1d4ed8",
          emerald: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444",
          purple: "#a855f7"
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glass-glow': '0 0 25px rgba(0, 240, 255, 0.15)',
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.4)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.4)',
        'inner-light': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '16px',
        'glass-heavy': '24px',
      }
    },
  },
  plugins: [],
}
