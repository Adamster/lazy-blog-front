import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: "#65a30d",
            // secondary: "#535C8D",
            background: "#fafafa",
            foreground: "#2e3035",
            focus: "#8AADD0",
          },
        },
        dark: {
          colors: {
            primary: "#65a30d",
            // secondary: "#535C8D",
            background: "#2e3035",
            foreground: "#dedede",
            content1: "#2e3035",
            focus: "#3C6997",
          },
        },
      },
    }),
  ],
} satisfies Config;

//https://coolors.co/2e3035-fafafa-7a9e9f-6a858a-ecc30b
