import { readdirSync, rmSync } from "node:fs"
import { join } from "node:path"

const removeSourceMaps = directory => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      removeSourceMaps(path)
    } else if (path.endsWith(".map")) {
      rmSync(path)
    }
  }
}

removeSourceMaps("dist")
