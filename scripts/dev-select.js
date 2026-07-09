#!/usr/bin/env node

import { spawn } from "child_process"
import * as readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log("\nChoose a devpage to run:\n")

console.log(
  "\x1b[34m1. Framework devpage (default — React + Vue + Angular on one page, switch with one click)\x1b[0m"
)
console.log(
  "\x1b[35m2. Astro devpage (page prefetching via the @foresightjs/astro integration)\x1b[0m"
)
console.log(
  "\x1b[36m3. Next.js devpage (framework-specific testing only, prefetch only works in prod build)\x1b[0m\n"
)

rl.question("Enter your choice (1-3): ", answer => {
  rl.close()

  let filter
  switch (answer.trim()) {
    case "1":
      filter = "devpage-framework"
      console.log("\nStarting framework devpage (React + Vue + Angular)...\n")
      break
    case "2":
      filter = "devpage-astro"
      console.log("\nStarting Astro devpage...\n")
      break
    case "3":
      filter = "devpage-nextjs"
      console.log("\nStarting Next.js devpage...\n")
      break

    default:
      console.error("Invalid choice. Please run again and select 1-3.")
      process.exit(1)
  }

  const child = spawn("pnpm", ["--filter", filter, "dev"], {
    stdio: "inherit",
    shell: true,
  })

  child.on("error", error => {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  })

  child.on("exit", code => {
    process.exit(code || 0)
  })
})
