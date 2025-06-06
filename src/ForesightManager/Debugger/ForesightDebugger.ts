// ForesightDebugger.ts
import type { ForesightManager } from "../Manager/ForesightManager"
import { DebuggerControlPanel } from "./DebuggerControlPanel" // Import the new class
import type {
  ForesightElementData,
  ForesightElement,
  ForesightManagerProps,
  Point,
  Rect,
} from "../../types/types"
import { isTouchDevice } from "../helpers/isTouchDevice"

export class ForesightDebugger {
  private static debuggerInstance: ForesightDebugger

  private foresightManagerInstance: ForesightManager
  private shadowHost: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private debugContainer: HTMLElement | null = null
  private debugLinkOverlays: Map<
    ForesightElement,
    {
      linkOverlay: HTMLElement
      expandedOverlay: HTMLElement
      nameLabel: HTMLElement
    }
  > = new Map()
  private debugPredictedMouseIndicator: HTMLElement | null = null
  private debugTrajectoryLine: HTMLElement | null = null
  private debuggerStyleElement: HTMLStyleElement | null = null // Renamed for clarity
  private debugCallbackIndicator: HTMLElement | null = null // Added for callback animation

  private controlPanel: DebuggerControlPanel | null = null
  private lastElementData: Map<
    ForesightElement,
    { isHovering: boolean; isTrajectoryHit: boolean }
  > = new Map()

  // Make the constructor private
  private constructor(intentManager: ForesightManager) {
    // Remove any stale debuggers
    const oldDebuggers = document.querySelectorAll("#jsforesight-debugger-shadow-host")
    oldDebuggers.forEach((element) => element.remove())

    this.foresightManagerInstance = intentManager
    // The control panel also depends on the debugger, so initialize it here
    // It will need the shadow root later in the initialize method
    this.controlPanel = new DebuggerControlPanel(this.foresightManagerInstance)
  }

  // Static method to get the singleton instance
  public static getInstance(intentManager: ForesightManager): ForesightDebugger {
    if (!ForesightDebugger.debuggerInstance) {
      ForesightDebugger.debuggerInstance = new ForesightDebugger(intentManager)
    }
    return ForesightDebugger.debuggerInstance
  }

  public initialize(
    links: Map<ForesightElement, ForesightElementData>,
    currentSettings: ForesightManagerProps,
    currentPoint: Point,
    predictedPoint: Point
  ) {
    if (typeof window === "undefined" || isTouchDevice()) {
      // If already initialized but touch device, cleanup
      if (this.shadowHost) {
        this.cleanup()
      }
      return
    }

    // Avoid re-initialization if already setup and not a touch device
    if (this.shadowHost) {
      console.warn("ForesightDebugger already initialized.")
      this.updateControlsState(currentSettings)
      this.updateTrajectoryVisuals(
        currentPoint,
        predictedPoint,
        currentSettings.enableMousePrediction
      )
      this.refreshDisplayedElements()
      return
    }

    this.shadowHost = document.createElement("div")
    this.shadowHost.id = "jsforesight-debugger-shadow-host"
    this.shadowHost.style.pointerEvents = "none"
    document.body.appendChild(this.shadowHost)
    this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" })

    this.debuggerStyleElement = document.createElement("style")
    this.debuggerStyleElement.id = "debug-container"
    this.debuggerStyleElement.textContent = `
      #jsforesight-debug-container { 
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 9999;
      }
      .jsforesight-link-overlay {
        position: absolute; border: 2px solid transparent;
        background-color: rgba(0, 0, 255, 0.1); box-sizing: border-box;
        transition: opacity 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
      }
      .jsforesight-link-overlay.active {
        border-color: oklch(83.7% 0.128 66.29); background-color: rgba(255, 0, 0, 0.1);
      }
      .jsforesight-link-overlay.trajectory-hit {
        border-color: oklch(89.7% 0.196 126.665); background-color: rgba(0, 255, 0, 0.3);
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
      }
      .jsforesight-expanded-overlay {
        position: absolute; border: 1px dashed rgba(0, 0, 255, 0.3);
        background-color: rgba(0, 0, 255, 0.05); box-sizing: border-box;
      }
      .jsforesight-mouse-predicted {
        position: absolute; width: 20px; height: 20px; border-radius: 50%;
        border: 2px solid oklch(83.7% 0.128 66.29); background-color: rgba(255, 165, 0, 0.3);
        transform: translate(-50%, -50%); z-index: 10000;
      }
      .jsforesight-trajectory-line {
        position: absolute; height: 2px; background-color: rgba(255, 100, 0, 0.5);
        transform-origin: left center; z-index: 9999;
      }
      .jsforesight-name-label {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 3px 6px;
        font-size: 11px;
        font-family: Arial, sans-serif;
        border-radius: 3px;
        z-index: 10001;
        white-space: nowrap;
        pointer-events: none;
      }
      .jsforesight-callback-indicator {
        position: absolute;
        border: 4px solid oklch(60% 0.1 270); 
        border-radius: 5px;
        box-sizing: border-box;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease-out;
        z-index: 10002;
      }
      .jsforesight-callback-indicator.animate {
        animation: jsforesight-callback-pulse 0.4s ease-out forwards;
      }

      @keyframes jsforesight-callback-pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.1);
          opacity: 0;
        }
      }
    `
    this.shadowRoot.appendChild(this.debuggerStyleElement)

    this.debugContainer = document.createElement("div")
    this.debugContainer.id = "jsforesight-debug-container"
    this.shadowRoot.appendChild(this.debugContainer)

    this.debugPredictedMouseIndicator = document.createElement("div")
    this.debugPredictedMouseIndicator.className = "jsforesight-mouse-predicted"
    this.debugContainer.appendChild(this.debugPredictedMouseIndicator)

    this.debugTrajectoryLine = document.createElement("div")
    this.debugTrajectoryLine.className = "jsforesight-trajectory-line"
    this.debugContainer.appendChild(this.debugTrajectoryLine)

    this.debugCallbackIndicator = document.createElement("div")
    this.debugCallbackIndicator.className = "jsforesight-callback-indicator"
    this.debugContainer.appendChild(this.debugCallbackIndicator)

    // Initialize the control panel AND PASS THE SHADOW ROOT
    if (this.shadowRoot && this.controlPanel) {
      this.controlPanel.initialize(this.shadowRoot, currentSettings.debuggerSettings)
    }

    links.forEach((data, element) => {
      this.createOrUpdateLinkOverlay(element, data)
    })

    this.updateTrajectoryVisuals(
      currentPoint,
      predictedPoint,
      currentSettings.enableMousePrediction
    )
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
    this.debuggerStyleElement = null
    this.debugCallbackIndicator = null

    // Clear the static instance reference on cleanup
    ForesightDebugger.debuggerInstance = undefined as any // Use `any` to allow setting to undefined
  }

