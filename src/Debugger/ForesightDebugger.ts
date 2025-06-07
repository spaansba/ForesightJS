// ForesightDebugger.ts
import type { ForesightManager } from "../Manager/ForesightManager"
import { DebuggerControlPanel } from "./DebuggerControlPanel" // Import the new class
import type {
  ForesightElementData,
  ForesightElement,
  ForesightManagerProps,
  Point,
  Rect,
} from "../types/types"
import { isTouchDevice } from "../helpers/isTouchDevice"
import { createAndAppendElement } from "./helpers/createAndAppendElement"
import { updateElementOverlays } from "./helpers/updateElementOverlays"

export type ElementOverlays = {
  linkOverlay: HTMLElement
  expandedOverlay: HTMLElement
  nameLabel: HTMLElement
}

export class ForesightDebugger {
  private static debuggerInstance: ForesightDebugger

  private foresightManagerInstance: ForesightManager
  private shadowHost: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private debugContainer: HTMLElement | null = null
  private debugLinkOverlays: Map<ForesightElement, ElementOverlays> = new Map()
  private debugPredictedMouseIndicator: HTMLElement | null = null
  private debugTrajectoryLine: HTMLElement | null = null
  private debugCallbackIndicator: HTMLElement | null = null

  private controlPanel: DebuggerControlPanel | null = null
  private lastElementData: Map<
    ForesightElement,
    { isHovering: boolean; isTrajectoryHit: boolean }
  > = new Map()

  private constructor(foresightManager: ForesightManager) {
    const oldDebuggers = document.querySelectorAll("#jsforesight-debugger-shadow-host")
    oldDebuggers.forEach((element) => element.remove())
    this.foresightManagerInstance = foresightManager
    this.controlPanel = new DebuggerControlPanel(this.foresightManagerInstance)
  }

  // Static method to get the singleton instance
  public static getInstance(intentManager: ForesightManager): ForesightDebugger {
    if (!ForesightDebugger.isInitiated) {
      ForesightDebugger.debuggerInstance = new ForesightDebugger(intentManager)
    }
    return ForesightDebugger.debuggerInstance
  }

  private static get isInitiated(): boolean {
    return !!ForesightDebugger.debuggerInstance
  }

  public initialize(
    links: Map<ForesightElement, ForesightElementData>,
    currentSettings: ForesightManagerProps,
    currentPoint: Point,
    predictedPoint: Point
  ) {
    if (typeof window === "undefined" || isTouchDevice() || !ForesightDebugger.isInitiated) {
      return
    }

    this.createDebugElements()

    if (this.shadowRoot) {
      this.controlPanel?.initialize(this.shadowRoot, currentSettings.debuggerSettings)
    }

    links.forEach((data, element) => {
      this.createOrUpdateElementOverlay(element, data)
    })

    this.updateTrajectoryVisuals(
      currentPoint,
      predictedPoint,
      currentSettings.enableMousePrediction
    )
  }

  private createDebugElements() {
    this.shadowHost = document.createElement("div")
    this.shadowHost.id = "jsforesight-debugger-shadow-host"
    this.shadowHost.style.pointerEvents = "none"
    document.body.appendChild(this.shadowHost)
    this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" })

    const debuggerStyleElement = document.createElement("style")
    debuggerStyleElement.id = "debug-container"
    debuggerStyleElement.textContent = debuggerCSS
    this.shadowRoot.appendChild(debuggerStyleElement)

    this.debugContainer = createAndAppendElement(
      "div",
      this.shadowRoot,
      "",
      "jsforesight-debug-container"
    )
    this.debugPredictedMouseIndicator = createAndAppendElement(
      "div",
      this.debugContainer,
      "jsforesight-mouse-predicted"
    )
    this.debugTrajectoryLine = createAndAppendElement(
      "div",
      this.debugContainer,
      "jsforesight-trajectory-line"
    )
    this.debugCallbackIndicator = createAndAppendElement(
      "div",
      this.debugContainer,
      "jsforesight-callback-indicator"
    )
  }

