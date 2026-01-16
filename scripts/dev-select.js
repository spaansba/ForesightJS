#!/usr/bin/env node

import { spawn } from "child_process"
import * as readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log("\nChoose a devpage to run:\n")
console.log(
  "\x1b[34m1. React devpage (default - use for all non-framework-specific development)\x1b[0m"
)
console.log("\x1b[32m2. Vue devpage (framework-specific testing only)\x1b[0m\n")

rl.question("Enter your choice (1-2): ", answer => {
  rl.close()

  let filter
  switch (answer.trim()) {
    case "1":
      filter = "devpage"
      console.log("\nStarting React devpage...\n")
      break
    case "2":
      filter = "devpage-vue"
      console.log("\nStarting Vue devpage...\n")
      break
    default:
      console.error("Invalid choice. Please run again and select 1 or 2.")
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
