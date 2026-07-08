import { describe, it, expect, vi } from "vitest"
import { ScrollPredictor } from "./ScrollPredictor"
import { CircularBuffer } from "../helpers/CircularBuffer"
import type { ForesightModuleDependencies } from "../core/BaseForesightModule"
import type {
  ForesightElement,
  ForesightElementInternal,
  ForesightManagerSettings,
  MousePosition,
  Rect,
  TrajectoryPositions,
} from "../types/types"

const createInternalEntry = (
  id: string,
  originalRect: Rect,
  expandedRect: Rect
): ForesightElementInternal =>
  ({
    state: {
      id,
      isActive: true,
      isPredicted: false,
      isIntersectingWithViewport: true,
    },
    bounds: { originalRect, expandedRect },
  }) as unknown as ForesightElementInternal

const setupPredictor = (currentPoint = { x: 150, y: 150 }) => {
  const callCallback = vi.fn()
  const dependencies: ForesightModuleDependencies = {
    elements: new Map<ForesightElement, ForesightElementInternal>(),
    scannableElements: new Set<ForesightElementInternal>(),
    callCallback,
    emit: vi.fn(),
    hasListeners: vi.fn(() => false),
    updateElementState: vi.fn(),
    updateElementBounds: vi.fn(),
    settings: {
      enableScrollPrediction: true,
      scrollMargin: 100,
      enableManagerLogging: false,
    } as ForesightManagerSettings,
  }

  const trajectoryPositions: TrajectoryPositions = {
    positions: new CircularBuffer<MousePosition>(8),
    currentPoint,
    predictedPoint: { x: 0, y: 0 },
  }

  const predictor = new ScrollPredictor({ dependencies, trajectoryPositions })

  return { predictor, callCallback }
}

describe("ScrollPredictor", () => {
  it("derives scroll direction from the PRE-update rect in entry.bounds vs the new rect", () => {
    const { predictor, callCallback } = setupPredictor({ x: 150, y: 150 })

    // Element sits below the cursor and moves up in the viewport = scrolling down.
    const oldRect: Rect = { top: 300, left: 100, right: 200, bottom: 400 }
    const expandedRect: Rect = { top: 240, left: 90, right: 210, bottom: 410 }
    const entry = createInternalEntry("a", oldRect, expandedRect)
    const newRect = { top: 250, left: 100, right: 200, bottom: 350 } as DOMRect

    // The cursor (150,150) scrolled 100px down lands at (150,250) - inside expandedRect
    // only because direction was derived from the old originalRect still in bounds.
    predictor.handleScrollPrefetch(entry, newRect)

    expect(callCallback).toHaveBeenCalledWith(entry, { kind: "scroll", subType: "down" })
  })

  it("does not fire when old and new rects are identical (no scroll)", () => {
    const { predictor, callCallback } = setupPredictor()

    const rect: Rect = { top: 300, left: 100, right: 200, bottom: 400 }
    const entry = createInternalEntry("a", rect, rect)

    predictor.handleScrollPrefetch(entry, { ...rect } as DOMRect)

    expect(callCallback).not.toHaveBeenCalled()
  })
})