  private createElementOverlays(element: ForesightElement) {
    const linkOverlay = createAndAppendElement(
      "div",
      this.debugContainer!,
      "jsforesight-link-overlay"
    )
    const expandedOverlay = createAndAppendElement(
      "div",
      this.debugContainer!,
      "jsforesight-expanded-overlay"
    )
    const nameLabel = createAndAppendElement("div", this.debugContainer!, "jsforesight-name-label")
    const overlays = { linkOverlay, expandedOverlay, nameLabel }
    this.debugLinkOverlays.set(element, overlays)
    return overlays
  }

  public createOrUpdateElementOverlay(element: ForesightElement, newData: ForesightElementData) {
    if (!this.debugContainer || !this.shadowRoot) return
    this.lastElementData.set(element, {
      isHovering: newData.isHovering,
      isTrajectoryHit: newData.trajectoryHitData.isTrajectoryHit,
    })
    let overlays = this.debugLinkOverlays.get(element)
    if (!overlays) {
      overlays = this.createElementOverlays(element)
    }
    updateElementOverlays(overlays, newData)
    this.controlPanel?.refreshElementList()
  }

  public removeLinkOverlay(element: ForesightElement) {
    const overlays = this.debugLinkOverlays.get(element)
    if (overlays) {
      overlays.linkOverlay.remove()
      overlays.expandedOverlay.remove()
      overlays.nameLabel.remove()
      this.debugLinkOverlays.delete(element)
    }
    this.lastElementData.delete(element)

    this.controlPanel?.refreshElementList()
  }

  public refreshDisplayedElements() {
    if (!this.shadowRoot || !this.debugContainer) {
      // If not initialized, do nothing
      return
    }

    const currentManagerElements = new Set(this.foresightManagerInstance.registeredElements.keys())

    this.foresightManagerInstance.registeredElements.forEach((data, element) => {
      this.createOrUpdateElementOverlay(element, data)
    })

    const overlaysToRemove = Array.from(this.debugLinkOverlays.keys()).filter(
      (el) => !currentManagerElements.has(el)
    )
    overlaysToRemove.forEach((el) => {
      const specificOverlays = this.debugLinkOverlays.get(el)
      specificOverlays?.linkOverlay.remove()
      specificOverlays?.expandedOverlay.remove()
      specificOverlays?.nameLabel.remove()
      this.debugLinkOverlays.delete(el)
      this.lastElementData.delete(el)
    })

    this.controlPanel?.refreshElementList()
  }

