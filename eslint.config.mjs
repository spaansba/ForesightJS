import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import wcPlugin from "eslint-plugin-wc"
import litPlugin from "eslint-plugin-lit"
import pluginVue from "eslint-plugin-vue"
import reactHooksPlugin from "eslint-plugin-react-hooks"
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
      "**/.next/**",
      "**/next-env.d.ts",
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

  // Specific config for React packages (hooks correctness)
  {
    files: [
      "packages/foresightjs-react/**/*.{ts,tsx}",
      "packages/devpage-react/**/*.{ts,tsx}",
      "packages/devpage-nextjs/**/*.{ts,tsx}",
    ],
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
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

  // Specific config for Vue packages (Vue.js)
  ...pluginVue.configs["flat/essential"].map(config => ({
    ...config,
    files: ["packages/devpage-vue/**/*.vue", "packages/foresightjs-vue/**/*.vue"],
  })),
  {
    files: ["packages/devpage-vue/**/*.vue", "packages/foresightjs-vue/**/*.vue"],
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
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/block-order": ["error", { order: ["script", "template", "style"] }],
      "vue/block-lang": ["error", { script: { lang: "ts" } }],
      "vue/component-api-style": ["error", ["script-setup"]],
      "vue/component-name-in-template-casing": [
        "error",
        "PascalCase",
        { registeredComponentsOnly: true, ignores: [] },
      ],
      "vue/custom-event-name-casing": ["error", "camelCase"],
      "vue/define-emits-declaration": ["error", "type-based"],
      "vue/define-props-declaration": ["error", "type-based"],
      "vue/define-props-destructuring": "error",
      "vue/define-macros-order": [
        "error",
        {
          order: ["defineModel", "defineEmits", "defineSlots"],
        },
      ],
      "vue/html-button-has-type": "error",
      "vue/no-empty-component-block": "error",
      "vue/no-ref-object-reactivity-loss": "error",
      "vue/no-required-prop-with-default": "error",
      "vue/no-unused-emit-declarations": "error",
      "vue/no-use-v-else-with-v-for": "error",
      "vue/no-useless-v-bind": "error",
      "vue/padding-line-between-blocks": ["error", "always"],
      "vue/prefer-true-attribute-shorthand": "error",
      "vue/prefer-use-template-ref": "error",
      "vue/v-bind-style": ["error", "shorthand", { sameNameShorthand: "always" }],
      "vue/v-on-style": ["error", "shorthand"],
      "vue/v-slot-style": ["error", "shorthand"],
    },
  },
]
