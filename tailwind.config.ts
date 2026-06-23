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
        brand: {
          50: "#fef9ee",
          100: "#fef0d3",
          200: "#fddea6",
          300: "#fbc46e",
          400: "#f8a033",
          500: "#f6840b",
          600: "#e76806",
          700: "#c04f09",
          800: "#9a3f10",
          900: "#7c3411",
          950: "#431806",
        },
        ice: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
