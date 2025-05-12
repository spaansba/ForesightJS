// ForesightDebugger.ts
import type { ForesightManager } from "../Manager/ForesightManager"
import { DebuggerControlPanel } from "./DebuggerControlPanel" // Import the new class
import type {
  ForesightElementData,
  ForesightElement,
  ForesightManagerProps,
  Point,
} from "../../types/types"

export class ForesightDebugger {
  private foresightManagerInstance: ForesightManager
  private shadowHost: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private debugContainer: HTMLElement | null = null // For overlays, trajectory, etc.
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
  private debugStyleElement: HTMLStyleElement | null = null

  private controlPanel: DebuggerControlPanel | null = null
  private lastElementData: Map<
    ForesightElement,
    { isHovering: boolean; isTrajectoryHit: boolean }
  > = new Map()

  constructor(intentManager: ForesightManager) {
    this.foresightManagerInstance = intentManager
    // Instantiate controlPanel here, but initialize it later when shadowRoot is available
    this.controlPanel = new DebuggerControlPanel(this.foresightManagerInstance)
  }

  public initialize(
    links: Map<ForesightElement, ForesightElementData>,
    currentSettings: ForesightManagerProps,
    currentPoint: Point,
    predictedPoint: Point
  ) {
    if (typeof window === "undefined") return
    this.cleanup()

    this.shadowHost = document.createElement("div")
    this.shadowHost.id = "jsforesight-debugger-shadow-host"
    this.shadowHost.style.pointerEvents = "none"
    document.body.appendChild(this.shadowHost)
    this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" })

    this.debugStyleElement = document.createElement("style")
    // ... (style content remains the same) ...
    this.debugStyleElement.textContent = `
      #jsforesight-debug-container { /* For on-page overlays */
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
      /* Styles for #jsforesight-debug-controls and its children are still needed here */
      #jsforesight-debug-controls {
        position: fixed; bottom: 10px; right: 10px;
        background-color: rgba(0, 0, 0, 0.75); color: white; padding: 12px;
        border-radius: 5px; font-family: Arial, sans-serif; font-size: 13px;
        z-index: 10001; pointer-events: auto; display: flex; flex-direction: column; gap: 8px;
        min-width: 300px; max-width: 350px;
      }
      .jsforesight-debugger-title-container {
        display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;
      }
      .jsforesight-debugger-title-container h3 { margin: 0; font-size: 15px; }
      #jsforesight-debug-controls label { display: flex; align-items: center; gap: 5px; cursor: pointer; }
      #jsforesight-debug-controls input[type="range"] { flex-grow: 1; margin: 0 5px; cursor: pointer;}
      #jsforesight-debug-controls input[type="checkbox"] { margin-right: 5px; cursor: pointer; }
      #jsforesight-debug-controls .control-row { display: flex; align-items: center; justify-content: space-between; }
      #jsforesight-debug-controls .control-row label { flex-basis: auto; }
      #jsforesight-debug-controls .control-row span:not(.jsforesight-info-icon) { min-width: 30px; text-align: right; }
      .jsforesight-info-icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 16px; height: 16px; border-radius: 50%;
        background-color: #555; color: white;
        font-size: 10px; font-style: italic; font-weight: bold;
        font-family: 'Georgia', serif;
        cursor: help; user-select: none;
        flex-shrink: 0;
      }
      .jsforesight-debugger-section {
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid #444;
      }
      .jsforesight-debugger-section h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: bold;
      }
      .jsforesight-element-list {
        max-height: 150px;
        overflow-y: auto;
        background-color: rgba(20, 20, 20, 0.5);
        border-radius: 3px;
        padding: 5px;
        font-size: 12px;
      }
      .jsforesight-element-list-item {
        padding: 4px 6px;
        margin-bottom: 3px;
        border-radius: 2px;
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: rgba(50,50,50,0.7);
        transition: background-color 0.2s ease;
      }
      .jsforesight-element-list-item:last-child {
        margin-bottom: 0;
      }
      .jsforesight-element-list-item .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #777;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
      }
      .jsforesight-element-list-item.hovering .status-indicator {
        background-color: oklch(83.7% 0.128 66.29 / 0.7);
      }
      .jsforesight-element-list-item.trajectory-hit .status-indicator {
        background-color: oklch(89.7% 0.196 126.665 / 0.7);
      }
      .jsforesight-element-list-item.hovering.trajectory-hit .status-indicator {
        background: linear-gradient(45deg, oklch(89.7% 0.196 126.665 / 0.7) 50%, oklch(83.7% 0.128 66.29 / 0.7) 50%);
      }
      .jsforesight-element-list-item .element-name {
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .jsforesight-element-list-item .element-details {
        font-size: 10px;
        color: #ccc;
        flex-shrink: 0;
      }
      .jsforesight-element-list-item .hit-behavior {
        font-size: 10px;
        color: #b0b0b0;
        margin-right: 5px;
        padding: 1px 3px;
        border-radius: 2px;
        background-color: rgba(0,0,0,0.2);
        flex-shrink: 0;
      }
    `
    this.shadowRoot.appendChild(this.debugStyleElement)

    this.debugContainer = document.createElement("div")
    this.debugContainer.id = "jsforesight-debug-container"
    this.shadowRoot.appendChild(this.debugContainer)

    this.debugPredictedMouseIndicator = document.createElement("div")
    this.debugPredictedMouseIndicator.className = "jsforesight-mouse-predicted"
    this.debugContainer.appendChild(this.debugPredictedMouseIndicator)

    this.debugTrajectoryLine = document.createElement("div")
    this.debugTrajectoryLine.className = "jsforesight-trajectory-line"
    this.debugContainer.appendChild(this.debugTrajectoryLine)

    // Initialize the control panel AND PASS THE SHADOW ROOT
    if (this.shadowRoot) {
      // Ensure shadowRoot is available
      this.controlPanel?.initialize(this.shadowRoot, currentSettings)
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

  // ... rest of the ForesightDebugger class ...
  public cleanup() {
    console.log("[ForesightDebugger] cleanup() called. All debug elements will be removed.")
    this.controlPanel?.cleanup()
    // No need to re-assign this.controlPanel to null here, as a new one is made in constructor
    // if ForesightDebugger is re-initialized. If only cleanup is called (e.g. debug off),
    // then the instance might still be around but its DOM is gone.

    this.shadowHost?.remove()
    this.shadowHost = null
    this.shadowRoot = null
    this.debugContainer = null

    this.debugLinkOverlays.clear()
    this.lastElementData.clear()
    this.debugPredictedMouseIndicator = null
    this.debugTrajectoryLine = null
    this.debugStyleElement = null
  }

  public createOrUpdateLinkOverlay(element: ForesightElement, newData: ForesightElementData) {
    if (!this.debugContainer || !this.shadowRoot) return

    this.lastElementData.set(element, {
      isHovering: newData.isHovering,
      isTrajectoryHit: newData.isTrajectoryHit,
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
    linkOverlay.classList.toggle("trajectory-hit", newData.isTrajectoryHit)
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
      nameLabel.style.top = `${rect.top - 22}px`
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
    const currentManagerElements = new Set(this.foresightManagerInstance.elements.keys())

    // Update or add overlays for currently registered elements
    this.foresightManagerInstance.elements.forEach((data, element) => {
      this.createOrUpdateLinkOverlay(element, data) // This also triggers controlPanel.refreshElementList
    })

    // Remove overlays for elements that are no longer in the manager
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

  public updateAllLinkVisuals(links: Map<ForesightElement, ForesightElementData>) {
    if (!this.shadowRoot || !this.debugContainer) return
    this.refreshDisplayedElements()
  }

  public updateTrajectoryVisuals(
    currentPoint: Point,
    predictedPoint: Point,
    enableMousePrediction: boolean
  ) {
    if (!this.shadowRoot || !this.debugContainer) return

    const hasRegisteredElements = this.foresightManagerInstance.elements.size > 0
    const showVisuals = enableMousePrediction && hasRegisteredElements

    if (this.debugPredictedMouseIndicator) {
      if (showVisuals && predictedPoint) {
        this.debugPredictedMouseIndicator.style.left = `${predictedPoint.x}px`
        this.debugPredictedMouseIndicator.style.top = `${predictedPoint.y}px`
        this.debugPredictedMouseIndicator.style.display = "block"
      } else {
        this.debugPredictedMouseIndicator.style.display = "none"
      }
    }

    if (this.debugTrajectoryLine) {
      if (showVisuals && currentPoint && predictedPoint) {
        const dx = predictedPoint.x - currentPoint.x
        const dy = predictedPoint.y - currentPoint.y

        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          this.debugTrajectoryLine.style.display = "none"
          return
        }

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
  }

  public updateControlsState(settings: ForesightManagerProps) {
    this.controlPanel?.updateControlsState(settings)
  }
}
