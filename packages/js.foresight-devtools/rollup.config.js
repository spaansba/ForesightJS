import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import { dts } from "rollup-plugin-dts" // Correct named import
import terser from "@rollup/plugin-terser"
import peerDepsExternal from "rollup-plugin-peer-deps-external"
import postcss from "rollup-plugin-postcss"

export default [
  // --- Main Bundles (CJS and ESM) ---
  {
    input: "src/index.ts",
    output: [
      // CommonJS output for older environments
      {
        file: "dist/index.js", // Hardcoded path
        format: "cjs",
        sourcemap: true,
      },
      // ES Module output for modern environments
      {
        file: "dist/index.mjs", // Hardcoded path
        format: "es",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(), // Keep this for peer dependencies like React
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      postcss(), // Keep your CSS plugin
      terser(),
    ],
  },

  // --- TypeScript Declaration File (.d.ts) ---
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }], // Hardcoded path
    plugins: [dts()], // Correct usage of dts
    // Tell the declaration bundler to ignore CSS imports
    external: [/\.css$/],
  },
]
