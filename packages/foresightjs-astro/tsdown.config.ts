import { defineConfig } from "tsdown"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    client: "src/client/index.ts",
  },
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
    // `astro:prefetch` is a virtual module that only exists inside an Astro
    // project, the consumer's Vite build resolves it.
    neverBundle: ["js.foresight", "astro", "astro:prefetch"],
  },
  target: false,
})
