import js from "@eslint/js";
import globals from "globals";
import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Convert legacy shareable configs that still rely on .eslintrc format.
const compat = new FlatCompat({
  baseDirectory: __dirname,
  // Ensures that plugins required by any of the extended configs are resolved from
  // the monorepo root where they are installed.
  resolvePluginsRelativeTo: __dirname,
});

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // 1. Ignore common generated folders across the monorepo.
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  },

  // 2. Start from ESLint's recommended rules for JavaScript.
  js.configs.recommended,

  // 3. Bring in third-party configs that are still published as .eslintrc style.
  ...compat.extends("@vercel/style-guide/eslint/next"),
  ...compat.extends("eslint-config-turbo"),
  ...compat.extends("eslint-config-prettier"),

  // 4. Declare project-wide globals available to all files.
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "writable",
        JSX: true,
      },
    },
  },

  // 5. Generic rules that apply to all code in the repo.
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
      "@next/next/no-html-link-for-pages": "off",
    },
  },

  // 6. TypeScript-specific parser options so rules that need type information work.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
];