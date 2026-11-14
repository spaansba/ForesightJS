import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import { svelte } from "@sveltejs/vite-plugin-svelte"

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "js.foresight": fileURLToPath(new URL("../js.foresight/src/index.ts", import.meta.url)),
    },
  },
  test: { environment: "node", include: ["tests/ssr.test.ts"] },
})
