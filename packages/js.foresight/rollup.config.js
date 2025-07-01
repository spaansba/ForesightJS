import typescript from "@rollup/plugin-typescript"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import terser from "@rollup/plugin-terser"
import { dts } from "rollup-plugin-dts"

// We need to read our package.json to get the package name and other details
import pkg from "./package.json" assert { type: "json" }

export default [
  // --- Main Bundles (CJS and ESM) ---
  {
    input: "src/index.ts",
    output: [
      // CommonJS output for older environments (e.g., require)
      {
        file: "dist/index.js", // Corresponds to "require" in exports
        format: "cjs",
        sourcemap: true,
      },
      // ES Module output for modern environments (e.g., import)
      {
        file: "dist/index.mjs", // Corresponds to "import" in exports
        format: "es",
        sourcemap: true,
      },
    ],
    plugins: [
      nodeResolve(), // Helps Rollup find external modules
      commonjs(), // Converts CommonJS modules to ES6
      typescript({ tsconfig: "./tsconfig.json" }), // Transpiles TypeScript
      terser(), // Minifies the output
    ],
    // Exclude peer dependencies from the bundle
    external: Object.keys(pkg.peerDependencies || {}),
  },

  // --- TypeScript Declaration File (.d.ts) ---
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  },
]
