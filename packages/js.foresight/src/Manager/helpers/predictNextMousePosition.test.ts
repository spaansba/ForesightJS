import { describe, it, expect, beforeEach, vi } from "vitest"
import { predictNextMousePosition } from "./predictNextMousePosition"
import type { MousePosition, Point } from "../../types/types"

describe("predictNextMousePosition", () => {
  let history: MousePosition[]
  let mockTime = 0

  beforeEach(() => {
    history = []
    mockTime = 0
    vi.spyOn(performance, "now").mockImplementation(() => {
      mockTime += 16 // 16ms increments (60fps)
      return mockTime
    })
  })

  it("should return current point when history is empty", () => {
    const currentPoint: Point = { x: 100, y: 200 }
    const result = predictNextMousePosition(currentPoint, history, 5, 100)

    expect(result).toEqual(currentPoint)
    expect(history).toHaveLength(1)
  })

  it("should return current point when history has only one entry", () => {
    const currentPoint: Point = { x: 100, y: 200 }
    const result = predictNextMousePosition(currentPoint, history, 5, 100)

    expect(result).toEqual(currentPoint)
    expect(history).toHaveLength(1)
  })

  it("should predict future position with linear movement", () => {
    const positionHistorySize = 5
    const trajectoryPredictionTime = 100 // 100ms into future

    // Pre-populate history with first point
    history.push({ point: { x: 0, y: 0 }, time: 1000 })

    // Mock performance.now to return the time for the second point
    vi.spyOn(performance, "now").mockReturnValue(1016)

    const currentPoint: Point = { x: 100, y: 0 }
    const result = predictNextMousePosition(
      currentPoint,
      history,
      positionHistorySize,
      trajectoryPredictionTime
    )

    // Movement is 100px in 16ms = 6250px/second
    // Prediction for 100ms = 625px ahead
    expect(result.x).toBeCloseTo(725, 0) // 100 + 625
    expect(result.y).toBe(0)
  })

  it("should predict diagonal movement correctly", () => {
    const positionHistorySize = 5
    const trajectoryPredictionTime = 50

    // Pre-populate history with first point
    history.push({ point: { x: 0, y: 0 }, time: 2000 })

    // Mock performance.now to return the time for the second point
    vi.spyOn(performance, "now").mockReturnValue(2016)

    const currentPoint: Point = { x: 50, y: 50 }
    const result = predictNextMousePosition(
      currentPoint,
      history,
      positionHistorySize,
      trajectoryPredictionTime
    )

    // Movement is 50px x and y in 16ms
    // Velocity: 3125px/s in both directions
    // Prediction for 50ms = 156.25px in each direction
    expect(result.x).toBeCloseTo(206.25, 1)
    expect(result.y).toBeCloseTo(206.25, 1)
  })

  it("should maintain history size limit", () => {
    const positionHistorySize = 3
    const trajectoryPredictionTime = 100

    // Add more points than the limit
    for (let i = 0; i < 5; i++) {
      const currentPoint: Point = { x: i * 10, y: 0 }
      predictNextMousePosition(currentPoint, history, positionHistorySize, trajectoryPredictionTime)
    }

    expect(history).toHaveLength(positionHistorySize)
    expect(history[0].point.x).toBe(20) // Should keep the last 3 points (20, 30, 40)
    expect(history[2].point.x).toBe(40)
  })

  it("should handle zero time delta", () => {
    const positionHistorySize = 5
    const trajectoryPredictionTime = 100

    // Mock performance.now to return the same time
    vi.spyOn(performance, "now").mockReturnValue(1000)

    const currentPoint1: Point = { x: 0, y: 0 }
    const currentPoint2: Point = { x: 100, y: 100 }

    predictNextMousePosition(currentPoint1, history, positionHistorySize, trajectoryPredictionTime)
    const result = predictNextMousePosition(
      currentPoint2,
      history,
      positionHistorySize,
      trajectoryPredictionTime
    )

    expect(result).toEqual(currentPoint2)
  })

  it("should handle negative movement correctly", () => {
    const positionHistorySize = 5
    const trajectoryPredictionTime = 100

    // Pre-populate history with first point
    history.push({ point: { x: 100, y: 100 }, time: 3000 })

    // Mock performance.now to return the time for the second point
    vi.spyOn(performance, "now").mockReturnValue(3016)

    const currentPoint: Point = { x: 50, y: 75 }
    const result = predictNextMousePosition(
      currentPoint,
      history,
      positionHistorySize,
      trajectoryPredictionTime
    )

    // Movement is -50px x, -25px y in 16ms
    // Velocity: -3125px/s x, -1562.5px/s y
    // Prediction for 100ms = -312.5px x, -156.25px y
    expect(result.x).toBeCloseTo(-262.5, 1) // 50 - 312.5
    expect(result.y).toBeCloseTo(-81.25, 1) // 75 - 156.25
  })

  it("should use first and last points for velocity calculation", () => {
    const positionHistorySize = 5
    const trajectoryPredictionTime = 100

    // Add multiple points
    const times = [0, 16, 32, 48, 64]
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 10 },
      { x: 30, y: 15 },
      { x: 40, y: 20 },
    ]

    vi.spyOn(performance, "now").mockImplementation(() => times[history.length] || 64)

    points.forEach((point) => {
      predictNextMousePosition(point, history, positionHistorySize, trajectoryPredictionTime)
    })

    const currentPoint: Point = { x: 40, y: 20 }
    const result = predictNextMousePosition(
      currentPoint,
      history,
      positionHistorySize,
      trajectoryPredictionTime
    )

    // Velocity calculated from first (0,0) to last (40,20) over 64ms
    // Velocity: 625px/s x, 312.5px/s y
    // Prediction for 100ms = 62.5px x, 31.25px y ahead
    expect(result.x).toBeCloseTo(102.5, 1) // 40 + 62.5
    expect(result.y).toBeCloseTo(51.25, 1) // 20 + 31.25
  })

  it("should handle stationary mouse", () => {
    const positionHistorySize = 5
    const trajectoryPredictionTime = 100

    // Mouse not moving
    const startTime = performance.now()
    history.push({ point: { x: 50, y: 50 }, time: startTime })

    const endTime = performance.now()
    history.push({ point: { x: 50, y: 50 }, time: endTime })

    const currentPoint: Point = { x: 50, y: 50 }
    const result = predictNextMousePosition(
      currentPoint,
      history,
      positionHistorySize,
      trajectoryPredictionTime
    )

    expect(result).toEqual(currentPoint)
  })
})
