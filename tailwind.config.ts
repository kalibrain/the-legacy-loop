import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f6fb",
          100: "#dce6f3",
          200: "#b8cde5",
          300: "#93b3d6",
          400: "#5f88b8",
          500: "#2f5f90",
          600: "#00274c",
          700: "#00203f",
          800: "#001933",
          900: "#001428",
        },
        maize: {
          50: "#fffced",
          100: "#fff6cc",
          200: "#ffec99",
          300: "#ffe066",
          400: "#ffd233",
          500: "#ffcb05",
          600: "#d4a300",
          700: "#9f7900",
          800: "#6b5200",
          900: "#3a2c00",
        },
      },
      fontFamily: {
        sans: ["var(--font-source-sans-3)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-sora)", ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        soft: "0 12px 34px rgba(0, 39, 76, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
