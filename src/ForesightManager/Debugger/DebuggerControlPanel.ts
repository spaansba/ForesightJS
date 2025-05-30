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
  private controlPanelStyleElement: HTMLStyleElement | null = null

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

  private minimizeButton: HTMLButtonElement | null = null
  private debuggerSettingsSection: HTMLElement | null = null
  private debuggerElementsSection: HTMLElement | null = null
  private isMinimized: boolean = false

  private mouseSettingsSection: HTMLElement | null = null
  private mouseSettingsMinimizeButton: HTMLButtonElement | null = null
  private keyboardSettingsSection: HTMLElement | null = null
  private keyboardSettingsMinimizeButton: HTMLButtonElement | null = null
  private elementsListSection: HTMLElement | null = null
  private elementsListMinimizeButton: HTMLButtonElement | null = null

  private isMouseSettingsMinimized: boolean = false
  private isKeyboardSettingsMinimized: boolean = false
  private isElementsListMinimized: boolean = false

  constructor(manager: ForesightManager) {
    this.foresightManagerInstance = manager
  }

  public initialize(
    shadowRoot: ShadowRoot,
    initialSettings: ForesightManagerProps,
    debuggerSettings: DebuggerSettings
  ) {
    this.shadowRoot = shadowRoot
    this._createDOM()

    if (debuggerSettings.isControlPanelDefaultMinimized) {
      this.isMinimized = true
    }

    if (this.controlsContainer && this.shadowRoot) {
      this.controlPanelStyleElement = document.createElement("style")
      this.controlPanelStyleElement.textContent = this._getStyles()
      this.shadowRoot.appendChild(this.controlPanelStyleElement)

      this.shadowRoot.appendChild(this.controlsContainer)
      this._queryDOMElements()
      this._setupEventListeners()
      this.updateControlsState(initialSettings)
      this.refreshElementList()
      this._applyMinimizedStateVisuals()
      this._applySectionMinimizedStateVisuals()
    }
  }

  private _createDOM() {
    this.controlsContainer = document.createElement("div")
    this.controlsContainer.id = "jsforesight-debug-controls"

    let controlsHTML = `
      <div class="jsforesight-debugger-title-container">
        <button class="jsforesight-minimize-button">-</button>
        <h2>Foresight Debugger</h2>
        <span class="jsforesight-info-icon" title="Changes made here are for the current session only and won't persist. Update initial values in the ForesightManager.initialize() props for permanent changes.">i</span>
      </div>

      <div class="jsforesight-debugger-section jsforesight-debugger-settings">
        <div class="jsforesight-debugger-section-header mouse-settings-header">
          <h3>Mouse Settings</h3>
          <button class="jsforesight-section-minimize-button">-</button>
        </div>
        <div class="jsforesight-debugger-section-content jsforesight-mouse-settings">
          <div class="control-row">
            <label for="jsforesight-trajectory-enabled">
              Enable Mouse Prediction
              <span class="jsforesight-info-icon" title="Toggles mouse movement prediction. If disabled, only direct hovers trigger actions (or tab if enabled).">i</span>
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
              Prediction Time
              <span class="jsforesight-info-icon" title="How far (ms) to project trajectory (Min: 10, Max: 500). Larger values detect intent sooner.">i</span>
            </label>
            <input type="range" id="jsforesight-prediction-time" min="10" max="500" step="10">
            <span id="jsforesight-prediction-value"></span>
          </div>
          <div class="control-row">
            <label for="jsforesight-throttle-delay">
              Scroll/Resize Throttle
              <span class="jsforesight-info-icon" title="Delay (ms) for recalculating element positions on resize/scroll (Min: 0, Max: 500). Higher values improve performance during rapid events.">i</span>
            </label>
            <input type="range" id="jsforesight-throttle-delay" min="0" max="500" step="10">
            <span id="jsforesight-throttle-value"></span>
          </div>
        </div>

        <div class="jsforesight-debugger-section-header keyboard-settings-header">
          <h3>Keyboard Settings</h3>
          <button class="jsforesight-section-minimize-button">-</button>
        </div>
        <div class="jsforesight-debugger-section-content jsforesight-keyboard-settings">
          <div class="control-row">
            <label for="jsforesight-tab-enabled">
              Enable Tab Prediction
              <span class="jsforesight-info-icon" title="Toggles tab prediction.">i</span>
            </label>
            <input type="checkbox" id="jsforesight-tab-enabled">
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
        <div class="jsforesight-debugger-section-header elements-list-header">
          <h3>Registered Elements (<span id="jsforesight-element-count">0</span>)</h3>
           <button class="jsforesight-section-minimize-button">-</button>
        </div>
        <div class="jsforesight-debugger-section-content jsforesight-element-list">
          <div id="jsforesight-element-list-items-container">
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
        width: 380px;
        transition: width 0.3s ease, height 0.3s ease;
      }
      #jsforesight-debug-controls.minimized {
        width: 220px;
        overflow: hidden;
        padding: 12px 0;
      }
      #jsforesight-debug-controls.minimized .jsforesight-debugger-title-container {
        justify-content: flex-start;
        padding-left: 10px;
        padding-right: 10px;
        gap: 10px;
      }
      #jsforesight-debug-controls.minimized .jsforesight-debugger-title-container h2 {
        display: inline;
        font-size: 14px;
        margin: 0;
        white-space: nowrap;
      }
      #jsforesight-debug-controls.minimized .jsforesight-info-icon {
        display: none;
      }
      #jsforesight-debug-controls.minimized .jsforesight-minimize-button {
         position: static;
         transform: none;
         margin-right: 0;
         padding: 0 3px;
         line-height: 1;
      }

      .jsforesight-debugger-title-container {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        position: relative;
      }
      .jsforesight-minimize-button {
        background: none; border: none; color: white;
        font-size: 22px; cursor: pointer; padding: 0 5px;
        line-height: 1;
        position: absolute;
        top: 50%;
        left: 10px;
        transform: translateY(-50%);
      }
      .jsforesight-debugger-title-container h2 { margin: 0; font-size: 15px; }

      .jsforesight-debugger-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 5px;
        margin-bottom: 2px;
        padding-bottom: 2px;
        border-bottom: 1px solid #444;
      }
      .jsforesight-debugger-section-header h3 {
         margin: 0;
         font-size: 14px;
         font-weight: bold;
         color: #b0c4de;
      }

      .jsforesight-section-minimize-button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      #jsforesight-debug-controls .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      #jsforesight-debug-controls label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
      }

      #jsforesight-debug-controls .control-row:has(input[type="checkbox"]) label {
        flex-grow: 1;
      }

      /* Modern Toggle Switch Styles */
      #jsforesight-debug-controls .control-row input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        position: relative;
        width: 40px;  /* Track width */
        height: 18px; /* Track height */
        background-color: #555;
        border-radius: 10px; /* (Track height / 2) */
        cursor: pointer;
        outline: none;
        transition: background-color 0.2s ease;
        vertical-align: middle;
        flex-shrink: 0;
        margin: 0; /* Rely on parent gap for spacing */
      }

      #jsforesight-debug-controls .control-row input[type="checkbox"]::before {
        content: "";
        position: absolute;
        width: 14px;  /* Thumb width */
        height: 14px; /* Thumb height */
        border-radius: 50%;
        background-color: white;
        top: 2px;  /* (Track height - Thumb height) / 2 */
        left: 2px; /* Padding from left */
        transition: transform 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }

      #jsforesight-debug-controls .control-row input[type="checkbox"]:checked {
        background-color: #b0c4de;
      }

      #jsforesight-debug-controls .control-row input[type="checkbox"]:checked::before {
        transform: translateX(22px); /* MODIFIED: Track width - Thumb width - Left padding - Right padding (assuming 2px right padding) = 40 - 14 - 2 - 2 = 22 */
      }
      /* END Modern Toggle Switch Styles */


      #jsforesight-debug-controls .control-row:has(input[type="range"]) label {
        flex-basis: 170px;
        flex-shrink: 0;
      }

      #jsforesight-debug-controls input[type="range"] {
        flex-grow: 1;
        margin: 0 0;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        height: 18px; /* Keep smaller height */
        vertical-align: middle;
      }

      #jsforesight-debug-controls input[type="range"]::-webkit-slider-runnable-track {
        height: 6px;
        background: #555;
        border-radius: 3px;
      }
      #jsforesight-debug-controls input[type="range"]::-moz-range-track {
        height: 6px;
        background: #555;
        border-radius: 3px;
      }

      #jsforesight-debug-controls input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        margin-top: -5px; /* (Track height (6px) - Thumb height (16px)) / 2 = -5px */
        background: #b0c4de;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        border: 1px solid #333;
      }
      #jsforesight-debug-controls input[type="range"]::-moz-range-thumb {
        background: #b0c4de;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        border: 1px solid #333;
        border: none;
      }

      #jsforesight-debug-controls .control-row:has(input[type="range"]) span:not(.jsforesight-info-icon) {
        width: 55px;
        min-width: 55px;
        text-align: right;
        flex-shrink: 0;
      }

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
      }
      .jsforesight-debugger-section-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
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

    this.minimizeButton = this.controlsContainer.querySelector(".jsforesight-minimize-button")
    this.debuggerSettingsSection = this.controlsContainer.querySelector(
      ".jsforesight-debugger-settings"
    )
    this.debuggerElementsSection = this.controlsContainer.querySelector(
      ".jsforesight-debugger-elements"
    )

    const sectionContents = this.controlsContainer.querySelectorAll(
      ".jsforesight-debugger-section-content"
    )
    if (sectionContents.length > 0) {
      this.mouseSettingsSection = sectionContents[0] as HTMLElement
      this.keyboardSettingsSection = sectionContents[1] as HTMLElement
      this.elementsListSection = sectionContents[2] as HTMLElement
    }

    const sectionMinimizeButtons = this.controlsContainer.querySelectorAll(
      ".jsforesight-section-minimize-button"
    )
    if (sectionMinimizeButtons.length > 0) {
      this.mouseSettingsMinimizeButton = sectionMinimizeButtons[0] as HTMLButtonElement
      this.keyboardSettingsMinimizeButton = sectionMinimizeButtons[1] as HTMLButtonElement
      this.elementsListMinimizeButton = sectionMinimizeButtons[2] as HTMLButtonElement
    }
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
      if (this.historyValueSpan) this.historyValueSpan.textContent = `${value} points`
      this.foresightManagerInstance.alterGlobalSettings({
        positionHistorySize: value,
      })
    })

    this.predictionTimeSlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      if (this.predictionValueSpan) this.predictionValueSpan.textContent = `${value} ms`
      this.foresightManagerInstance.alterGlobalSettings({
        trajectoryPredictionTime: value,
      })
    })

    this.throttleDelaySlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      if (this.throttleValueSpan) this.throttleValueSpan.textContent = `${value} ms`
      this.foresightManagerInstance.alterGlobalSettings({
        resizeScrollThrottleDelay: value,
      })
    })

    this.tabOffsetSlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      if (this.tabOffsetValueSpan) this.tabOffsetValueSpan.textContent = `${value} tabs`
      this.foresightManagerInstance.alterGlobalSettings({
        tabOffset: value,
      })
    })

    this.minimizeButton?.addEventListener("click", () => {
      this.isMinimized = !this.isMinimized
      this._applyMinimizedStateVisuals()
    })

    this.mouseSettingsMinimizeButton?.addEventListener("click", () => {
      this.isMouseSettingsMinimized = !this.isMouseSettingsMinimized
      this._applySectionMinimizedStateVisuals()
    })

    this.keyboardSettingsMinimizeButton?.addEventListener("click", () => {
      this.isKeyboardSettingsMinimized = !this.isKeyboardSettingsMinimized
      this._applySectionMinimizedStateVisuals()
    })

    this.elementsListMinimizeButton?.addEventListener("click", () => {
      this.isElementsListMinimized = !this.isElementsListMinimized
      this._applySectionMinimizedStateVisuals()
    })
  }

  private _applyMinimizedStateVisuals() {
    if (!this.controlsContainer || !this.minimizeButton) return

    if (this.isMinimized) {
      this.controlsContainer.classList.add("minimized")
      this.minimizeButton.textContent = "+"
      if (this.debuggerSettingsSection) this.debuggerSettingsSection.style.display = "none"
      if (this.debuggerElementsSection) this.debuggerElementsSection.style.display = "none"
    } else {
      this.controlsContainer.classList.remove("minimized")
      this.minimizeButton.textContent = "-"
      if (this.debuggerSettingsSection) this.debuggerSettingsSection.style.display = ""
      if (this.debuggerElementsSection) this.debuggerElementsSection.style.display = ""
      this._applySectionMinimizedStateVisuals()
    }
  }

  private _applySectionMinimizedStateVisuals() {
    if (!this.isMinimized) {
      if (this.mouseSettingsSection && this.mouseSettingsMinimizeButton) {
        if (this.isMouseSettingsMinimized) {
          this.mouseSettingsSection.style.display = "none"
          this.mouseSettingsMinimizeButton.textContent = "+"
        } else {
          this.mouseSettingsSection.style.display = "flex"
          this.mouseSettingsMinimizeButton.textContent = "-"
        }
      }

      if (this.keyboardSettingsSection && this.keyboardSettingsMinimizeButton) {
        if (this.isKeyboardSettingsMinimized) {
          this.keyboardSettingsSection.style.display = "none"
          this.keyboardSettingsMinimizeButton.textContent = "+"
        } else {
          this.keyboardSettingsSection.style.display = "flex"
          this.keyboardSettingsMinimizeButton.textContent = "-"
        }
      }

      if (this.elementsListSection && this.elementsListMinimizeButton) {
        if (this.isElementsListMinimized) {
          this.elementsListSection.style.display = "none"
          this.elementsListMinimizeButton.textContent = "+"
        } else {
          this.elementsListSection.style.display = ""
          this.elementsListMinimizeButton.textContent = "-"
        }
      }
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
      this.historyValueSpan.textContent = `${settings.positionHistorySize} points`
    }
    if (this.predictionTimeSlider && this.predictionValueSpan) {
      this.predictionTimeSlider.value = settings.trajectoryPredictionTime.toString()
      this.predictionValueSpan.textContent = `${settings.trajectoryPredictionTime} ms`
    }
    if (this.throttleDelaySlider && this.throttleValueSpan) {
      this.throttleDelaySlider.value = settings.resizeScrollThrottleDelay.toString()
      this.throttleValueSpan.textContent = `${settings.resizeScrollThrottleDelay} ms`
    }
    if (this.tabOffsetSlider && this.tabOffsetValueSpan) {
      this.tabOffsetSlider.value = settings.tabOffset.toString()
      this.tabOffsetValueSpan.textContent = `${settings.tabOffset} tabs`
    }
  }

  public refreshElementList() {
    if (!this.elementListContainer) return

    this.elementListContainer.innerHTML = ""
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

    this.minimizeButton = null
    this.debuggerSettingsSection = null
    this.debuggerElementsSection = null

    this.mouseSettingsSection = null
    this.mouseSettingsMinimizeButton = null
    this.keyboardSettingsSection = null
    this.keyboardSettingsMinimizeButton = null
    this.elementsListSection = null
    this.elementsListMinimizeButton = null
  }
}
