import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5fbff",
          100: "#e6f5ff",
          200: "#bde7ff",
          300: "#7fd1ff",
          400: "#3db5ff",
          500: "#0a96eb",
          600: "#0078c4",
          700: "#0060a0",
          800: "#044f82",
          900: "#0a446d",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(10, 68, 109, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
