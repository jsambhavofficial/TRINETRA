/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#06080E",
          900: "#0A0D14",
          850: "#0E131E",
          800: "#131A29",
          700: "#1B2438",
          600: "#27344F",
        },
        surface: {
          base: "#0A0D14",
          panel: "#101624",
          elevated: "#161E30",
          card: "#1B2438",
          border: "rgba(255, 255, 255, 0.08)",
          borderHover: "rgba(255, 255, 255, 0.18)",
        },
        epistemic: {
          observed: "#06B6D4",
          inferred: "#F97316",
          predicted: "#EC4899",
          simulated: "#8B5CF6",
        },
        status: {
          nominal: "#10B981",
          warning: "#F59E0B",
          critical: "#EF4444",
          info: "#3B82F6",
          muted: "#64748B",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.4 },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        }
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "radar-sweep 4s linear infinite",
      }
    },
  },
  plugins: [],
};
