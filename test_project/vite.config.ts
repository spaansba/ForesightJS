import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { resolve } from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      foresightjs: resolve(__dirname, "../src"),
    },
  },
  optimizeDeps: {
    include: ["foresightjs"],
  },
})
