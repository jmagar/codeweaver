/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@vercel/style-guide/eslint/react", "eslint-config-turbo"],
  rules: {
    "no-unused-vars": "warn",
    "no-console": "warn",
  },
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    browser: true,
  },
  parserOptions: {
    project: true,
  },
}; 