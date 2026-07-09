import { describe, expect, it } from "vitest"
import { optionsForAnchor, shouldRegister } from "./attributes"

const anchor = (attributes: Record<string, string> = {}): HTMLAnchorElement => {
  const a = document.createElement("a")
  a.href = "/about"

  for (const [key, value] of Object.entries(attributes)) {
    a.setAttribute(key, value)
  }

  return a
}

describe("shouldRegister", () => {
  it("matches explicit data-astro-prefetch=foresight regardless of config", () => {
    expect(shouldRegister(anchor({ "data-astro-prefetch": "foresight" }), {})).toBe(true)
  })

  it("never matches opted-out links", () => {
    expect(
      shouldRegister(anchor({ "data-astro-prefetch": "false" }), {
        prefetchAll: true,
        defaultStrategy: "foresight",
      })
    ).toBe(false)
  })

  it("leaves astro's own strategies alone", () => {
    for (const strategy of ["tap", "hover", "viewport", "load"]) {
      expect(
        shouldRegister(anchor({ "data-astro-prefetch": strategy }), {
          prefetchAll: true,
          defaultStrategy: "foresight",
        })
      ).toBe(false)
    }
  })

  it("claims unattributed links only with prefetchAll and defaultStrategy foresight", () => {
    expect(shouldRegister(anchor(), { prefetchAll: true, defaultStrategy: "foresight" })).toBe(true)
    expect(shouldRegister(anchor(), { prefetchAll: true })).toBe(false)
    expect(shouldRegister(anchor(), { defaultStrategy: "foresight" })).toBe(false)
    expect(shouldRegister(anchor(), {})).toBe(false)
  })

  it("leaves the bare attribute to astro's own script, which already handles it", () => {
    expect(
      shouldRegister(anchor({ "data-astro-prefetch": "" }), {
        prefetchAll: true,
        defaultStrategy: "foresight",
      })
    ).toBe(false)
    expect(shouldRegister(anchor({ "data-astro-prefetch": "" }), {})).toBe(false)
  })
})

describe("optionsForAnchor", () => {
  it("merges linkDefaults, rules and data attributes in that order", () => {
    const a = anchor({ class: "cta", "data-foresight-hit-slop": "30" })
    document.body.append(a)

    const merged = optionsForAnchor(a, {
      linkDefaults: { hitSlop: 5, name: "default-name", reactivateAfter: 1000 },
      rules: [
        { selector: ".cta", hitSlop: 10, name: "rule-name" },
        { selector: ".other", name: "unmatched" },
      ],
    })

    expect(merged).toEqual({ hitSlop: 30, name: "rule-name", reactivateAfter: 1000 })
    a.remove()
  })

  it("parses reactivate-after and enabled attributes", () => {
    const a = anchor({
      "data-foresight-reactivate-after": "5000",
      "data-foresight-enabled": "false",
      "data-foresight-name": "my-link",
    })

    expect(optionsForAnchor(a, {})).toEqual({
      reactivateAfter: 5000,
      enabled: false,
      name: "my-link",
    })
  })
})
