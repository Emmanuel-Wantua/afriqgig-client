import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AfriqGig Brand Colors
        navy: {
          DEFAULT: "#1F3A60", // Primary Brand Color
          light: "#2A4B7C",
          dark: "#152945",
        },
        gold: {
          DEFAULT: "#F4B41A", // Accent Color
          light: "#FFC947",
        },
        green: {
          DEFAULT: "#164A35", // Verified/Money
          light: "#206649",
        },
        light: "#F8F9FA", // Backgrounds
      },
      fontFamily: {
        sans: ['var(--font-inter)'], 
      },
    },
  },
  plugins: [],
};
export default config;