import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
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
  env: {
    NODE_ENV: "production",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    PRODUCTION: "true",
  },
})
