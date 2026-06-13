import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// One Vite app running BOTH frameworks. plugin-react handles .tsx/.jsx,
// plugin-vue handles .vue — no file-type overlap, so they coexist.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vue(), tailwindcss()],
  optimizeDeps: {
    exclude: ["js.foresight", "js.foresight-devtools", "@foresightjs/react", "@foresightjs/vue"],
  },
  resolve: {
    alias: {
      // foresight source packages (same wiring the standalone devpages use)
      "js.foresight": path.resolve(__dirname, "../js.foresight/src/index.ts"),
      "js.foresight-devtools": path.resolve(__dirname, "../js.foresight-devtools/src/index.ts"),
      "@foresightjs/react": path.resolve(__dirname, "../foresightjs-react/src/index.ts"),
      "@foresightjs/vue": path.resolve(__dirname, "../foresightjs-vue/src/index.ts"),
    },
  },
})
