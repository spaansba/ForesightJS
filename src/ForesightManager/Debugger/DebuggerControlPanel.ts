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
  private controlPanelStyleElement: HTMLStyleElement | null = null // Added for panel-specific styles

  // References to input elements for easy state updates
  private trajectoryEnabledCheckbox: HTMLInputElement | null = null
  private tabEnabledCheckbox: HTMLInputElement | null = null
  private historySizeSlider: HTMLInputElement | null = null
  private historyValueSpan: HTMLSpanElement | null = null
  private predictionTimeSlider: HTMLInputElement | null = null
  private predictionValueSpan: HTMLSpanElement | null = null
  private throttleDelaySlider: HTMLInputElement | null = null
  private throttleValueSpan: HTMLSpanElement | null = null
  private tabOffsetSlider: HTMLInputElement | null = null
  private tabOffsetValueSpan: HTMLSpanElement | null = null

  // For minimize functionality
  private minimizeButton: HTMLButtonElement | null = null
  private debuggerSettingsSection: HTMLElement | null = null // The section with controls
  private debuggerElementsSection: HTMLElement | null = null // The section with the element list
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

    if (this.controlsContainer && this.shadowRoot) {
      // Append the control panel's styles first
      this.controlPanelStyleElement = document.createElement("style")
      this.controlPanelStyleElement.textContent = this._getStyles()
      this.shadowRoot.appendChild(this.controlPanelStyleElement)

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

    let controlsHTML = `
      <div class="jsforesight-debugger-title-container">
        <button class="jsforesight-minimize-button">-</button>
        <h2>Foresight Debugger</h2>
        <span class="jsforesight-info-icon" title="Changes made here are for the current session only and won't persist. Update initial values in the ForesightManager.initialize() props for permanent changes.">i</span>
      </div>

      <div class="jsforesight-debugger-section jsforesight-debugger-settings">
        <div>
        <h3>Session Settings</h3>
        </div>
        <div class="control-grid">
          <p>MouseSettings</p>
          <div class="control-row">
            <label for="jsforesight-trajectory-enabled">
              Enable Mouse Prediction
              <span class="jsforesight-info-icon" title="Toggles mouse movement prediction. If disabled, only direct hovers trigger actions (or tab if enabled).">i</span>
            </label>
            <input type="checkbox" id="jsforesight-trajectory-enabled">
          </div>
           <div class="control-row">
            <label for="jsforesight-tab-enabled">
              Enable Tab Prediction
              <span class="jsforesight-info-icon" title="Toggles tab prediction.">i</span>
            </label>
            <input type="checkbox" id="jsforesight-tab-enabled">
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
           <div class="control-row">
            <label for="jsforesight-tab-offset">
              Tab Prediction Offset
              <span class="jsforesight-info-icon" title="Number of next/previous tabbable elements to consider for prediction when using the Tab key (Min: 0, Max: 10).">i</span>
            </label>
            <input type="range" id="jsforesight-tab-offset" min="0" max="10">
            <span id="jsforesight-tab-offset-value"></span>
          </div>
        </div>
      </div>
      `
    controlsHTML += `
      <div class="jsforesight-debugger-section jsforesight-debugger-elements">
        <h3>Registered Elements (<span id="jsforesight-element-count">0</span>)</h3>
        <div id="jsforesight-element-list-items-container" class="jsforesight-element-list">
          <em>Initializing...</em>
        </div>
      </div>
    </div>
    `

    this.controlsContainer.innerHTML = controlsHTML
  }

  private _getStyles(): string {
    return `
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
      .jsforesight-minimize-button{
        background: none; border: none; color: white;
        font-size: 22px; cursor: pointer; padding: 0;
        position: absolute; top: 10px; left: 15px;
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
        display: flex; flex-direction: column; gap: 6px;
        border-top: 1px solid #444;
      }
      .jsforesight-debugger-section h4 {
        margin: 5px 0 2px 0;
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
  }

  private _queryDOMElements() {
    if (!this.controlsContainer) return

    this.trajectoryEnabledCheckbox = this.controlsContainer.querySelector(
      "#jsforesight-trajectory-enabled"
    )
    this.tabEnabledCheckbox = this.controlsContainer.querySelector("#jsforesight-tab-enabled")
    this.historySizeSlider = this.controlsContainer.querySelector("#jsforesight-history-size")
    this.historyValueSpan = this.controlsContainer.querySelector("#jsforesight-history-value")
    this.predictionTimeSlider = this.controlsContainer.querySelector("#jsforesight-prediction-time")
    this.predictionValueSpan = this.controlsContainer.querySelector("#jsforesight-prediction-value")
    this.throttleDelaySlider = this.controlsContainer.querySelector("#jsforesight-throttle-delay")
    this.throttleValueSpan = this.controlsContainer.querySelector("#jsforesight-throttle-value")
    this.tabOffsetSlider = this.controlsContainer.querySelector("#jsforesight-tab-offset")
    this.tabOffsetValueSpan = this.controlsContainer.querySelector("#jsforesight-tab-offset-value")
    this.elementListContainer = this.controlsContainer.querySelector(
      "#jsforesight-element-list-items-container"
    )
    this.elementCountSpan = this.controlsContainer.querySelector("#jsforesight-element-count")

    // Query elements for minimize functionality
    this.minimizeButton = this.controlsContainer.querySelector(".jsforesight-minimize-button")
    this.debuggerSettingsSection = this.controlsContainer.querySelector(
      ".jsforesight-debugger-settings"
    )
    this.debuggerElementsSection = this.controlsContainer.querySelector(
      ".jsforesight-debugger-elements"
    )
  }

  private _setupEventListeners() {
    this.trajectoryEnabledCheckbox?.addEventListener("change", (e) => {
      this.foresightManagerInstance.alterGlobalSettings({
        enableMousePrediction: (e.target as HTMLInputElement).checked,
      })
    })

    this.tabEnabledCheckbox?.addEventListener("change", (e) => {
      this.foresightManagerInstance.alterGlobalSettings({
        enableTabPrediction: (e.target as HTMLInputElement).checked,
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

    this.tabOffsetSlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      if (this.tabOffsetValueSpan) this.tabOffsetValueSpan.textContent = value.toString()
      this.foresightManagerInstance.alterGlobalSettings({
        tabOffset: value,
      })
    })

    // Add event listener for the minimize button
    this.minimizeButton?.addEventListener("click", () => {
      this.isMinimized = !this.isMinimized
      this._applyMinimizedStateVisuals()
    })
  }

  private _applyMinimizedStateVisuals() {
    if (
      !this.minimizeButton ||
      !this.debuggerSettingsSection ||
      !this.debuggerElementsSection ||
      !this.controlsContainer
    )
      return

    if (this.isMinimized) {
      this.debuggerSettingsSection.style.display = "none"
      this.debuggerElementsSection.style.display = "none"
      this.minimizeButton.textContent = "+"
      // Optional: Add a class to controlsContainer for more specific styling if needed
      // this.controlsContainer.classList.add("minimized")
    } else {
      this.debuggerSettingsSection.style.display = "" // Reset to default
      this.debuggerElementsSection.style.display = "" // Reset to default
      this.minimizeButton.textContent = "-"
      // Optional: Remove the class
      // this.controlsContainer.classList.remove("minimized")
    }
  }

  public updateControlsState(settings: ForesightManagerProps) {
    if (this.trajectoryEnabledCheckbox) {
      this.trajectoryEnabledCheckbox.checked = settings.enableMousePrediction
    }
    if (this.tabEnabledCheckbox) {
      this.tabEnabledCheckbox.checked = settings.enableTabPrediction
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
    if (this.tabOffsetSlider && this.tabOffsetValueSpan) {
      this.tabOffsetSlider.value = settings.tabOffset.toString()
      this.tabOffsetValueSpan.textContent = settings.tabOffset.toString()
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
    this.controlPanelStyleElement?.remove()
    this.controlPanelStyleElement = null

    this.elementCountSpan = null
    this.elementListItems.clear()

    // Clear references for minimize functionality
    this.minimizeButton = null
    this.debuggerSettingsSection = null
    this.debuggerElementsSection = null
    // Event listeners are on elements within controlsContainer, so they'll be GC'd.
  }
}
