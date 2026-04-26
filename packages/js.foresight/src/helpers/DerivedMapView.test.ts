import { describe, it, expect } from "vitest"
import { DerivedMapView } from "./DerivedMapView"

type Internal = { state: { name: string; active: boolean } }

function makeSource() {
  const source = new Map<string, Internal>()
  source.set("a", { state: { name: "alpha", active: true } })
  source.set("b", { state: { name: "beta", active: false } })
  source.set("c", { state: { name: "gamma", active: true } })
  return source
}

const derive = (entry: Internal) => entry.state

describe("DerivedMapView", () => {
  describe("size", () => {
    it("should reflect the source map size", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)
      expect(view.size).toBe(3)
    })

    it("should update when source changes", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      source.set("d", { state: { name: "delta", active: false } })
      expect(view.size).toBe(4)

      source.delete("a")
      expect(view.size).toBe(3)
    })

    it("should be 0 for an empty source", () => {
      const view = new DerivedMapView(new Map(), derive)
      expect(view.size).toBe(0)
    })
  })

  describe("get", () => {
    it("should return the derived value for an existing key", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      expect(view.get("a")).toEqual({ name: "alpha", active: true })
      expect(view.get("b")).toEqual({ name: "beta", active: false })
    })

    it("should return undefined for a missing key", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)
      expect(view.get("missing")).toBeUndefined()
    })

    it("should reflect source mutations", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      source.get("a")!.state = { name: "updated", active: false }
      expect(view.get("a")).toEqual({ name: "updated", active: false })
    })
  })

  describe("has", () => {
    it("should return true for existing keys", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      expect(view.has("a")).toBe(true)
      expect(view.has("b")).toBe(true)
    })

    it("should return false for missing keys", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)
      expect(view.has("missing")).toBe(false)
    })

    it("should reflect deletions from source", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      source.delete("a")
      expect(view.has("a")).toBe(false)
    })
  })

  describe("forEach", () => {
    it("should iterate all entries with derived values", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)
      const collected: Array<[string, { name: string; active: boolean }]> = []

      view.forEach((value, key) => {
        collected.push([key, value])
      })

      expect(collected).toEqual([
        ["a", { name: "alpha", active: true }],
        ["b", { name: "beta", active: false }],
        ["c", { name: "gamma", active: true }],
      ])
    })

    it("should pass the view as the third argument", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      view.forEach((_value, _key, map) => {
        expect(map).toBe(view)
      })
    })

    it("should not call callback for empty source", () => {
      const view = new DerivedMapView(new Map<string, Internal>(), derive)
      let called = false
      view.forEach(() => {
        called = true
      })
      expect(called).toBe(false)
    })
  })

  describe("entries", () => {
    it("should yield [key, derivedValue] pairs", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      const entries = [...view.entries()]
      expect(entries).toEqual([
        ["a", { name: "alpha", active: true }],
        ["b", { name: "beta", active: false }],
        ["c", { name: "gamma", active: true }],
      ])
    })
  })

  describe("values", () => {
    it("should yield derived values", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      const values = [...view.values()]
      expect(values).toEqual([
        { name: "alpha", active: true },
        { name: "beta", active: false },
        { name: "gamma", active: true },
      ])
    })
  })

  describe("keys", () => {
    it("should yield the same keys as the source", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      expect([...view.keys()]).toEqual(["a", "b", "c"])
    })
  })

  describe("Symbol.iterator", () => {
    it("should be iterable with for-of", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)
      const collected: Array<[string, { name: string; active: boolean }]> = []

      for (const entry of view) {
        collected.push(entry)
      }

      expect(collected).toEqual([
        ["a", { name: "alpha", active: true }],
        ["b", { name: "beta", active: false }],
        ["c", { name: "gamma", active: true }],
      ])
    })

    it("should work with spread operator", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)
      const asMap = new Map(view)

      expect(asMap.size).toBe(3)
      expect(asMap.get("a")).toEqual({ name: "alpha", active: true })
    })
  })

  describe("Symbol.toStringTag", () => {
    it("should return DerivedMapView", () => {
      const view = new DerivedMapView(new Map(), derive)
      expect(Object.prototype.toString.call(view)).toBe("[object DerivedMapView]")
    })
  })

  describe("live derivation", () => {
    it("should always derive from current source state", () => {
      const source = makeSource()
      const view = new DerivedMapView(source, derive)

      expect(view.get("a")).toEqual({ name: "alpha", active: true })

      // Mutate the source entry's state
      source.get("a")!.state = { name: "replaced", active: false }
      expect(view.get("a")).toEqual({ name: "replaced", active: false })

      // Add a new entry
      source.set("d", { state: { name: "delta", active: true } })
      expect(view.get("d")).toEqual({ name: "delta", active: true })
      expect(view.size).toBe(4)

      // Delete an entry
      source.delete("b")
      expect(view.has("b")).toBe(false)
      expect(view.size).toBe(3)
    })
  })

  describe("custom derive function", () => {
    it("should work with any projection", () => {
      const source = new Map<number, { x: number; y: number }>()
      source.set(1, { x: 10, y: 20 })
      source.set(2, { x: 30, y: 40 })

      const view = new DerivedMapView(source, (entry) => entry.x + entry.y)

      expect(view.get(1)).toBe(30)
      expect(view.get(2)).toBe(70)
      expect([...view.values()]).toEqual([30, 70])
    })
  })
})
