import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.turbo/**", "services/ml/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  {
    // Front-end (apps/web) runs in the browser, not Node.
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // TypeScript already resolves identifiers; core no-undef would also
      // false-positive on JSX. The browser globals above cover the rest.
      "no-undef": "off",
    },
  },
  prettier,
];
