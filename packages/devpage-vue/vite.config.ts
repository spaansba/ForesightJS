import { fileURLToPath, URL } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vueDevTools from "vite-plugin-vue-devtools"
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      "@foresightjs/vue": path.resolve(__dirname, "../foresightjs-vue/src/index.ts"),
      "js.foresight": path.resolve(__dirname, "../js.foresight/src/index.ts"),
      "js.foresight-devtools": path.resolve(__dirname, "../js.foresight-devtools/src/index.ts"),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
