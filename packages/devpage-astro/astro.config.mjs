import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import foresight from "@foresightjs/astro"

export default defineConfig({
  integrations: [
    foresight({
      prefetchAll: true,
      defaultStrategy: "foresight",
      manager: {
        trajectoryPredictionTime: 120,
        defaultHitSlop: 0,
      },
      linkDefaults: { hitSlop: 10 },
      rules: [{ selector: "nav a", hitSlop: 30 }],
      devtools: true,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
