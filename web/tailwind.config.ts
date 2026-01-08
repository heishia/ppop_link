import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xxs: "320px",
        xs: "475px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#3a63ed",
        secondary: "rgba(0, 0, 0, 0.04)",
        tertiary: "rgba(0, 0, 0, 0.12)",
      },
      fontFamily: {
        "cafe-surround": ["Cafe24 Ssurround", "sans-serif"],
        "iseoyun": ["Iseoyun", "var(--font-iseoyun)", "sans-serif"],
        sans: ["Iseoyun", "var(--font-iseoyun)", "sans-serif"],
        heading: ["Cafe24 Ssurround", "sans-serif"],
      },
      fontSize: {
        "username": ["22px", { lineHeight: "28.6px", fontWeight: "800" }],
        "bio": ["17px", { lineHeight: "22.95px", fontWeight: "400" }],
        "button": ["17px", { lineHeight: "22.95px", fontWeight: "800" }],
        "chip": ["13px", { lineHeight: "17.42px", fontWeight: "700" }],
      },
      borderRadius: {
        "button": "56px",
        "chip": "16px",
      },
      spacing: {
        "button-section": "82px",
      },
      animation: {
        "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

