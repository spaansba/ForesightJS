import { defineConfig } from "tsup"
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: {
    compilerOptions: {
      composite: false,
      declarationMap: true,
    },
  },
  sourcemap: true,
  clean: true,
  minify: true,
  external: ["js.foresight"],
  outDir: "dist",
})
