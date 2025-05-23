// DebuggerControlPanel.ts
import type { ForesightManager } from "../Manager/ForesightManager"
import type {
  ForesightElementData,
  ForesightElement,
  ForesightManagerProps,
  DebuggerSettings,
} from "../../types/types"

export class DebuggerControlPanel {
  private foresightManagerInstance: ForesightManager
  private shadowRoot: ShadowRoot | null = null
  private controlsContainer: HTMLElement | null = null
  private elementListContainer: HTMLElement | null = null
  private elementCountSpan: HTMLSpanElement | null = null
  private elementListItems: Map<ForesightElement, HTMLElement> = new Map()

  // References to input elements for easy state updates
  private trajectoryEnabledCheckbox: HTMLInputElement | null = null
  private historySizeSlider: HTMLInputElement | null = null
  private historyValueSpan: HTMLSpanElement | null = null
  private predictionTimeSlider: HTMLInputElement | null = null
  private predictionValueSpan: HTMLSpanElement | null = null
  private throttleDelaySlider: HTMLInputElement | null = null
  private throttleValueSpan: HTMLSpanElement | null = null

  // For minimize functionality
  private minimizeButton: HTMLButtonElement | null = null
  private debuggerSection: HTMLElement | null = null // Contains the element list
  private isMinimized: boolean = false

  constructor(manager: ForesightManager) {
    this.foresightManagerInstance = manager
  }

  public initialize(
    shadowRoot: ShadowRoot,
    initialSettings: ForesightManagerProps,
    debuggerSettings: DebuggerSettings
  ) {
    this.shadowRoot = shadowRoot
    this._createDOM() // Create and append the panel's HTML structure

    if (debuggerSettings.isControlPanelDefaultMinimized) {
      this.isMinimized = true
    }

    if (this.controlsContainer) {
      this.shadowRoot.appendChild(this.controlsContainer)
      this._queryDOMElements()
      this._setupEventListeners()
      this.updateControlsState(initialSettings)
      this.refreshElementList()
      this._applyMinimizedStateVisuals() // Ensure initial state is applied
    }
  }

  private _createDOM() {
    this.controlsContainer = document.createElement("div")
    this.controlsContainer.id = "jsforesight-debug-controls" // Use existing ID for styles

    // Note: The minimize button already exists in your HTML structure
    let controlsHTML = `
      <div class="jsforesight-debugger-title-container">
        <button class="jsforesight-minimize-button">-</button>
        <h3>Foresight Debugger</h3>
        <span class="jsforesight-info-icon" title="Changes made here are for the current session only and won't persist. Update initial values in the ForesightManager.initialize() props for permanent changes.">i</span>
      </div>

      <div class="jsforesight-debugger-section">
        <h4>Session Settings</h4>
        <div class="control-row">
          <label for="jsforesight-trajectory-enabled">
            Enable Mouse Prediction
            <span class="jsforesight-info-icon" title="Toggles mouse movement prediction. If disabled, only direct hovers trigger actions.">i</span>
          </label>
          <input type="checkbox" id="jsforesight-trajectory-enabled">
        </div>
        <div class="control-row">
          <label for="jsforesight-history-size">
            History Size
            <span class="jsforesight-info-icon" title="Number of past mouse positions for velocity calculation (Min: 2, Max: 20). Higher values smooth predictions but add latency.">i</span>
          </label>
          <input type="range" id="jsforesight-history-size" min="2" max="20">
          <span id="jsforesight-history-value"></span>
        </div>
        <div class="control-row">
          <label for="jsforesight-prediction-time">
            Prediction Time (ms)
            <span class="jsforesight-info-icon" title="How far (ms) to project trajectory (Min: 10, Max: 500). Larger values detect intent sooner.">i</span>
          </label>
          <input type="range" id="jsforesight-prediction-time" min="10" max="500" step="10">
          <span id="jsforesight-prediction-value"></span>
        </div>
        <div class="control-row">
          <label for="jsforesight-throttle-delay">
            Scroll/Resize Throttle (ms)
            <span class="jsforesight-info-icon" title="Delay (ms) for recalculating element positions on resize/scroll (Min: 0, Max: 500). Higher values improve performance during rapid events.">i</span>
          </label>
          <input type="range" id="jsforesight-throttle-delay" min="0" max="500" step="10">
          <span id="jsforesight-throttle-value"></span>
        </div>
      `
    controlsHTML += `
      <div class="jsforesight-debugger-section">
        <h4>Registered Elements (<span id="jsforesight-element-count">0</span>)</h4>
        <div id="jsforesight-element-list-items-container" class="jsforesight-element-list">
          <em>Initializing...</em>
        </div>
      </div>
    </div>
    `

    this.controlsContainer.innerHTML = controlsHTML
  }

  private _queryDOMElements() {
    if (!this.controlsContainer) return

    this.trajectoryEnabledCheckbox = this.controlsContainer.querySelector(
      "#jsforesight-trajectory-enabled"
    )
    this.historySizeSlider = this.controlsContainer.querySelector("#jsforesight-history-size")
    this.historyValueSpan = this.controlsContainer.querySelector("#jsforesight-history-value")
    this.predictionTimeSlider = this.controlsContainer.querySelector("#jsforesight-prediction-time")
    this.predictionValueSpan = this.controlsContainer.querySelector("#jsforesight-prediction-value")
    this.throttleDelaySlider = this.controlsContainer.querySelector("#jsforesight-throttle-delay")
    this.throttleValueSpan = this.controlsContainer.querySelector("#jsforesight-throttle-value")
    this.elementListContainer = this.controlsContainer.querySelector(
      "#jsforesight-element-list-items-container"
    )
    this.elementCountSpan = this.controlsContainer.querySelector("#jsforesight-element-count")

    // Query elements for minimize functionality
    this.minimizeButton = this.controlsContainer.querySelector(".jsforesight-minimize-button")
    this.debuggerSection = this.controlsContainer.querySelector(".jsforesight-debugger-section")
  }

