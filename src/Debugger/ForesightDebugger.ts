import { ForesightManager } from "../Manager/ForesightManager"
import { DebuggerControlPanel } from "./DebuggerControlPanel"
import type {
  ForesightElementData,
  ForesightElement,
  TrajectoryPositions,
  ForesightManagerSettings,
  Point,
} from "../types/types"
import { isTouchDevice } from "../helpers/isTouchDevice"
import { createAndAppendElement, createAndAppendStyle } from "./helpers/createAndAppend"
import { updateElementOverlays } from "./helpers/updateElementOverlays"
import { removeOldDebuggers } from "./helpers/removeOldDebuggers"
import { DEFAULT_SHOW_NAME_TAGS } from "../Manager/constants"

export type ElementOverlays = {
  expandedOverlay: HTMLElement
  nameLabel: HTMLElement
  animation?: {
    overlay: HTMLElement
    startTime: number
    duration: number
    timeoutId: ReturnType<typeof setTimeout>
  }
}
export class ForesightDebugger {
  private static debuggerInstance: ForesightDebugger

  private foresightManagerInstance: ForesightManager
  private shadowHost!: HTMLElement
  private shadowRoot!: ShadowRoot
  private debugContainer!: HTMLElement
  private controlPanel!: DebuggerControlPanel

  private debugElementOverlays: Map<ForesightElement, ElementOverlays> = new Map()
  private predictedMouseIndicator: HTMLElement | null = null
  private mouseTrajectoryLine: HTMLElement | null = null
  private scrollTrajectoryLine: HTMLElement | null = null
  private lastElementData: Map<
    ForesightElement,
    { isHovering: boolean; isTrajectoryHit: boolean }
  > = new Map()

  private constructor(foresightManager: ForesightManager) {
    this.foresightManagerInstance = foresightManager
  }

