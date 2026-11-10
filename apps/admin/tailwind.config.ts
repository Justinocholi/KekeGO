import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kekego: {
          amber: {
            DEFAULT: "#F59E0B",
            hover: "#D97706",
            active: "#B45309",
            subtle: "#FEF3C7",
          },
          emerald: {
            DEFAULT: "#0F766E",
            hover: "#115E59",
            active: "#134E4A",
            subtle: "#CCFBF1",
          },
          dark: {
            canvas: "#090D16",
            card: "#131B2E",
            border: "#1E293B",
          },
          light: {
            canvas: "#F8FAFC",
            card: "#FFFFFF",
            border: "#E2E8F0",
            muted: "#64748B",
          },
          status: {
            success: "#10B981",
            warning: "#F97316",
            error: "#EF4444",
            info: "#0284C7",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
