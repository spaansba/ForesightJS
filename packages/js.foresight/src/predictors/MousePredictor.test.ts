import { describe, it, expect, vi } from "vitest"
import { MousePredictor } from "./MousePredictor"
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

const createInternalEntry = (id: string, expandedRect: Rect): ForesightElementInternal =>
  ({
    state: {
      id,
      isActive: true,
      isPredicted: false,
      isIntersectingWithViewport: true,
      elementBounds: { expandedRect },
    },
  }) as unknown as ForesightElementInternal

const setupPredictor = (entries: ForesightElementInternal[], enableMousePrediction: boolean) => {
  const elements = new Map<ForesightElement, ForesightElementInternal>()
  entries.forEach((entry, i) => elements.set({ id: i } as unknown as ForesightElement, entry))

  const callCallback = vi.fn()
  const emit = vi.fn()
  const dependencies: ForesightModuleDependencies = {
    elements,
    callCallback,
    emit,
    hasListeners: vi.fn(() => true),
    updateElementState: vi.fn(),
    settings: {
      enableMousePrediction,
      trajectoryPredictionTime: 120,
      positionHistorySize: 8,
      enableManagerLogging: false,
    } as ForesightManagerSettings,
  }

  const trajectoryPositions: TrajectoryPositions = {
    positions: new CircularBuffer<MousePosition>(8),
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }

  const predictor = new MousePredictor({ dependencies, trajectoryPositions })

  return { predictor, callCallback, emit }
}

describe("MousePredictor", () => {
  describe("hover mode (enableMousePrediction: false)", () => {
    it("should fire callbacks for all overlapping elements on a single mousemove", () => {
      const overlappingRect: Rect = { top: 100, left: 100, right: 200, bottom: 200 }
      const entryA = createInternalEntry("a", overlappingRect)
      const entryB = createInternalEntry("b", overlappingRect)
      const { predictor, callCallback } = setupPredictor([entryA, entryB], false)

      predictor.processMouseMovement({ clientX: 150, clientY: 150 } as MouseEvent)

      expect(callCallback).toHaveBeenCalledTimes(2)
      expect(callCallback).toHaveBeenCalledWith(entryA, { kind: "mouse", subType: "hover" })
      expect(callCallback).toHaveBeenCalledWith(entryB, { kind: "mouse", subType: "hover" })
    })

    it("should still emit mouseTrajectoryUpdate after a hover hit", () => {
      const entry = createInternalEntry("a", { top: 100, left: 100, right: 200, bottom: 200 })
      const { predictor, callCallback, emit } = setupPredictor([entry], false)

      predictor.processMouseMovement({ clientX: 150, clientY: 150 } as MouseEvent)

      expect(callCallback).toHaveBeenCalledTimes(1)
      expect(emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: "mouseTrajectoryUpdate", predictionEnabled: false })
      )
    })

    it("should not fire callback when the mouse is outside the element", () => {
      const entry = createInternalEntry("a", { top: 100, left: 100, right: 200, bottom: 200 })
      const { predictor, callCallback } = setupPredictor([entry], false)

      predictor.processMouseMovement({ clientX: 50, clientY: 50 } as MouseEvent)

      expect(callCallback).not.toHaveBeenCalled()
    })
  })
})