  public createOrUpdateLinkOverlay(element: ForesightElement, newData: ForesightElementData) {
    if (!this.debugContainer || !this.shadowRoot) return

    this.lastElementData.set(element, {
      isHovering: newData.isHovering,
      isTrajectoryHit: newData.trajectoryHitData.isTrajectoryHit,
    })

    let overlays = this.debugLinkOverlays.get(element)
    if (!overlays) {
      const linkOverlay = document.createElement("div")
      linkOverlay.className = "jsforesight-link-overlay"
      this.debugContainer.appendChild(linkOverlay)

      const expandedOverlay = document.createElement("div")
      expandedOverlay.className = "jsforesight-expanded-overlay"
      this.debugContainer.appendChild(expandedOverlay)

      const nameLabel = document.createElement("div")
      nameLabel.className = "jsforesight-name-label"
      this.debugContainer.appendChild(nameLabel)

      overlays = { linkOverlay, expandedOverlay, nameLabel }
      this.debugLinkOverlays.set(element, overlays)
    }

    const { linkOverlay, expandedOverlay, nameLabel } = overlays
    const rect = element.getBoundingClientRect()

    linkOverlay.style.left = `${rect.left}px`
    linkOverlay.style.top = `${rect.top}px`
    linkOverlay.style.width = `${rect.width}px`
    linkOverlay.style.height = `${rect.height}px`
    linkOverlay.classList.toggle("trajectory-hit", newData.trajectoryHitData.isTrajectoryHit)
    linkOverlay.classList.toggle("active", newData.isHovering)

    if (newData.elementBounds.expandedRect) {
      expandedOverlay.style.left = `${newData.elementBounds.expandedRect.left}px`
      expandedOverlay.style.top = `${newData.elementBounds.expandedRect.top}px`
      expandedOverlay.style.width = `${
        newData.elementBounds.expandedRect.right - newData.elementBounds.expandedRect.left
      }px`
      expandedOverlay.style.height = `${
        newData.elementBounds.expandedRect.bottom - newData.elementBounds.expandedRect.top
      }px`
      expandedOverlay.style.display = "block"
    } else {
      expandedOverlay.style.display = "none"
    }

    if (newData.name && newData.name !== "Unnamed") {
      nameLabel.textContent = newData.name
      nameLabel.style.display = "block"
      nameLabel.style.left = `${rect.left}px`
      nameLabel.style.top = `${rect.top - 22}px` // Position above the element
    } else {
      nameLabel.style.display = "none"
    }

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
      this.createOrUpdateLinkOverlay(element, data)
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
}
