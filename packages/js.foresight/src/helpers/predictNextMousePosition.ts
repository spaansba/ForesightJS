import type { Point } from "../types/types"

const VELOCITY_WINDOW_MS = 80
const BRAKING_DISTANCE_PX = 200
const HISTORY_SIZE = 32

export type MouseHistory = {
  time: Float64Array
  x: Float64Array
  y: Float64Array
  next: number
}

export const createMouseHistory = (): MouseHistory => ({
  time: new Float64Array(HISTORY_SIZE).fill(-Infinity),
  x: new Float64Array(HISTORY_SIZE),
  y: new Float64Array(HISTORY_SIZE),
  next: 0,
})

/**
 * Predicts where the mouse will be `trajectoryPredictionTimeInMs` from now.
 * Velocity is the least-squares slope through the positions of the last
 * {@link VELOCITY_WINDOW_MS}, so it is independent of the frame rate and never
 * uses positions from before a pause. The cursor is then assumed to brake
 * harder the faster it moves, which makes the reach grow with the logarithm of
 * the speed instead of linearly.
 * The `history` is mutated by this function: the new `currentPoint` overwrites
 * the oldest entry.
 *
 * @param currentPoint - The current actual mouse coordinates.
 * @param time - Timestamp of `currentPoint` in milliseconds.
 * @param history - Ring of previous mouse positions with timestamps.
 * @param trajectoryPredictionTimeInMs - How far into the future (in milliseconds)
 *                                       to predict the mouse position.
 * @param out - Output point to mutate with the predicted position.
 */
export const predictNextMousePosition = (
  currentPoint: Point,
  time: number,
  history: MouseHistory,
  trajectoryPredictionTimeInMs: number,
  out: Point
): void => {
  const { x, y } = currentPoint
  let weightedDx = 0
  let weightedDy = 0
  let weight = 0

  for (let age = 1; age <= HISTORY_SIZE; age++) {
    const index = (history.next - age) & (HISTORY_SIZE - 1)
    const dt = time - history.time[index]
    if (dt > VELOCITY_WINDOW_MS) {
      break
    }

    weightedDx += dt * (x - history.x[index])
    weightedDy += dt * (y - history.y[index])
    weight += dt * dt
  }

  history.time[history.next] = time
  history.x[history.next] = x
  history.y[history.next] = y
  history.next = (history.next + 1) & (HISTORY_SIZE - 1)

  const vx = weight === 0 ? 0 : weightedDx / weight
  const vy = weight === 0 ? 0 : weightedDy / weight
  const speed = Math.hypot(vx, vy)

  if (speed === 0) {
    out.x = x
    out.y = y

    return
  }

  const reach =
    BRAKING_DISTANCE_PX * Math.log1p((speed * trajectoryPredictionTimeInMs) / BRAKING_DISTANCE_PX)

  out.x = x + (vx / speed) * reach
  out.y = y + (vy / speed) * reach
}
