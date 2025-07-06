/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@codeweaver/eslint-config/next.js"],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
}; 