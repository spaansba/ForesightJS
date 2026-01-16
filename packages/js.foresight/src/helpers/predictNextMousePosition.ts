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
 * @param out - Output point to mutate with the predicted position.
 */
export function predictNextMousePosition(
  currentPoint: Point,
  buffer: CircularBuffer<MousePosition>,
  trajectoryPredictionTimeInMs: number,
  out: Point
): void {
  const now = performance.now()
  // Create a copy of currentPoint for buffer storage (buffer needs independent copies)
  buffer.add({ point: { x: currentPoint.x, y: currentPoint.y }, time: now })

  const { x, y } = currentPoint

  if (buffer.length < 2) {
    out.x = x
    out.y = y
    return
  }

  const [first, last] = buffer.getFirstLast()
  if (!first || !last) {
    out.x = x
    out.y = y
    return
  }

  const dt = (last.time - first.time) * 0.001
  if (dt === 0) {
    out.x = x
    out.y = y
    return
  }

  const dx = last.point.x - first.point.x
  const dy = last.point.y - first.point.y
  const vx = dx / dt
  const vy = dy / dt

  const trajectoryPredictionTimeInSeconds = trajectoryPredictionTimeInMs * 0.001
  out.x = x + vx * trajectoryPredictionTimeInSeconds
  out.y = y + vy * trajectoryPredictionTimeInSeconds
}
