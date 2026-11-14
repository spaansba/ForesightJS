import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "js.foresight": fileURLToPath(new URL("../js.foresight/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          exclude: ["src/**/*.integration.test.*"],
          setupFiles: ["src/tests/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.*"],
          setupFiles: ["../js.foresight/test-env.ts"],
        },
      },
    ],
  },
})
