import { describe, expect, it, vi } from "vitest"
import { foresight } from "./integration"

type SetupHook = (options: {
  injectScript: ReturnType<typeof vi.fn>
  updateConfig: ReturnType<typeof vi.fn>
  command: "dev" | "build"
}) => void

const runSetup = (
  integration: ReturnType<typeof foresight>,
  command: "dev" | "build" = "build"
) => {
  const injectScript = vi.fn()
  const updateConfig = vi.fn()

  ;(integration.hooks["astro:config:setup"] as unknown as SetupHook)({
    injectScript,
    updateConfig,
    command,
  })

  return { injectScript, updateConfig }
}

describe("foresight integration", () => {
  it("injects a page script with the serialized client options", () => {
    const { injectScript } = runSetup(
      foresight({ prefetchAll: true, defaultStrategy: "foresight", linkDefaults: { hitSlop: 20 } })
    )

    expect(injectScript).toHaveBeenCalledTimes(1)

    const [stage, code] = injectScript.mock.calls[0]

    expect(stage).toBe("page")
    expect(code).toContain('"prefetchAll":true')
    expect(code).toContain('"defaultStrategy":"foresight"')
    expect(code).toContain('"hitSlop":20')
    expect(code).not.toContain("devtools")
  })

  it("disables astro's prefetchAll when foresight claims unattributed links", () => {
    const { updateConfig } = runSetup(
      foresight({ prefetchAll: true, defaultStrategy: "foresight" })
    )

    expect(updateConfig).toHaveBeenCalledWith({ prefetch: { prefetchAll: false } })
  })

  it("leaves astro's prefetchAll alone when foresight takes no unattributed links", () => {
    const { updateConfig } = runSetup(foresight({ defaultStrategy: "foresight" }))

    expect(updateConfig).toHaveBeenCalledWith({ prefetch: {} })
  })

  it("forwards native prefetch settings to astro", () => {
    const { updateConfig } = runSetup(foresight({ prefetchAll: true, defaultStrategy: "viewport" }))

    expect(updateConfig).toHaveBeenCalledWith({
      prefetch: { prefetchAll: true, defaultStrategy: "viewport" },
    })
  })

  it("forwards prefetchAll to astro without a default strategy", () => {
    const { updateConfig } = runSetup(foresight({ prefetchAll: true }))

    expect(updateConfig).toHaveBeenCalledWith({ prefetch: { prefetchAll: true } })
  })

  it("keeps astro's prefetch config untouched otherwise", () => {
    const { updateConfig } = runSetup(foresight())

    expect(updateConfig).toHaveBeenCalledWith({ prefetch: {} })
  })

  it("loads devtools only during dev", () => {
    const dev = runSetup(foresight({ devtools: true }), "dev")
    const build = runSetup(foresight({ devtools: true }), "build")

    expect(dev.injectScript).toHaveBeenCalledTimes(2)
    expect(dev.injectScript.mock.calls[1][1]).toContain("js.foresight-devtools")
    expect(build.injectScript).toHaveBeenCalledTimes(1)
  })
})
