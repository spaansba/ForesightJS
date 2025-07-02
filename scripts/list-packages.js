const fs = require("fs")
const path = require("path")

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
}

const packagesDir = path.join(process.cwd(), "packages")

if (!fs.existsSync(packagesDir)) {
  console.error(
    `${colors.red}Error: 'packages' directory not found at ${packagesDir}${colors.reset}`
  )
  process.exit(1)
}

console.log(`${colors.bright}Inspecting packages in: ${packagesDir}${colors.reset}\n`)

try {
  const packageFolders = fs.readdirSync(packagesDir).filter(file => {
    const packagePath = path.join(packagesDir, file)
    return fs.statSync(packagePath).isDirectory()
  })

  if (packageFolders.length === 0) {
    console.log(`${colors.yellow}No packages found in the 'packages' directory.${colors.reset}`)
    return
  }

  packageFolders.forEach(folder => {
    const packageJsonPath = path.join(packagesDir, folder, "package.json")

    if (fs.existsSync(packageJsonPath)) {
      const fileContent = fs.readFileSync(packageJsonPath, "utf8")
      const packageJson = JSON.parse(fileContent)

      const { name, version, description, private: isPrivate, repository } = packageJson

      console.log(`${colors.cyan}${colors.bright}${name || "N/A"}${colors.reset}`)
      console.log(`  - ${colors.green}Version:${colors.reset} ${version || "N/A"}`)
      if (description) {
        console.log(`  - ${colors.green}Description:${colors.reset} ${description}`)
      }
      console.log(
        `  - ${colors.green}Private:${colors.reset} ${isPrivate ? colors.yellow + "Yes" : "No"}${
          colors.reset
        }`
      )
      console.log(`  - ${colors.green}Location:${colors.reset}  ./packages/${folder}`)

      let githubUrl = null
      if (repository) {
        const url = typeof repository === "string" ? repository : repository.url
        if (url) {
          githubUrl = url.replace("git+", "").replace(".git", "")
        }
      }

      if (githubUrl) {
        console.log(`  - ${colors.green}GitHub:${colors.reset}    ${githubUrl}`)
      }

      console.log("")
    }
  })
} catch (error) {
  console.error(`${colors.red}An error occurred while reading packages:${colors.reset}`, error)
  process.exit(1)
}
