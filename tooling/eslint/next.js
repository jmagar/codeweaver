/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@vercel/style-guide/eslint/next", "eslint-config-turbo"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
  parserOptions: {
    project: true,
  },
}; 