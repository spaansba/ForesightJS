import type { AstroIntegration } from "astro"
import { FORESIGHT_STRATEGY, type AstroPrefetchStrategy, type ForesightAstroOptions } from "./types"

export const foresight = (options: ForesightAstroOptions = {}): AstroIntegration => {
  const { devtools, ...clientOptions } = options

  return {
    name: "@foresightjs/astro",
    hooks: {
      "astro:config:setup": ({ injectScript, updateConfig, command }) => {
        // Keep Astro's prefetch enabled so the `astro:prefetch` module and the
        // built-in tap/hover/viewport/load strategies stay available. Native
        // settings are forwarded to Astro. When foresight claims unattributed
        // links (prefetchAll with defaultStrategy "foresight"), Astro's own
        // prefetchAll is turned off to avoid double handling.
        const { prefetchAll, defaultStrategy } = clientOptions
        const prefetch: { prefetchAll?: boolean; defaultStrategy?: AstroPrefetchStrategy } = {}

        if (defaultStrategy === FORESIGHT_STRATEGY) {
          if (prefetchAll) {
            prefetch.prefetchAll = false
          }
        } else {
          if (prefetchAll !== undefined) {
            prefetch.prefetchAll = prefetchAll
          }

          if (defaultStrategy !== undefined) {
            prefetch.defaultStrategy = defaultStrategy
          }
        }

        updateConfig({ prefetch })

        injectScript(
          "page",
          `import { initForesight } from "@foresightjs/astro/client";initForesight(${JSON.stringify(
            clientOptions
          )});`
        )

        if (devtools && command === "dev") {
          injectScript(
            "page",
            `import("js.foresight-devtools").then(({ ForesightDevtools }) => ForesightDevtools.initialize());`
          )
        }
      },
    },
  }
}

export default foresight
