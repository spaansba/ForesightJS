import { describe, expect, it } from "vitest"
import { parseHitSlop, serializeHitSlop } from "./hitSlop"

describe("parseHitSlop", () => {
  it("returns undefined for empty input", () => {
    expect(parseHitSlop(undefined)).toBeUndefined()
    expect(parseHitSlop("")).toBeUndefined()
  })

  it("parses a single value as a number", () => {
    expect(parseHitSlop("20")).toBe(20)
  })

  it("parses two values as vertical/horizontal", () => {
    expect(parseHitSlop("10 40")).toEqual({ top: 10, right: 40, bottom: 10, left: 40 })
  })

  it("parses three values as top, horizontal, bottom", () => {
    expect(parseHitSlop("10 40 20")).toEqual({ top: 10, right: 40, bottom: 20, left: 40 })
  })

  it("parses four values as top right bottom left", () => {
    expect(parseHitSlop("1 2 3 4")).toEqual({ top: 1, right: 2, bottom: 3, left: 4 })
  })

  it("rejects non-numeric input", () => {
    expect(parseHitSlop("10 potato")).toBeUndefined()
  })
})

describe("serializeHitSlop", () => {
  it("returns undefined for undefined input", () => {
    expect(serializeHitSlop(undefined)).toBeUndefined()
  })

  it("serializes a number to a single value", () => {
    expect(serializeHitSlop(20)).toBe("20")
  })

  it("serializes a rect to four values", () => {
    expect(serializeHitSlop({ top: 1, right: 2, bottom: 3, left: 4 })).toBe("1 2 3 4")
  })

  it("serializes zero and negative values", () => {
    expect(serializeHitSlop(0)).toBe("0")
    expect(serializeHitSlop({ top: -5, right: 0, bottom: 5, left: 10 })).toBe("-5 0 5 10")
  })

  it("round-trips through parseHitSlop", () => {
    expect(parseHitSlop(serializeHitSlop(20))).toBe(20)
    expect(parseHitSlop(serializeHitSlop(0))).toBe(0)
    expect(parseHitSlop(serializeHitSlop({ top: 10, right: 40, bottom: 10, left: 40 }))).toEqual({
      top: 10,
      right: 40,
      bottom: 10,
      left: 40,
    })
    expect(parseHitSlop(serializeHitSlop({ top: -5, right: 0, bottom: 5, left: 10 }))).toEqual({
      top: -5,
      right: 0,
      bottom: 5,
      left: 10,
    })
  })

  it("round-trips shorthand parses back to the same rect", () => {
    const parsed = parseHitSlop("10 40")

    expect(parseHitSlop(serializeHitSlop(parsed))).toEqual(parsed)
  })
})
