import type { MousePosition, Point } from "../types/types"

/**
 * Predicts the next mouse position based on a history of recent movements.
 * It calculates velocity from the historical data and extrapolates a future point.
 * The `history` array is mutated by this function: the new `currentPoint` is added,
 * and if the history exceeds `positionHistorySize`, the oldest entry is removed.
 *
 * @param currentPoint - The current actual mouse coordinates.
 * @param history - An array of previous mouse positions with timestamps.
 *                  This array will be modified by this function.
 * @param positionHistorySize - The maximum number of past positions to store and consider
 *                              for the prediction.
 * @param trajectoryPredictionTimeInMs - How far into the future (in milliseconds)
 *                                       to predict the mouse position.
 * @returns The predicted {@link Point} (x, y coordinates). If history is insufficient
 *          (less than 2 points) or time delta is zero, returns the `currentPoint`.
 */
export function predictNextMousePosition(
  currentPoint: Point,
  history: MousePosition[],
  positionHistorySize: number,
  trajectoryPredictionTimeInMs: number
): Point {
  const now = performance.now()
  const currentPosition: MousePosition = { point: currentPoint, time: now }
  const { x, y } = currentPoint

  history.push(currentPosition)
  if (history.length > positionHistorySize) {
    history.shift()
  }

  if (history.length < 2) {
    return { x, y }
  }

  const first = history[0]
  const last = history[history.length - 1]
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
