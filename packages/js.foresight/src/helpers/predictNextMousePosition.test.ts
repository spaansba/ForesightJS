import { describe, it, expect, beforeEach } from "vitest"
import {
  createMouseHistory,
  predictNextMousePosition,
  type MouseHistory,
} from "./predictNextMousePosition"
import type { Point } from "../types/types"

const PREDICTION_TIME = 120

describe("predictNextMousePosition", () => {
  let history: MouseHistory
  let out: Point

  const moveAlongX = (pxPerMs: number, intervalMs: number, durationMs: number) => {
    for (let time = 0; time <= durationMs; time += intervalMs) {
      predictNextMousePosition({ x: pxPerMs * time, y: 0 }, time, history, PREDICTION_TIME, out)
    }

    return out.x - pxPerMs * durationMs
  }

  beforeEach(() => {
    history = createMouseHistory()
    out = { x: 0, y: 0 }
  })

  it("returns the current point without history", () => {
    predictNextMousePosition({ x: 100, y: 200 }, 0, history, PREDICTION_TIME, out)

    expect(out).toEqual({ x: 100, y: 200 })
  })

  it("returns the current point when the mouse did not move", () => {
    predictNextMousePosition({ x: 50, y: 50 }, 0, history, PREDICTION_TIME, out)
    predictNextMousePosition({ x: 50, y: 50 }, 16, history, PREDICTION_TIME, out)

    expect(out).toEqual({ x: 50, y: 50 })
  })

  it("returns the current point when all samples share a timestamp", () => {
    predictNextMousePosition({ x: 0, y: 0 }, 1000, history, PREDICTION_TIME, out)
    predictNextMousePosition({ x: 100, y: 100 }, 1000, history, PREDICTION_TIME, out)

    expect(out).toEqual({ x: 100, y: 100 })
  })

  it("predicts along the direction of travel", () => {
    predictNextMousePosition({ x: 100, y: 100 }, 0, history, PREDICTION_TIME, out)
    predictNextMousePosition({ x: 84, y: 88 }, 16, history, PREDICTION_TIME, out)

    const reach = 200 * Math.log1p((1.25 * PREDICTION_TIME) / 200)

    expect(out.x).toBeCloseTo(84 - 0.8 * reach, 5)
    expect(out.y).toBeCloseTo(88 - 0.6 * reach, 5)
  })

  it("reaches less far than linear extrapolation, more so at high speed", () => {
    const slowReach = moveAlongX(0.25, 16, 64)
    history = createMouseHistory()
    const fastReach = moveAlongX(4, 16, 64)

    expect(slowReach).toBeGreaterThan(0.25 * PREDICTION_TIME * 0.9)
    expect(slowReach).toBeLessThan(0.25 * PREDICTION_TIME)
    expect(fastReach).toBeGreaterThan(slowReach)
    expect(fastReach).toBeLessThan(4 * PREDICTION_TIME * 0.6)
  })

  it("predicts the same reach regardless of sampling rate", () => {
    const reachAt60Hz = moveAlongX(1, 16, 160)
    history = createMouseHistory()
    const reachAt250Hz = moveAlongX(1, 4, 160)

    expect(reachAt250Hz).toBeCloseTo(reachAt60Hz, 5)
  })

  it("ignores positions from before a pause", () => {
    predictNextMousePosition({ x: 0, y: 0 }, 0, history, PREDICTION_TIME, out)
    predictNextMousePosition({ x: 500, y: 0 }, 1000, history, PREDICTION_TIME, out)

    expect(out).toEqual({ x: 500, y: 0 })

    predictNextMousePosition({ x: 516, y: 0 }, 1016, history, PREDICTION_TIME, out)

    expect(out.x).toBeCloseTo(516 + 200 * Math.log1p(PREDICTION_TIME / 200), 5)
  })

  it("keeps predicting after the history ring wraps around", () => {
    expect(moveAlongX(1, 4, 400)).toBeCloseTo(200 * Math.log1p(PREDICTION_TIME / 200), 5)
  })
})
