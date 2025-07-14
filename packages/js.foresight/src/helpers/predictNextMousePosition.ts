import type { MousePosition, Point } from "../types/types"
import type { CircularBuffer } from "./CircularBuffer"

/**
 * Predicts the next mouse position based on a history of recent movements.
 * It calculates velocity from the historical data and extrapolates a future point.
 * The `buffer` is mutated by this function: the new `currentPoint` is added,
 * automatically overwriting the oldest entry when the buffer is full.
 *
 * @param currentPoint - The current actual mouse coordinates.
 * @param buffer - A circular buffer of previous mouse positions with timestamps.
 *                 This buffer will be modified by this function.
 * @param trajectoryPredictionTimeInMs - How far into the future (in milliseconds)
 *                                       to predict the mouse position.
 * @returns The predicted {@link Point} (x, y coordinates). If history is insufficient
 *          (less than 2 points) or time delta is zero, returns the `currentPoint`.
 */
export function predictNextMousePosition(
  currentPoint: Point,
  buffer: CircularBuffer<MousePosition>,
  trajectoryPredictionTimeInMs: number
): Point {
  const now = performance.now()
  const currentPosition: MousePosition = { point: currentPoint, time: now }
  const { x, y } = currentPoint

  buffer.add(currentPosition)

  if (buffer.length < 2) {
    return { x, y }
  }

  const positions = buffer.getItems()
  const first = positions[0]
  const last = positions[positions.length - 1]
  const dt = (last.time - first.time) / 1000

  if (dt === 0) {
    return { x, y }
  }

  const dx = last.point.x - first.point.x
  const dy = last.point.y - first.point.y
  const vx = dx / dt
  const vy = dy / dt

  const trajectoryPredictionTimeInSeconds = trajectoryPredictionTimeInMs / 1000
  const predictedX = x + vx * trajectoryPredictionTimeInSeconds
  const predictedY = y + vy * trajectoryPredictionTimeInSeconds

  return { x: predictedX, y: predictedY }
}
