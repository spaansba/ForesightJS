import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ["js.foresight", "js.foresight-devtools", "@foresightjs/react"],
  },
  resolve: {
    alias: {
      "js.foresight": path.resolve(__dirname, "../js.foresight/src/index.ts"),
      "js.foresight-devtools": path.resolve(__dirname, "../js.foresight-devtools/src/index.ts"),
      "@foresightjs/react": path.resolve(__dirname, "../foresightjs-react/src/index.ts"),
    },
  },
})
