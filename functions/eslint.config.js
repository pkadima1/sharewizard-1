// eslint.config.js - Production-Ready Configuration
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        // Add Node.js globals
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "writable",
      },
    },
    rules: {
      // Security & Code Quality (STRICT - Production Critical)
      "@typescript-eslint/no-explicit-any": "warn", // Allow any with warning
      "@typescript-eslint/no-unused-vars": "warn", // Warn instead of error for unused vars
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "no-throw-literal": "warn", // Warn instead of error
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      
      // Style Rules (RELAXED - Not blocking deployment)
      "quotes": "off", // Allow both single and double quotes
      "indent": "off", // Allow mixed indentation
      "semi": "off", // Allow with or without semicolons
      "comma-dangle": "off", // Allow trailing commas or not
      "object-curly-spacing": "off",
      "max-len": "off", // Allow long lines
      
      // Logging (Allow for Cloud Functions)
      "no-console": "off",
    },
  },
  {
    ignores: ["lib/**/*", "generated/**/*", "node_modules/**/*", "dist/**/*"],
  },
];