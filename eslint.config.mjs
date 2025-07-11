import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import wcPlugin from "eslint-plugin-wc"
import litPlugin from "eslint-plugin-lit"

export default [
  // Global ignores
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/PositionObserver/**",
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
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
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
]
