import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import jest from "eslint-plugin-jest";
import ts from "typescript-eslint";

/** @type { import("eslint").Linter.FlatConfig[] } */
const config = ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  eslintConfigPrettier,
  { ignores: ["coverage", "node_modules"] },
  {
    files: ["**/*.test.*"],
    ...jest.configs["flat/recommended"],
  },
);

export default config;
