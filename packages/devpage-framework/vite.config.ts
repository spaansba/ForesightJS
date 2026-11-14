import { defineConfig } from "vite"
import angular from "@analogjs/vite-plugin-angular"
import react from "@vitejs/plugin-react"
import vue from "@vitejs/plugin-vue"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// One Vite app running FOUR frameworks. plugin-react handles .tsx/.jsx,
// plugin-vue handles .vue, plugin-svelte handles Svelte files, and the Analog plugin Angular-compiles only the
// .ts files that contain Angular decorators (it uses oxc to detect them, so
// the React/Vue/shared .ts files pass straight through untouched).
// https://vite.dev/config/
export default defineConfig({
  plugins: [angular(), react(), vue(), svelte(), tailwindcss()],
  optimizeDeps: {
    exclude: [
      "js.foresight",
      "js.foresight-devtools",
      "@foresightjs/react",
      "@foresightjs/vue",
      "@foresightjs/svelte",
      "@foresightjs/angular",
    ],
  },
  resolve: {
    alias: {
      // foresight source packages (same wiring the standalone devpages use)
      "js.foresight": path.resolve(__dirname, "../js.foresight/src/index.ts"),
      "js.foresight-devtools": path.resolve(__dirname, "../js.foresight-devtools/src/index.ts"),
      "@foresightjs/react": path.resolve(__dirname, "../foresightjs-react/src/index.ts"),
      "@foresightjs/vue": path.resolve(__dirname, "../foresightjs-vue/src/index.ts"),
      "@foresightjs/svelte": path.resolve(__dirname, "../foresightjs-svelte/src/index.ts"),
      "@foresightjs/angular": path.resolve(__dirname, "../foresightjs-angular/src/index.ts"),
    },
  },
})
