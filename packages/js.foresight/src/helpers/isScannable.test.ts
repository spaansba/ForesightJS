import { describe, it, expect } from "vitest"
import { isScannable } from "./isScannable"
import type { ForesightElementState } from "../types/types"

const state = (patch: Partial<ForesightElementState>): ForesightElementState =>
  ({
    isIntersectingWithViewport: true,
    isActive: true,
    isPredicted: false,
    ...patch,
  }) as ForesightElementState

describe("isScannable", () => {
  it("is true only when intersecting, active and not predicted", () => {
    expect(isScannable(state({}))).toBe(true)
  })

  it("is false when off-screen", () => {
    expect(isScannable(state({ isIntersectingWithViewport: false }))).toBe(false)
  })

  it("is false when inactive", () => {
    expect(isScannable(state({ isActive: false }))).toBe(false)
  })

  it("is false once predicted (already fired)", () => {
    expect(isScannable(state({ isPredicted: true }))).toBe(false)
  })
})
