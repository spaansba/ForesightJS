import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import wcPlugin from "eslint-plugin-wc"
import litPlugin from "eslint-plugin-lit"
import pluginVue from "eslint-plugin-vue"
import stylistic from "@stylistic/eslint-plugin"

export default [
  // Global ignores
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/.vite/**",
      "**/scripts/**",
      "**/.docusaurus/**",
    ],
  },

  // Base config for all projects
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // General TypeScript/JavaScript files
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "func-style": ["error", "expression"],
      eqeqeq: "error",
      curly: "error",
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "if", next: "*" },
      ],
    },
  },

  // Specific config for js.foresight-devtools package (Web Components & Lit)
  {
    files: ["packages/js.foresight-devtools/**/*.{js,ts}"],
    plugins: {
      wc: wcPlugin,
      lit: litPlugin,
    },
    rules: {
      ...wcPlugin.configs.recommended.rules,
      ...litPlugin.configs.recommended.rules,
    },
  },

  // Specific config for devpage-vue package (Vue.js)
  ...pluginVue.configs["flat/essential"].map(config => ({
    ...config,
    files: ["packages/devpage-vue/**/*.vue"],
  })),
  {
    files: ["packages/devpage-vue/**/*.vue"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
]
