import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import { svelte } from "@sveltejs/vite-plugin-svelte"

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ["browser"],
    alias: {
      "js.foresight": fileURLToPath(new URL("../js.foresight/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.svelte.ts"],
    setupFiles: ["tests/setup.ts"],
  },
})
