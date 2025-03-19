import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      width: {
        'content': '60%', 
        'aside': '40%'
      }
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        radius: {
          // small: "1rem", // rounded-small
          // medium: "1rem", // rounded-medium
          // large: "1rem", // rounded-large
        },
      },
      themes: {
        light: {
          colors: {
            primary: "#95B1B2",
            secondary: "#4F6367",
            background: "#fafafa",
            foreground: "#2e3035",
            focus: "#83AFA0",
          },
        },
        dark: {
          colors: {
            primary: "#7A9E9F",
            secondary: "#6A858A",
            background: "#2e3035",
            foreground: "#dedede",
            content1: "#2e3035",
            focus: "#5B8E7D",
          },
        },
      },
    }),
  ],
} satisfies Config;

//https://coolors.co/2e3035-fafafa-7a9e9f-6a858a-ecc30b