  public updateTrajectoryVisuals(
    currentPoint: Point,
    predictedPoint: Point,
    enableMousePrediction: boolean
  ) {
    if (!this.shadowRoot || !this.debugContainer) {
      return
    }
    if (!this.debugPredictedMouseIndicator || !this.debugTrajectoryLine) {
      return
    }

    this.debugPredictedMouseIndicator.style.left = `${predictedPoint.x}px`
    this.debugPredictedMouseIndicator.style.top = `${predictedPoint.y}px`
    this.debugPredictedMouseIndicator.style.display = enableMousePrediction ? "block" : "none"

    // This hides the circle from the UI at the top-left corner when refreshing the page with the cursor outside of the window
    if (predictedPoint.x === 0 && predictedPoint.y === 0) {
      this.debugPredictedMouseIndicator.style.display = "none"
      return
    }

    if (!enableMousePrediction) {
      this.debugTrajectoryLine.style.display = "none"
      return
    }

    const dx = predictedPoint.x - currentPoint.x
    const dy = predictedPoint.y - currentPoint.y

    // Only show trajectory if there's significant movement
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      const length = Math.sqrt(dx * dx + dy * dy)
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI

      this.debugTrajectoryLine.style.left = `${currentPoint.x}px`
      this.debugTrajectoryLine.style.top = `${currentPoint.y}px`
      this.debugTrajectoryLine.style.width = `${length}px`
      this.debugTrajectoryLine.style.transform = `translateY(-50%) rotate(${angle}deg)`
      this.debugTrajectoryLine.style.display = "block"
    } else {
      this.debugTrajectoryLine.style.display = "none"
    }
  }

  public updateControlsState(settings: ForesightManagerProps) {
    this.controlPanel?.updateControlsState(settings)
  }

  public showCallbackPopup(whereToShow: Rect) {
    if (!this.debugContainer || !this.shadowRoot || !this.debugCallbackIndicator) {
      // Debugger not fully initialized or callback indicator not created, cannot show callback popup.
      return
    }

    // Position and size the callback indicator
    this.debugCallbackIndicator.style.left = `${whereToShow.left}px`
    this.debugCallbackIndicator.style.top = `${whereToShow.top}px`
    this.debugCallbackIndicator.style.width = `${whereToShow.right - whereToShow.left}px`
    this.debugCallbackIndicator.style.height = `${whereToShow.bottom - whereToShow.top}px`

    // Trigger the animation by adding and removing the class
    this.debugCallbackIndicator.classList.remove("animate")
    // Use a small timeout to ensure the class removal registers before adding it again
    requestAnimationFrame(() => {
      this.debugCallbackIndicator!.classList.add("animate")
    })
  }
  public cleanup() {
    this.controlPanel?.cleanup()
    this.shadowHost?.remove()
    this.shadowHost = null
    this.shadowRoot = null
    this.debugContainer = null

    this.debugLinkOverlays.clear()
    this.lastElementData.clear()
    this.debugPredictedMouseIndicator = null
    this.debugTrajectoryLine = null
    this.debugCallbackIndicator = null
  }
}

const debuggerCSS = `
      #jsforesight-debug-container { 
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 9999;
      }
      .jsforesight-link-overlay {
        position: absolute;
        border: 2px solid rgba(100, 116, 139, 0.2);
        background-color: rgba(100, 116, 139, 0.08);
        box-sizing: border-box;
        border-radius: 6px;
        transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
      }
      .jsforesight-link-overlay.active {
        border-color: rgba(100, 116, 139, 0.5);
        background-color: rgba(100, 116, 139, 0.15);
      }
      .jsforesight-link-overlay.trajectory-hit {
        border-color: oklch(65% 0.2 250); /* A nice, modern blue */
        background-color: rgba(79, 70, 229, 0.15);
        box-shadow: 0 0 12px rgba(79, 70, 229, 0.5);
      }
      .jsforesight-expanded-overlay {
        position: absolute;
        border: 1px dashed rgba(100, 116, 139, 0.4);
        background-color: rgba(100, 116, 139, 0.05);
        box-sizing: border-box;
        border-radius: 8px;
      }
      .jsforesight-mouse-predicted {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid #6b98e1;
        background-color: rgba(176, 196, 222, 0.3);
        transform: translate(-50%, -50%);
        z-index: 10000;
      }
      .jsforesight-trajectory-line {
        position: absolute;
        height: 2px;
        background-color: #6b98e1;
        transform-origin: left center;
        z-index: 9999;
        border-radius: 1px;
      }
      .jsforesight-name-label {
        position: absolute;
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
        position: absolute;
        border: 4px solid oklch(65% 0.22 280); /* Vibrant Violet */
        border-radius: 8px;
        box-sizing: border-box;
        pointer-events: none;
        opacity: 0;
        z-index: 10002;
      }
      .jsforesight-callback-indicator.animate {
        animation: jsforesight-callback-pulse 0.4s ease-out forwards;
      }

      @keyframes jsforesight-callback-pulse {
        0% {
          transform: scale(1);
          opacity: 1;
          box-shadow: 0 0 15px oklch(65% 0.22 280 / 0.7);
        }
        100% {
          transform: scale(1.1);
          opacity: 0;
          box-shadow: 0 0 25px oklch(65% 0.22 280 / 0);
        }
      }
    `
