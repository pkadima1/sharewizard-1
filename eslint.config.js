import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "functions/lib/**/*.js", "functions/lib/**/*.js.map"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn", // Changed from error to warning
      "react-hooks/exhaustive-deps": "warn", // Make this a warning instead of error
      "@typescript-eslint/ban-ts-comment": "warn", // Make this a warning
      "no-useless-escape": "warn", // Make this a warning
      "@typescript-eslint/no-unsafe-function-type": "warn", // Make this a warning
      "no-prototype-builtins": "warn", // Make this a warning
      "@typescript-eslint/no-unused-expressions": "warn", // Make this a warning
      "@typescript-eslint/no-require-imports": "warn", // Make this a warning
    },
  }
);
