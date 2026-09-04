import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        warm: {
          cream: "#FFEDB9",    // Butter Cream
          honey: "#FFCB56",    // Honey Amber
          apricot: "#FFA259",  // Warm Apricot (Primary CTA)
          coral: "#FF7E7E",    // Coral Rose (Love Accent / Expense)
          canvas: "#FFFDF8",   // Soft Warm Canvas
          card: "#FFFFFF",     // Crisp White Card
          border: "#F3ECE2",   // Warm Soft Border
          espresso: "#1C1917", // Deep Warm Espresso (Text)
          muted: "#78716C",    // Warm Muted Gray
          subtle: "#57534E",   // Warm Subtle Gray
        },
        primary: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#FFA259",
          500: "#FFA259", // Celengan Warm Apricot
          600: "#f97316",
          700: "#ea580c",
          800: "#c2410c",
          900: "#7c2d12",
        },
        couple: {
          rose: "#FF7E7E",
          amber: "#FFCB56",
          apricot: "#FFA259",
          cream: "#FFEDB9",
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
};
export default config;
