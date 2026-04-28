import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: {
    compilerOptions: {
      composite: false,
      declarationMap: true,
    },
  },
  clean: true,
  minify: true,
  outDir: "dist",
  deps: {
    neverBundle: ["js.foresight"],
  },
  target: false,
})
