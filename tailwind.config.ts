import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
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
            primary: "#8FB7AA",
            secondary: "#FFA400",
            background: "#fafafa",
            foreground: "#2e3035",
            focus: "#83AFA0",
          },
        },
        dark: {
          colors: {
            primary: "#6AA08E",
            secondary: "#FFA400",
            background: "#2e3035",
            content1: "#2e3035",
            focus: "#5B8E7D",
          },
        },
      },
    }),
  ],
} satisfies Config;