  private _setupEventListeners() {
    this.trajectoryEnabledCheckbox?.addEventListener("change", (e) => {
      this.foresightManagerInstance.alterGlobalSettings({
        enableMousePrediction: (e.target as HTMLInputElement).checked,
      })
    })

    this.historySizeSlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      if (this.historyValueSpan) this.historyValueSpan.textContent = value.toString()
      this.foresightManagerInstance.alterGlobalSettings({
        positionHistorySize: value,
      })
    })

    this.predictionTimeSlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      if (this.predictionValueSpan) this.predictionValueSpan.textContent = value.toString()
      this.foresightManagerInstance.alterGlobalSettings({
        trajectoryPredictionTime: value,
      })
    })

    this.throttleDelaySlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      if (this.throttleValueSpan) this.throttleValueSpan.textContent = value.toString()
      this.foresightManagerInstance.alterGlobalSettings({
        resizeScrollThrottleDelay: value,
      })
    })

    // Add event listener for the minimize button
    this.minimizeButton?.addEventListener("click", () => {
      this.isMinimized = !this.isMinimized
      this._applyMinimizedStateVisuals()
    })
  }

  private _applyMinimizedStateVisuals() {
    if (!this.minimizeButton || !this.debuggerSection || !this.controlsContainer) return

    if (this.isMinimized) {
      this.debuggerSection.style.display = "none"
      this.minimizeButton.textContent = "+"
      // Optional: Add a class to controlsContainer for more specific styling if needed
      // this.controlsContainer.classList.add("minimized")
    } else {
      this.debuggerSection.style.display = "" // Reset to default
      this.minimizeButton.textContent = "-"
      // Optional: Remove the class
      // this.controlsContainer.classList.remove("minimized")
    }
  }

  public updateControlsState(settings: ForesightManagerProps) {
    if (this.trajectoryEnabledCheckbox) {
      this.trajectoryEnabledCheckbox.checked = settings.enableMousePrediction
    }
    if (this.historySizeSlider && this.historyValueSpan) {
      this.historySizeSlider.value = settings.positionHistorySize.toString()
      this.historyValueSpan.textContent = settings.positionHistorySize.toString()
    }
    if (this.predictionTimeSlider && this.predictionValueSpan) {
      this.predictionTimeSlider.value = settings.trajectoryPredictionTime.toString()
      this.predictionValueSpan.textContent = settings.trajectoryPredictionTime.toString()
    }
    if (this.throttleDelaySlider && this.throttleValueSpan) {
      this.throttleDelaySlider.value = settings.resizeScrollThrottleDelay.toString()
      this.throttleValueSpan.textContent = settings.resizeScrollThrottleDelay.toString()
    }
  }

  public refreshElementList() {
    if (!this.elementListContainer) return

    this.elementListContainer.innerHTML = "" // Clear previous items
    this.elementListItems.clear()

    const elementsMap = this.foresightManagerInstance.elements

    if (this.elementCountSpan) {
      this.elementCountSpan.textContent = elementsMap.size.toString()
    }

    if (elementsMap.size === 0) {
      this.elementListContainer.innerHTML = "<em>No elements registered.</em>"
      return
    }

    elementsMap.forEach((data, element) => {
      const listItem = document.createElement("div")
      listItem.className = "jsforesight-element-list-item"
      this._updateListItemContent(listItem, data)

      this.elementListContainer!.appendChild(listItem)
      this.elementListItems.set(element, listItem)
    })
  }

  private _updateListItemContent(listItem: HTMLElement, data: ForesightElementData) {
    listItem.classList.toggle("hovering", data.isHovering)
    listItem.classList.toggle("trajectory-hit", data.trajectoryHitData.isTrajectoryHit)

    const statusIndicatorHTML = `<span class="status-indicator"></span>`
    const hitBehaviorText = data.unregisterOnCallback ? "Single" : "Multi"
    const hitBehaviorTitle = data.unregisterOnCallback
      ? "Callback triggers once, then element unregisters."
      : "Callback can trigger multiple times."

    listItem.innerHTML = `
      ${statusIndicatorHTML}
      <span class="element-name" title="${data.name || "Unnamed Element"}">${
      data.name || "Unnamed Element"
    }</span>
      <span class="hit-behavior" title="${hitBehaviorTitle}">${hitBehaviorText}</span>
      <span class="element-details">(H: ${data.isHovering ? "Y" : "N"}, T: ${
      data.trajectoryHitData.isTrajectoryHit ? "Y" : "N"
    })</span>
    `
  }

  public cleanup() {
    this.controlsContainer?.remove()
    this.controlsContainer = null
    this.elementListContainer = null
    this.elementCountSpan = null
    this.elementListItems.clear()

    // Clear references for minimize functionality
    this.minimizeButton = null
    this.debuggerSection = null
    // Event listeners are on elements within controlsContainer, so they'll be GC'd.
  }
}
