import { describe, it, expect, beforeEach, vi } from "vitest"
import { predictNextMousePosition } from "./predictNextMousePosition"
import { CircularBuffer } from "./CircularBuffer"
import type { MousePosition, Point } from "../types/types"

describe("predictNextMousePosition", () => {
  let buffer: CircularBuffer<MousePosition>
  let out: Point
  let mockTime = 0

  beforeEach(() => {
    buffer = new CircularBuffer<MousePosition>(5)
    out = { x: 0, y: 0 }
    mockTime = 0
    vi.spyOn(performance, "now").mockImplementation(() => {
      mockTime += 16 // 16ms increments (60fps)
      return mockTime
    })
  })

  it("should return current point when buffer is empty", () => {
    const currentPoint: Point = { x: 100, y: 200 }
    predictNextMousePosition(currentPoint, buffer, 100, out)

    expect(out).toEqual(currentPoint)
    expect(buffer.length).toBe(1)
  })

  it("should return current point when buffer has only one entry", () => {
    const currentPoint: Point = { x: 100, y: 200 }
    predictNextMousePosition(currentPoint, buffer, 100, out)

    expect(out).toEqual(currentPoint)
    expect(buffer.length).toBe(1)
  })

  it("should predict future position with linear movement", () => {
    const trajectoryPredictionTime = 100 // 100ms into future

    // Pre-populate buffer with first point
    buffer.add({ point: { x: 0, y: 0 }, time: 1000 })

    // Mock performance.now to return the time for the second point
    vi.spyOn(performance, "now").mockReturnValue(1016)

    const currentPoint: Point = { x: 100, y: 0 }
    predictNextMousePosition(currentPoint, buffer, trajectoryPredictionTime, out)

    // Movement is 100px in 16ms = 6250px/second
    // Prediction for 100ms = 625px ahead
    expect(out.x).toBeCloseTo(725, 0) // 100 + 625
    expect(out.y).toBe(0)
  })

  it("should predict diagonal movement correctly", () => {
    const trajectoryPredictionTime = 50

    // Pre-populate buffer with first point
    buffer.add({ point: { x: 0, y: 0 }, time: 2000 })

    // Mock performance.now to return the time for the second point
    vi.spyOn(performance, "now").mockReturnValue(2016)

    const currentPoint: Point = { x: 50, y: 50 }
    predictNextMousePosition(currentPoint, buffer, trajectoryPredictionTime, out)

    // Movement is 50px x and y in 16ms
    // Velocity: 3125px/s in both directions
    // Prediction for 50ms = 156.25px in each direction
    expect(out.x).toBeCloseTo(206.25, 1)
    expect(out.y).toBeCloseTo(206.25, 1)
  })

  it("should maintain buffer size limit", () => {
    const buffer3 = new CircularBuffer<MousePosition>(3)
    const trajectoryPredictionTime = 100

    // Add more points than the limit
    for (let i = 0; i < 5; i++) {
      const currentPoint: Point = { x: i * 10, y: 0 }
      predictNextMousePosition(currentPoint, buffer3, trajectoryPredictionTime, out)
    }

    expect(buffer3.length).toBe(3)
    expect(buffer3.getFirst()?.point.x).toBe(20) // Should keep the last 3 points (20, 30, 40)
    expect(buffer3.getLast()?.point.x).toBe(40)
  })

  it("should handle zero time delta", () => {
    const trajectoryPredictionTime = 100

    // Mock performance.now to return the same time
    vi.spyOn(performance, "now").mockReturnValue(1000)

    const currentPoint1: Point = { x: 0, y: 0 }
    const currentPoint2: Point = { x: 100, y: 100 }

    predictNextMousePosition(currentPoint1, buffer, trajectoryPredictionTime, out)
    predictNextMousePosition(currentPoint2, buffer, trajectoryPredictionTime, out)

    expect(out).toEqual(currentPoint2)
  })

  it("should handle negative movement correctly", () => {
    const trajectoryPredictionTime = 100

    // Pre-populate buffer with first point
    buffer.add({ point: { x: 100, y: 100 }, time: 3000 })

    // Mock performance.now to return the time for the second point
    vi.spyOn(performance, "now").mockReturnValue(3016)

    const currentPoint: Point = { x: 50, y: 75 }
    predictNextMousePosition(currentPoint, buffer, trajectoryPredictionTime, out)

    // Movement is -50px x, -25px y in 16ms
    // Velocity: -3125px/s x, -1562.5px/s y
    // Prediction for 100ms = -312.5px x, -156.25px y
    expect(out.x).toBeCloseTo(-262.5, 1) // 50 - 312.5
    expect(out.y).toBeCloseTo(-81.25, 1) // 75 - 156.25
  })

  it("should use first and last points for velocity calculation", () => {
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

    vi.spyOn(performance, "now").mockImplementation(() => times[buffer.length] || 64)

    points.forEach(point => {
      predictNextMousePosition(point, buffer, trajectoryPredictionTime, out)
    })

    const currentPoint: Point = { x: 40, y: 20 }
    predictNextMousePosition(currentPoint, buffer, trajectoryPredictionTime, out)

    // Velocity calculated from first (0,0) to last (40,20) over 64ms
    // Velocity: 625px/s x, 312.5px/s y
    // Prediction for 100ms = 62.5px x, 31.25px y ahead
    expect(out.x).toBeCloseTo(102.5, 1) // 40 + 62.5
    expect(out.y).toBeCloseTo(51.25, 1) // 20 + 31.25
  })

  it("should handle stationary mouse", () => {
    const trajectoryPredictionTime = 100

    // Mouse not moving
    const startTime = performance.now()
    buffer.add({ point: { x: 50, y: 50 }, time: startTime })

    const endTime = performance.now()
    buffer.add({ point: { x: 50, y: 50 }, time: endTime })

    const currentPoint: Point = { x: 50, y: 50 }
    predictNextMousePosition(currentPoint, buffer, trajectoryPredictionTime, out)

    expect(out).toEqual(currentPoint)
  })
})
