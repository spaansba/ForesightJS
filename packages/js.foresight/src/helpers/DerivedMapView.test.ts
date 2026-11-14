import { describe, it, expect } from "vitest"
import { DerivedMapView } from "./DerivedMapView"

describe("DerivedMapView", () => {
  const source = new Map([
    ["a", { state: "alpha" }],
    ["b", { state: "beta" }],
  ])
  const view = new DerivedMapView(source, entry => entry.state)

  it("exposes derived values through the ReadonlyMap API", () => {
    expect(view.size).toBe(2)
    expect(view.has("a")).toBe(true)
    expect(view.get("a")).toBe("alpha")
    expect(view.get("missing")).toBeUndefined()
    expect([...view]).toEqual([
      ["a", "alpha"],
      ["b", "beta"],
    ])
    expect([...view.keys()]).toEqual(["a", "b"])
    expect([...view.values()]).toEqual(["alpha", "beta"])

    const seen: [string, string][] = []
    view.forEach((value, key, map) => {
      seen.push([key, value])
      expect(map).toBe(view)
    })
    expect(seen).toEqual([...view.entries()])
  })

  it("reflects later changes to the source", () => {
    source.set("c", { state: "gamma" })
    source.get("a")!.state = "updated"

    expect(view.size).toBe(3)
    expect(view.get("a")).toBe("updated")
    expect(view.get("c")).toBe("gamma")
  })

  it("is tagged as a DerivedMapView", () => {
    expect(Object.prototype.toString.call(view)).toBe("[object DerivedMapView]")
  })
})
