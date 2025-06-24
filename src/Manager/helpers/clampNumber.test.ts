import { describe, it, expect, vi } from "vitest"
import { clampNumber } from "./clampNumber"

describe("clampNumber", () => {
  it("should return the value when it is within the range", () => {
    expect(clampNumber(5, 1, 10, false, "test")).toBe(5)
    expect(clampNumber(1, 1, 10, false, "test")).toBe(1)
    expect(clampNumber(10, 1, 10, false, "test")).toBe(10)
  })

  it("should return the minimum when value is below range", () => {
    expect(clampNumber(0, 1, 10, false, "test")).toBe(1)
    expect(clampNumber(-5, 1, 10, false, "test")).toBe(1)
    expect(clampNumber(-100, 0, 50, false, "test")).toBe(0)
  })

  it("should return the maximum when value is above range", () => {
    expect(clampNumber(15, 1, 10, false, "test")).toBe(10)
    expect(clampNumber(100, 1, 10, false, "test")).toBe(10)
    expect(clampNumber(200, 0, 50, false, "test")).toBe(50)
  })

  it("should handle negative ranges", () => {
    expect(clampNumber(-5, -10, -1, false, "test")).toBe(-5)
    expect(clampNumber(-15, -10, -1, false, "test")).toBe(-10)
    expect(clampNumber(0, -10, -1, false, "test")).toBe(-1)
  })

  it("should handle floating point numbers", () => {
    expect(clampNumber(2.5, 1.0, 5.0, false, "test")).toBe(2.5)
    expect(clampNumber(0.5, 1.0, 5.0, false, "test")).toBe(1.0)
    expect(clampNumber(6.5, 1.0, 5.0, false, "test")).toBe(5.0)
  })
})
