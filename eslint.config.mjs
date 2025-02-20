/* eslint-disable import/no-anonymous-default-export */
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Отключает проверку `any`
      "@typescript-eslint/no-unused-vars": "off", // Отключает проверку неиспользуемых переменных
      "no-unused-vars": "off", // Отключает стандартный ESLint
      "@typescript-eslint/no-empty-interface": "off", // Отключает ошибки на пустые интерфейсы
      "no-var": "off", // Отключает запрет `var`
      "@next/next/no-img-element": "off", // Отключает предупреждение про `<img>`
    },
  },
];
