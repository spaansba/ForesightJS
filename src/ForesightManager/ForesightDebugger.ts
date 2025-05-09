"use client"
import type { ForesightManager } from "./ForesightManager"
import type { ElementData, ForesightElement, ForesightManagerProps, Point } from "../types/types"

export class ForesightDebugger {
  private foresightManagerInstance: ForesightManager
  private shadowHost: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private debugContainer: HTMLElement | null = null
  private debugLinkOverlays: Map<
    ForesightElement,
    { linkOverlay: HTMLElement; expandedOverlay: HTMLElement }
  > = new Map()
  private debugPredictedMouseIndicator: HTMLElement | null = null
  private debugTrajectoryLine: HTMLElement | null = null
  private debugControlsContainer: HTMLElement | null = null
  private debugStyleElement: HTMLStyleElement | null = null

  constructor(intentManager: ForesightManager) {
    this.foresightManagerInstance = intentManager
  }

  public initialize(
    links: Map<ForesightElement, ElementData>,
    currentSettings: ForesightManagerProps,
    currentPoint: Point,
    predictedPoint: Point
  ): void {
    if (typeof window === "undefined") return
    this.cleanup()

    this.shadowHost = document.createElement("div")
    this.shadowHost.id = "jsforesight-debugger-shadow-host"
    this.shadowHost.style.pointerEvents = "none"
    document.body.appendChild(this.shadowHost)
    this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" })

    this.debugStyleElement = document.createElement("style")
    this.debugStyleElement.textContent = `
      #jsforesight-debug-container {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 9999;
      }
      .jsforesight-link-overlay {
        position: absolute; border: 2px solid blue;
        background-color: rgba(0, 0, 255, 0.1); box-sizing: border-box;
        transition: opacity 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
      }
      .jsforesight-link-overlay.active {
        border-color: red; background-color: rgba(255, 0, 0, 0.1);
      }
      .jsforesight-link-overlay.trajectory-hit {
        border-color: lime; background-color: rgba(0, 255, 0, 0.3);
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
      }
      .jsforesight-expanded-overlay {
        position: absolute; border: 1px dashed rgba(0, 0, 255, 0.5);
        background-color: rgba(0, 0, 255, 0.05); box-sizing: border-box;
      }
      .jsforesight-mouse-predicted {
        position: absolute; width: 20px; height: 20px; border-radius: 50%;
        border: 2px solid orange; background-color: rgba(255, 165, 0, 0.3);
        transform: translate(-50%, -50%); z-index: 10000;
      }
      .jsforesight-trajectory-line {
        position: absolute; height: 2px; background-color: rgba(255, 100, 0, 0.5);
        transform-origin: left center; z-index: 9999;
      }
      #jsforesight-debug-controls {
        position: fixed; bottom: 10px; right: 10px;
        background-color: rgba(0, 0, 0, 0.75); color: white; padding: 12px;
        border-radius: 5px; font-family: Arial, sans-serif; font-size: 13px;
        z-index: 10001; pointer-events: auto; display: flex; flex-direction: column; gap: 8px;
        min-width: 300px; /* Ensure enough space for title and icon */
      }
      .jsforesight-debugger-title-container {
        display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;
      }
      .jsforesight-debugger-title-container h3 { margin: 0; font-size: 15px; }
      #jsforesight-debug-controls label { display: flex; align-items: center; gap: 5px; cursor: pointer; }
      #jsforesight-debug-controls input[type="range"] { flex-grow: 1; margin: 0 5px; cursor: pointer;}
      #jsforesight-debug-controls input[type="checkbox"] { margin-right: 5px; cursor: pointer; }
      #jsforesight-debug-controls .control-row { display: flex; align-items: center; justify-content: space-between; }
      #jsforesight-debug-controls .control-row label { flex-basis: auto; /* Adjust for better spacing */ }
      #jsforesight-debug-controls .control-row span:not(.jsforesight-info-icon) { min-width: 30px; text-align: right; }
      .jsforesight-info-icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 16px; height: 16px; border-radius: 50%;
        background-color: #555; color: white;
        font-size: 10px; font-style: italic; font-weight: bold;
        font-family: 'Georgia', serif;
        cursor: help; user-select: none;
        flex-shrink: 0; /* Prevent icon from shrinking */
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

    this.createDebugControls(currentSettings)

    links.forEach((data, element) => {
      this.createOrUpdateLinkOverlay(element, data)
    })
    this.updateTrajectoryVisuals(
      currentPoint,
      predictedPoint,
      currentSettings.enableMouseTrajectory
    )
  }

  public cleanup(): void {
    this.shadowHost?.remove()
    this.shadowHost = null
    this.shadowRoot = null
    this.debugLinkOverlays.clear()
  }

  public createOrUpdateLinkOverlay(element: ForesightElement, elementData: ElementData): void {
    if (!this.debugContainer || !this.shadowRoot) return

    let overlays = this.debugLinkOverlays.get(element)
    if (!overlays) {
      const linkOverlay = document.createElement("div")
      linkOverlay.className = "jsforesight-link-overlay"
      this.debugContainer.appendChild(linkOverlay)

      const expandedOverlay = document.createElement("div")
      expandedOverlay.className = "jsforesight-expanded-overlay"
      this.debugContainer.appendChild(expandedOverlay)

      overlays = { linkOverlay, expandedOverlay }
      this.debugLinkOverlays.set(element, overlays)
    }

    const { linkOverlay, expandedOverlay } = overlays
    const rect = element.getBoundingClientRect()

    linkOverlay.style.left = `${rect.left}px`
    linkOverlay.style.top = `${rect.top}px`
    linkOverlay.style.width = `${rect.width}px`
    linkOverlay.style.height = `${rect.height}px`

    linkOverlay.classList.toggle("trajectory-hit", elementData.isTrajectoryHit)
    linkOverlay.classList.toggle("active", elementData.isHovering)

    if (elementData.elementBounds.expandedRect) {
      expandedOverlay.style.left = `${elementData.elementBounds.expandedRect.left}px`
      expandedOverlay.style.top = `${elementData.elementBounds.expandedRect.top}px`
      expandedOverlay.style.width = `${
        elementData.elementBounds.expandedRect.right - elementData.elementBounds.expandedRect.left
      }px`
      expandedOverlay.style.height = `${
        elementData.elementBounds.expandedRect.bottom - elementData.elementBounds.expandedRect.top
      }px`
      expandedOverlay.style.display = "block"
    } else {
      expandedOverlay.style.display = "none"
    }
  }

  public removeLinkOverlay(element: ForesightElement): void {
    const overlays = this.debugLinkOverlays.get(element)
    if (overlays) {
      overlays.linkOverlay.remove()
      overlays.expandedOverlay.remove()
      this.debugLinkOverlays.delete(element)
    }
  }

  public updateAllLinkVisuals(links: Map<ForesightElement, ElementData>): void {
    if (!this.shadowRoot || !this.debugContainer) return

    const currentElements = new Set(links.keys())
    this.debugLinkOverlays.forEach((_, element) => {
      if (!currentElements.has(element)) {
        this.removeLinkOverlay(element)
      }
    })

    links.forEach((data, element) => {
      this.createOrUpdateLinkOverlay(element, data)
    })
  }

  public updateTrajectoryVisuals(
    currentPoint: Point,
    predictedPoint: Point,
    enableMouseTrajectory: boolean
  ): void {
    if (!this.shadowRoot || !this.debugContainer) return

    if (this.debugPredictedMouseIndicator) {
      this.debugPredictedMouseIndicator.style.left = `${predictedPoint?.x || 0}px`
      this.debugPredictedMouseIndicator.style.top = `${predictedPoint?.y || 0}px`
      this.debugPredictedMouseIndicator.style.display =
        enableMouseTrajectory && predictedPoint ? "block" : "none"
    }

    if (this.debugTrajectoryLine) {
      if (enableMouseTrajectory && currentPoint && predictedPoint) {
        const dx = predictedPoint.x - currentPoint.x
        const dy = predictedPoint.y - currentPoint.y
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

  private createDebugControls(initialSettings: ForesightManagerProps): void {
    if (!this.shadowRoot) return

    this.debugControlsContainer = document.createElement("div")
    this.debugControlsContainer.id = "jsforesight-debug-controls"
    this.shadowRoot.appendChild(this.debugControlsContainer)

    this.debugControlsContainer.innerHTML = `
      <div class="jsforesight-debugger-title-container">
        <h3>Foresight Debugger</h3>
        <span class="jsforesight-info-icon" title="Changes made here are for the current session only and won't persist. Update initial values in the ForesightManager.initialize() props for permanent changes.">i</span>
      </div>
      <div class="control-row">
        <label for="jsforesight-trajectory-enabled">
          Enable Trajectory
          <span class="jsforesight-info-icon" title="Toggles mouse movement prediction. If disabled, only direct hovers trigger actions.">i</span>
        </label>
        <input type="checkbox" id="jsforesight-trajectory-enabled" ${
          initialSettings.enableMouseTrajectory ? "checked" : ""
        }>
      </div>
      <div class="control-row">
        <label for="jsforesight-history-size">
          History Size
          <span class="jsforesight-info-icon" title="Number of past mouse positions for velocity calculation (Min: 2, Max: 20). Higher values smooth predictions but add latency.">i</span>
        </label>
        <input type="range" id="jsforesight-history-size" min="2" max="20" value="${
          initialSettings.positionHistorySize
        }">
        <span id="jsforesight-history-value">${initialSettings.positionHistorySize}</span>
      </div>
      <div class="control-row">
        <label for="jsforesight-prediction-time">
          Prediction Time (ms)
          <span class="jsforesight-info-icon" title="How far (ms) to project trajectory (Min: 10, Max: 500). Larger values detect intent sooner.">i</span>
        </label>
        <input type="range" id="jsforesight-prediction-time" min="10" max="500" step="10" value="${
          initialSettings.trajectoryPredictionTime
        }">
        <span id="jsforesight-prediction-value">${initialSettings.trajectoryPredictionTime}</span>
      </div>
      <div class="control-row">
        <label for="jsforesight-throttle-delay">
          Scroll/Resize Throttle (ms)
          <span class="jsforesight-info-icon" title="Delay (ms) for recalculating element positions on resize/scroll (Min: 0, Max: 500). Higher values improve performance during rapid events.">i</span>
        </label>
        <input type="range" id="jsforesight-throttle-delay" min="0" max="500" step="10" value="${
          initialSettings.resizeScrollThrottleDelay
        }">
        <span id="jsforesight-throttle-value">${initialSettings.resizeScrollThrottleDelay}</span>
      </div>
    `

    const enabledCheckbox = this.debugControlsContainer.querySelector(
      "#jsforesight-trajectory-enabled"
    ) as HTMLInputElement
    enabledCheckbox.addEventListener("change", () => {
      this.foresightManagerInstance.alterGlobalSettings({
        enableMouseTrajectory: enabledCheckbox.checked,
      })
    })

    const historySlider = this.debugControlsContainer.querySelector(
      "#jsforesight-history-size"
    ) as HTMLInputElement
    const historyValueSpan = this.debugControlsContainer.querySelector(
      "#jsforesight-history-value"
    ) as HTMLSpanElement
    historySlider.addEventListener("input", () => {
      const value = parseInt(historySlider.value)
      historyValueSpan.textContent = value.toString()
      this.foresightManagerInstance.alterGlobalSettings({
        positionHistorySize: value,
      })
    })

    const predictionSlider = this.debugControlsContainer.querySelector(
      "#jsforesight-prediction-time"
    ) as HTMLInputElement
    const predictionValueSpan = this.debugControlsContainer.querySelector(
      "#jsforesight-prediction-value"
    ) as HTMLSpanElement
    predictionSlider.addEventListener("input", () => {
      const value = parseInt(predictionSlider.value)
      predictionValueSpan.textContent = value.toString()
      this.foresightManagerInstance.alterGlobalSettings({
        trajectoryPredictionTime: value,
      })
    })

    const throttleSlider = this.debugControlsContainer.querySelector(
      "#jsforesight-throttle-delay"
    ) as HTMLInputElement
    const throttleValueSpan = this.debugControlsContainer.querySelector(
      "#jsforesight-throttle-value"
    ) as HTMLSpanElement
    throttleSlider.addEventListener("input", () => {
      const value = parseInt(throttleSlider.value)
      throttleValueSpan.textContent = value.toString()
      this.foresightManagerInstance.alterGlobalSettings({
        resizeScrollThrottleDelay: value,
      })
    })
  }

  public updateControlsState(settings: ForesightManagerProps): void {
    if (!this.debugControlsContainer) return

    const enabledCheckbox = this.debugControlsContainer.querySelector(
      "#jsforesight-trajectory-enabled"
    ) as HTMLInputElement
    if (enabledCheckbox) enabledCheckbox.checked = settings.enableMouseTrajectory

    const historySlider = this.debugControlsContainer.querySelector(
      "#jsforesight-history-size"
    ) as HTMLInputElement
    const historyValueSpan = this.debugControlsContainer.querySelector(
      "#jsforesight-history-value"
    ) as HTMLSpanElement
    if (historySlider && historyValueSpan) {
      historySlider.value = settings.positionHistorySize.toString()
      historyValueSpan.textContent = settings.positionHistorySize.toString()
    }

    const predictionSlider = this.debugControlsContainer.querySelector(
      "#jsforesight-prediction-time"
    ) as HTMLInputElement
    const predictionValueSpan = this.debugControlsContainer.querySelector(
      "#jsforesight-prediction-value"
    ) as HTMLSpanElement
    if (predictionSlider && predictionValueSpan) {
      predictionSlider.value = settings.trajectoryPredictionTime.toString()
      predictionValueSpan.textContent = settings.trajectoryPredictionTime.toString()
    }

    const throttleSlider = this.debugControlsContainer.querySelector(
      "#jsforesight-throttle-delay"
    ) as HTMLInputElement
    const throttleValueSpan = this.debugControlsContainer.querySelector(
      "#jsforesight-throttle-value"
    ) as HTMLSpanElement
    if (throttleSlider && throttleValueSpan) {
      throttleSlider.value = settings.resizeScrollThrottleDelay.toString()
      throttleValueSpan.textContent = settings.resizeScrollThrottleDelay.toString()
    }
  }
}
