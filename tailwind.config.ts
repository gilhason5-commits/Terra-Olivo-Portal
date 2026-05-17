import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        olive: {
          50: "#f7f8ed",
          100: "#ecefd3",
          200: "#dae0aa",
          300: "#c2cd78",
          400: "#a9b850",
          500: "#8b9b38",
          600: "#6c7c2a",
          700: "#525f24",
          800: "#434d21",
          900: "#3a421f",
          950: "#1e240c",
        },
        gold: {
          400: "#d4af37",
          500: "#c8a02a",
          600: "#a98322",
        },
        cream: "#faf8f1",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