  private _setupDOM() {
    // If for some reason we call this on an already-setup instance, do nothing.
    if (this.shadowHost) {
      return
    }

    this.shadowHost = createAndAppendElement("div", document.body, {
      id: "jsforesight-debugger-shadow-host",
    })
    this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" })
    this.debugContainer = createAndAppendElement("div", this.shadowRoot, {
      id: "jsforesight-debug-container",
    })
    this.predictedMouseIndicator = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-mouse-predicted",
    })
    this.mouseTrajectoryLine = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-trajectory-line",
    })
    this.scrollTrajectoryLine = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-scroll-trajectory-line",
    })
    this.controlPanel = DebuggerControlPanel.initialize(
      this.foresightManagerInstance,
      this.shadowRoot,
      this.foresightManagerInstance.getManagerData.globalSettings.debuggerSettings
    )
    createAndAppendStyle(debuggerCSS, this.shadowRoot, "screen-visuals")
  }

  private static get isInitiated(): boolean {
    return !!ForesightDebugger.debuggerInstance
  }

  public static initialize(
    foresightManager: ForesightManager,
    trajectoryPositions: TrajectoryPositions
  ): ForesightDebugger | null {
    removeOldDebuggers()
    if (typeof window === "undefined" || isTouchDevice()) {
      return null
    }

    if (!ForesightDebugger.isInitiated) {
      ForesightDebugger.debuggerInstance = new ForesightDebugger(foresightManager)
    }

    const instance = ForesightDebugger.debuggerInstance

    if (!instance.shadowHost) {
      instance._setupDOM()
    }

    instance.updateMouseTrajectoryVisuals(
      trajectoryPositions,
      foresightManager.getManagerData.globalSettings.enableMousePrediction
    )

    return instance
  }

  private createElementOverlays(elementData: ForesightElementData) {
    const expandedOverlay = createAndAppendElement("div", this.debugContainer!, {
      className: "jsforesight-expanded-overlay",
      data: elementData.name,
    })
    const nameLabel = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-name-label",
    })
    const overlays = { expandedOverlay, nameLabel }
    this.debugElementOverlays.set(elementData.element, overlays)
    return overlays
  }

  public createOrUpdateElementOverlay(newData: ForesightElementData) {
    if (!this.debugContainer || !this.shadowRoot) return
    this.lastElementData.set(newData.element, {
      isHovering: newData.isHovering,
      isTrajectoryHit: newData.trajectoryHitData.isTrajectoryHit,
    })
    let overlays = this.debugElementOverlays.get(newData.element)
    if (!overlays) {
      overlays = this.createElementOverlays(newData)
    }
    updateElementOverlays(
      overlays,
      newData,
      this.foresightManagerInstance.getManagerData.globalSettings.debuggerSettings.showNameTags ??
        DEFAULT_SHOW_NAME_TAGS
    )
    this.controlPanel.refreshElementList()
  }

  public toggleNameTagVisibility() {
    this.foresightManagerInstance.registeredElements.forEach((elementData) => {
      const overlays = this.debugElementOverlays.get(elementData.element)
      if (!overlays) return
      updateElementOverlays(
        overlays,
        elementData,
        this.foresightManagerInstance.getManagerData.globalSettings.debuggerSettings.showNameTags ??
          DEFAULT_SHOW_NAME_TAGS
      )
    })
  }

  /**
   * Removes all debug overlays and data associated with an element.
   *
   * This method cleans up the link overlay, expanded overlay, and name label
   * for the specified element, removes it from internal tracking maps, and
   * refreshes the control panel's element list to reflect the removal.
   *
   * @param element - The ForesightElement to remove from debugging visualization
   */
  public removeElement(element: ForesightElement) {
    const overlays = this.debugElementOverlays.get(element)
    if (overlays) {
      overlays.expandedOverlay.remove()
      overlays.nameLabel.remove()
      this.debugElementOverlays.delete(element)
    }
    this.lastElementData.delete(element)
    this.controlPanel?.refreshElementList()
  }

  public updateMouseTrajectoryVisuals(
    trajectoryPositions: TrajectoryPositions,
    enableMousePrediction: boolean
  ) {
    if (!this.shadowRoot || !this.debugContainer) {
      return
    }
    if (!this.predictedMouseIndicator || !this.mouseTrajectoryLine) {
      return
    }
    const { predictedPoint, currentPoint } = trajectoryPositions

    // Use transform for positioning to avoid layout reflow.
    // The CSS handles centering the element with `translate(-50%, -50%)`.
    this.predictedMouseIndicator.style.transform = `translate3d(${predictedPoint.x}px, ${predictedPoint.y}px, 0) translate3d(-50%, -50%, 0)`
    this.predictedMouseIndicator.style.display = enableMousePrediction ? "block" : "none"

    // This hides the circle from the UI at the top-left corner when refreshing the page with the cursor outside of the window
    if (predictedPoint.x === 0 && predictedPoint.y === 0) {
      this.predictedMouseIndicator.style.display = "none"
      return
    }

    if (!enableMousePrediction) {
      this.mouseTrajectoryLine.style.display = "none"
      return
    }

    const dx = predictedPoint.x - currentPoint.x
    const dy = predictedPoint.y - currentPoint.y

    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    // Use a single transform to position, rotate, and scale the line,
    // avoiding reflow from top/left changes.
    this.mouseTrajectoryLine.style.transform = `translate3d(${currentPoint.x}px, ${currentPoint.y}px, 0) rotate(${angle}deg)`
    this.mouseTrajectoryLine.style.width = `${length}px`
    this.mouseTrajectoryLine.style.display = "block"
  }

  public updateScrollTrajectoryVisuals(currentPoint: Point, predictedScrollPoint: Point) {
    if (!this.scrollTrajectoryLine) return
    const dx = predictedScrollPoint.x - currentPoint.x
    const dy = predictedScrollPoint.y - currentPoint.y

    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    this.scrollTrajectoryLine.style.transform = `translate3d(${currentPoint.x}px, ${currentPoint.y}px, 0) rotate(${angle}deg)`
    this.scrollTrajectoryLine.style.width = `${length}px`
    this.scrollTrajectoryLine.style.display = "block"
  }

  public hideScrollTrajectoryVisuals() {
    if (this.scrollTrajectoryLine) {
      this.scrollTrajectoryLine.style.display = "none"
    }
  }

  public updateControlsState(settings: ForesightManagerSettings) {
    this.controlPanel?.updateControlsState(settings)
    this.controlPanel?.refreshElementList()
  }

  public refreshDebuggerElementList() {
    this.controlPanel?.refreshElementList()
  }

  public showCallbackAnimation(elementData: ForesightElementData) {
    const overlays = this.debugElementOverlays.get(elementData.element)
    if (!overlays) {
      return
    }

    if (overlays.animation) {
      clearTimeout(overlays.animation.timeoutId)
      overlays.animation.overlay.remove()
    }

    const animationOverlay = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-callback-indicator",
    })

    const { left, top, right, bottom } = elementData.elementBounds.expandedRect
    const width = right - left
    const height = bottom - top

    animationOverlay.style.display = "block"
    animationOverlay.style.transform = `translate3d(${left}px, ${top}px, 0)`
    animationOverlay.style.width = `${width}px`
    animationOverlay.style.height = `${height}px`

    requestAnimationFrame(() => {
      animationOverlay.classList.add("animate")
    })

    const animationDuration = 500
    const timeoutId = setTimeout(() => {
      if (overlays.animation) {
        overlays.animation.overlay.remove()
        overlays.animation = undefined
      }
    }, animationDuration)

    overlays.animation = {
      overlay: animationOverlay,
      startTime: Date.now(),
      duration: animationDuration,
      timeoutId: timeoutId,
    }
  }

  public cleanup() {
    this.controlPanel?.cleanup()
    this.shadowHost?.remove()
    this.debugElementOverlays.clear()
    this.lastElementData.clear()
    this.shadowHost = null!
    this.shadowRoot = null!
    this.debugContainer = null!
    this.predictedMouseIndicator = null
    this.mouseTrajectoryLine = null
    this.scrollTrajectoryLine = null
    this.controlPanel = null!
  }
}

