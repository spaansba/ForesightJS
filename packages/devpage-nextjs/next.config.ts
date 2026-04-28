import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@foresightjs/react", "js.foresight", "js.foresight-devtools"],
}

export default nextConfig
