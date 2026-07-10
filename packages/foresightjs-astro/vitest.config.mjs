import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "js.foresight": fileURLToPath(new URL("../js.foresight/src/index.ts", import.meta.url)),
      "astro:prefetch": fileURLToPath(
        new URL("./src/tests/astro-prefetch.stub.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
  },
})