const debuggerCSS = `
      #jsforesight-debug-container { 
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 9999;
      }

      .jsforesight-expanded-overlay, 
      .jsforesight-name-label, 
      .jsforesight-callback-indicator,
      .jsforesight-mouse-predicted,
      .jsforesight-scroll-trajectory-line,
      .jsforesight-trajectory-line {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform; 
      }
      .jsforesight-expanded-overlay {
        border: 1px dashed rgba(100, 116, 139, 0.4);
        background-color: rgba(100, 116, 139, 0.05);
        box-sizing: border-box;
        border-radius: 8px;
      }
      .jsforesight-mouse-predicted {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid #6b98e1;
        background-color: rgba(176, 196, 222, 0.3);
        z-index: 10000;
        /* transform is now set dynamically via JS for performance */
      }
      .jsforesight-trajectory-line {
        height: 2px;
        background-color: #6b98e1;
        transform-origin: left center;
        z-index: 9999;
        border-radius: 1px;
        /* width and transform are set dynamically via JS for performance */
      }
      .jsforesight-scroll-trajectory-line {
        height: 2px;
        background-color: oklch(65% 0.25 140); /* A nice, modern green */
        transform-origin: left center;
        z-index: 9999;
        border-radius: 1px;
        display: none; /* Hidden by default */
      }
      .jsforesight-name-label {
        background-color: rgba(27, 31, 35, 0.85);
        backdrop-filter: blur(4px);
        color: white;
        padding: 4px 8px;
        font-size: 11px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
        border-radius: 4px;
        z-index: 10001;
        white-space: nowrap;
        pointer-events: none;
      }
      .jsforesight-callback-indicator {
        border: 4px solid oklch(65% 0.22 280); 
        border-radius: 8px;
        box-sizing: border-box;
        pointer-events: none;
        opacity: 0;
        z-index: 10002;
        display: none; 
      }
      .jsforesight-callback-indicator.animate {
        animation: jsforesight-callback-pulse 0.5s ease-out forwards;
      }

      @keyframes jsforesight-callback-pulse {
        0% {
          opacity: 1;
          box-shadow: 0 0 15px oklch(65% 0.22 280 / 0.7);
        }
        100% {
          opacity: 0;
          box-shadow: 0 0 25px oklch(65% 0.22 280 / 0);
        }
      }
    `
