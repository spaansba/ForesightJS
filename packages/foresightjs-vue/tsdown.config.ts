import { defineConfig } from "tsdown"
import Vue from "unplugin-vue/rolldown"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  plugins: [Vue()],
  dts: {
    // Emit `.d.ts` for `.vue` single-file components via vue-tsc.
    vue: true,
    compilerOptions: {
      composite: false,
      declarationMap: true,
    },
  },
  clean: true,
  minify: true,
  outDir: "dist",
  deps: {
    neverBundle: ["js.foresight", "vue"],
  },
  target: false,
})
