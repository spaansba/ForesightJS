// DebuggerControlPanel.ts
import type { ForesightManager } from "../Manager/ForesightManager"
import type {
  ForesightElementData,
  ForesightElement,
  ForesightManagerProps,
  DebuggerSettings,
} from "../../types/types"

interface SectionStates {
  mouse: boolean
  keyboard: boolean
  general: boolean
  elements: boolean
}

export class DebuggerControlPanel {
  private foresightManagerInstance: ForesightManager
  private shadowRoot: ShadowRoot | null = null
  private controlsContainer: HTMLElement | null = null
  private elementListItemsContainer: HTMLElement | null = null
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
  private allSettingsSectionsContainer: HTMLElement | null = null
  private debuggerElementsSection: HTMLElement | null = null
  private isMinimized: boolean = false

  private mouseSettingsHeader: HTMLElement | null = null
  private mouseSettingsSectionContent: HTMLElement | null = null
  private mouseSettingsMinimizeButton: HTMLButtonElement | null = null
  private keyboardSettingsHeader: HTMLElement | null = null
  private keyboardSettingsSectionContent: HTMLElement | null = null
  private keyboardSettingsMinimizeButton: HTMLButtonElement | null = null
  private generalSettingsHeader: HTMLElement | null = null
  private generalSettingsSectionContent: HTMLElement | null = null
  private generalSettingsMinimizeButton: HTMLButtonElement | null = null
  private elementsListHeader: HTMLElement | null = null
  private elementsListSectionContent: HTMLElement | null = null
  private elementsListMinimizeButton: HTMLButtonElement | null = null

  private isMouseSettingsMinimized: boolean = false
  private isKeyboardSettingsMinimized: boolean = false
  private isGeneralSettingsMinimized: boolean = false
  private isElementsListMinimized: boolean = false
  private readonly SESSION_STORAGE_KEY = "jsforesightDebuggerSectionStates"

  private copySettingsButton: HTMLButtonElement | null = null
  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null
  private static readonly COPY_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
  private static readonly TICK_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

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

    this._loadSectionStatesFromSessionStorage()

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

  private _loadSectionStatesFromSessionStorage() {
    const storedStatesRaw = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
    let loadedStates: Partial<SectionStates> = {}

    if (storedStatesRaw) {
      try {
        loadedStates = JSON.parse(storedStatesRaw)
      } catch (e) {
        console.error("Foresight Debugger: Could not parse section states from session storage.", e)
      }
    }
    this.isMouseSettingsMinimized = loadedStates.mouse ?? true
    this.isKeyboardSettingsMinimized = loadedStates.keyboard ?? true
    this.isGeneralSettingsMinimized = loadedStates.general ?? true
    this.isElementsListMinimized = loadedStates.elements ?? false
  }

  private _saveSectionStatesToSessionStorage() {
    const states: SectionStates = {
      mouse: this.isMouseSettingsMinimized,
      keyboard: this.isKeyboardSettingsMinimized,
      general: this.isGeneralSettingsMinimized,
      elements: this.isElementsListMinimized,
    }
    try {
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(states))
    } catch (e) {
      console.error("Foresight Debugger: Could not save section states to session storage.", e)
    }
  }

  private _createDOM() {
    this.controlsContainer = document.createElement("div")
    this.controlsContainer.id = "jsforesight-debug-controls"

    // Updated HTML structure for the title container
    let controlsHTML = `
      <div class="jsforesight-debugger-title-container">
        <button class="jsforesight-minimize-button">-</button>
        <div class="jsforesight-title-group">
          <h2>Foresight Debugger</h2>
          <span class="jsforesight-info-icon" title="Changes made here are for the current session only and won't persist. Update initial values in the ForesightManager.initialize() props for permanent changes.">i</span>
        </div>
        <button class="jsforesight-copy-settings-button" title="Copy current settings to clipboard">
          ${DebuggerControlPanel.COPY_SVG_ICON}
        </button>
      </div>

      <div class="jsforesight-all-settings-sections-container">
        <div class="jsforesight-debugger-section jsforesight-mouse-settings-section">
          <div class="jsforesight-debugger-section-header mouse-settings-header">
            <h3>Mouse Settings</h3>
            <button class="jsforesight-section-minimize-button">-</button>
          </div>
          <div class="jsforesight-debugger-section-content jsforesight-mouse-settings-content">
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
                <span class="jsforesight-info-icon" title="Number of past mouse positions for velocity calculation. Higher values smooth predictions but add latency.">i</span>
              </label>
              <input type="range" id="jsforesight-history-size" min="2" max="20">
              <span id="jsforesight-history-value"></span>
            </div>
            <div class="control-row">
              <label for="jsforesight-prediction-time">
                Prediction Time
                <span class="jsforesight-info-icon" title="How far (ms) to project trajectory. Larger values detect intent sooner.">i</span>
              </label>
              <input type="range" id="jsforesight-prediction-time" min="10" max="200" step="10">
              <span id="jsforesight-prediction-value"></span>
            </div>
          </div>
        </div>

        <div class="jsforesight-debugger-section jsforesight-keyboard-settings-section">
          <div class="jsforesight-debugger-section-header keyboard-settings-header">
            <h3>Keyboard Settings</h3>
            <button class="jsforesight-section-minimize-button">-</button>
          </div>
          <div class="jsforesight-debugger-section-content jsforesight-keyboard-settings-content">
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
                <span class="jsforesight-info-icon" title="Number of next/previous tabbable elements to consider for prediction when using the Tab key.">i</span>
              </label>
              <input type="range" id="jsforesight-tab-offset" min="0" max="10">
              <span id="jsforesight-tab-offset-value"></span>
            </div>
          </div>
        </div>

        <div class="jsforesight-debugger-section jsforesight-general-settings-section">
          <div class="jsforesight-debugger-section-header general-settings-header">
            <h3>General Settings</h3>
            <button class="jsforesight-section-minimize-button">-</button>
          </div>
          <div class="jsforesight-debugger-section-content jsforesight-general-settings-content">
            <div class="control-row">
              <label for="jsforesight-throttle-delay">
                Scroll/Resize Throttle
                <span class="jsforesight-info-icon" title="Delay (ms) for recalculating element positions on resize/scroll. Higher values improve performance during rapid events.">i</span>
              </label>
              <input type="range" id="jsforesight-throttle-delay" min="0" max="500" step="10">
              <span id="jsforesight-throttle-value"></span>
            </div>
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
    const elementItemHeight = 35 // px
    const elementListGap = 6 // px
    const elementListItemsContainerPadding = 6 // px
    const numRowsToShow = 3
    const numItemsPerRow = 2

    const rowsContentHeight =
      elementItemHeight * numRowsToShow + elementListGap * (numRowsToShow - 1)
    const elementListContainerHeight = rowsContentHeight + elementListItemsContainerPadding * 2

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
        padding: 12px 0; /* Adjusted padding for minimized state */
      }
      #jsforesight-debug-controls.minimized .jsforesight-debugger-title-container {
        justify-content: flex-start; /* Keep this for minimized */
        padding-left: 10px; /* Keep padding for minimized */
        padding-right: 10px; /* Keep padding for minimized */
        gap: 10px; /* Keep gap for minimized */
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
         /* No longer absolute, so static positioning is default */
         margin-right: 0; /* Reset margin if any was added for non-minimized */
         padding: 0 3px;
         line-height: 1;
      }

      .jsforesight-debugger-title-container {
        display: flex;
        align-items: center;
        justify-content: space-between; /* Key change for layout */
        padding: 0 10px; /* Provides spacing from edges for buttons */
        /* gap: 8px; Removed, space-between handles distribution */
        /* position: relative; No longer needed for these buttons */
      }
      .jsforesight-title-group { /* New style for grouping title and info icon */
        display: flex;
        align-items: center;
        gap: 8px; /* Spacing between title and info icon */
        /* flex-grow: 1; Optional: if title group should expand */
        /* justify-content: center; Optional: to center content within the group */
      }
      .jsforesight-minimize-button {
        background: none; border: none; color: white;
        font-size: 22px; cursor: pointer; padding: 0 5px;
        line-height: 1;
        /* Removed absolute positioning properties */
      }
      .jsforesight-debugger-title-container h2 { margin: 0; font-size: 15px; }

      .jsforesight-copy-settings-button {
        background: none; border: none; color: white;
        cursor: pointer; padding: 0;
        display: flex; align-items: center; justify-content: center;
        width: 24px; height: 24px; /* Maintain size */
        /* Removed absolute positioning properties */
      }
      .jsforesight-copy-settings-button svg {
        width: 16px; height: 16px;
        stroke: white;
      }

      .jsforesight-all-settings-sections-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .jsforesight-debugger-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 5px;
        margin-bottom: 2px;
        padding-bottom: 2px;
        border-bottom: 1px solid #444;
        cursor: pointer;
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
      #jsforesight-debug-controls .control-row input[type="checkbox"] {
        appearance: none; -webkit-appearance: none; -moz-appearance: none;
        position: relative; width: 40px; height: 18px;
        background-color: #555; border-radius: 10px; cursor: pointer;
        outline: none; transition: background-color 0.2s ease;
        vertical-align: middle; flex-shrink: 0; margin: 0;
      }
      #jsforesight-debug-controls .control-row input[type="checkbox"]::before {
        content: ""; position: absolute; width: 14px; height: 14px;
        border-radius: 50%; background-color: white; top: 2px; left: 2px;
        transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
      #jsforesight-debug-controls .control-row input[type="checkbox"]:checked {
        background-color: #b0c4de;
      }
      #jsforesight-debug-controls .control-row input[type="checkbox"]:checked::before {
        transform: translateX(22px);
      }
      #jsforesight-debug-controls .control-row:has(input[type="range"]) label {
        flex-basis: 170px; flex-shrink: 0;
      }
      #jsforesight-debug-controls input[type="range"] {
        flex-grow: 1; margin: 0; cursor: pointer; -webkit-appearance: none;
        appearance: none; background: transparent; height: 18px; vertical-align: middle;
      }
      #jsforesight-debug-controls input[type="range"]::-webkit-slider-runnable-track {
        height: 6px; background: #555; border-radius: 3px;
      }
      #jsforesight-debug-controls input[type="range"]::-moz-range-track {
        height: 6px; background: #555; border-radius: 3px;
      }
      #jsforesight-debug-controls input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; margin-top: -5px;
        background: #b0c4de; height: 16px; width: 16px;
        border-radius: 50%; border: 1px solid #333;
      }
      #jsforesight-debug-controls input[type="range"]::-moz-range-thumb {
        background: #b0c4de; height: 16px; width: 16px;
        border-radius: 50%; border: 1px solid #333; border: none;
      }
      #jsforesight-debug-controls .control-row:has(input[type="range"]) span:not(.jsforesight-info-icon) {
        width: 55px; min-width: 55px; text-align: right; flex-shrink: 0;
      }
      .jsforesight-info-icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 16px; height: 16px; border-radius: 50%;
        background-color: #555; color: white; font-size: 10px;
        font-style: italic; font-weight: bold; font-family: 'Georgia', serif;
        cursor: help; user-select: none; flex-shrink: 0;
      }
      .jsforesight-debugger-section {
        display: flex; flex-direction: column; gap: 6px;
      }
      .jsforesight-debugger-section-content {
        display: flex; flex-direction: column; gap: 8px;
      }

      /* Element List Styles */
      .jsforesight-element-list { /* Scroll container */
        min-height: ${elementListContainerHeight}px;
        max-height: ${elementListContainerHeight}px; /* Fixed height for 3 rows */
        overflow-y: auto;
        background-color: rgba(20, 20, 20, 0.5);
        border-radius: 3px;
        padding: 0;
      }
      #jsforesight-element-list-items-container { /* Flex container for items */
        display: flex;
        flex-wrap: wrap;
        gap: ${elementListGap}px;
        padding: ${elementListItemsContainerPadding}px;
        min-height: ${rowsContentHeight}px;
        box-sizing: border-box;
        align-content: flex-start;
      }
      #jsforesight-element-list-items-container > em {
        flex-basis: 100%;
        text-align: center;
        padding: 10px 0;
        font-style: italic;
        color: #ccc;
        font-size: 12px;
      }
      .jsforesight-element-list-item {
        flex-basis: calc((100% - (${
          numItemsPerRow - 1
        } * ${elementListGap}px)) / ${numItemsPerRow});
        flex-grow: 0;
        flex-shrink: 0;
        height: ${elementItemHeight}px;
        box-sizing: border-box;
        padding: 3px 5px;
        border-radius: 2px;
        display: flex;
        align-items: center;
        gap: 5px;
        background-color: rgba(50,50,50,0.7);
        transition: background-color 0.2s ease;
        font-size: 11px;
        overflow: hidden;
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
      .jsforesight-element-list-item .hit-behavior {
        font-size: 9px;
        color: #b0b0b0;
        padding: 1px 3px;
        border-radius: 2px;
        background-color: rgba(0,0,0,0.2);
        flex-shrink: 0;
        margin-left: auto;
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

    this.elementListItemsContainer = this.controlsContainer.querySelector(
      "#jsforesight-element-list-items-container"
    )
    this.elementCountSpan = this.controlsContainer.querySelector("#jsforesight-element-count")

    this.minimizeButton = this.controlsContainer.querySelector(".jsforesight-minimize-button")
    this.allSettingsSectionsContainer = this.controlsContainer.querySelector(
      ".jsforesight-all-settings-sections-container"
    )
    this.debuggerElementsSection = this.controlsContainer.querySelector(
      ".jsforesight-debugger-elements"
    )

    this.copySettingsButton = this.controlsContainer.querySelector(
      ".jsforesight-copy-settings-button"
    )

    const mouseSection = this.controlsContainer.querySelector(".jsforesight-mouse-settings-section")
    if (mouseSection) {
      this.mouseSettingsHeader = mouseSection.querySelector(".mouse-settings-header")
      this.mouseSettingsSectionContent = mouseSection.querySelector(
        ".jsforesight-mouse-settings-content"
      )
      this.mouseSettingsMinimizeButton = mouseSection.querySelector(
        ".jsforesight-section-minimize-button"
      )
    }

    const keyboardSection = this.controlsContainer.querySelector(
      ".jsforesight-keyboard-settings-section"
    )
    if (keyboardSection) {
      this.keyboardSettingsHeader = keyboardSection.querySelector(".keyboard-settings-header")
      this.keyboardSettingsSectionContent = keyboardSection.querySelector(
        ".jsforesight-keyboard-settings-content"
      )
      this.keyboardSettingsMinimizeButton = keyboardSection.querySelector(
        ".jsforesight-section-minimize-button"
      )
    }

    const generalSection = this.controlsContainer.querySelector(
      ".jsforesight-general-settings-section"
    )
    if (generalSection) {
      this.generalSettingsHeader = generalSection.querySelector(".general-settings-header")
      this.generalSettingsSectionContent = generalSection.querySelector(
        ".jsforesight-general-settings-content"
      )
      this.generalSettingsMinimizeButton = generalSection.querySelector(
        ".jsforesight-section-minimize-button"
      )
    }

    if (this.debuggerElementsSection) {
      this.elementsListHeader = this.debuggerElementsSection.querySelector(".elements-list-header")
      this.elementsListSectionContent = this.debuggerElementsSection.querySelector(
        ".jsforesight-element-list"
      )
      this.elementsListMinimizeButton = this.debuggerElementsSection.querySelector(
        ".jsforesight-section-minimize-button"
      )
    }
  }

  private _handleCopySettings() {
    if (!this.copySettingsButton) return

    const enableMousePrediction = this.trajectoryEnabledCheckbox?.checked ?? false
    const enableTabPrediction = this.tabEnabledCheckbox?.checked ?? false
    const positionHistorySize = parseInt(this.historySizeSlider?.value ?? "8", 10)
    const trajectoryPredictionTime = parseInt(this.predictionTimeSlider?.value ?? "80", 10)
    const resizeScrollThrottleDelay = parseInt(this.throttleDelaySlider?.value ?? "50", 10)
    const tabOffset = parseInt(this.tabOffsetSlider?.value ?? "2", 10)

    const settingsToCopy = {
      debug: true,
      debuggerSettings: {
        isControlPanelDefaultMinimized: this.isMinimized,
      },
      enableMousePrediction,
      enableTabPrediction,
      positionHistorySize,
      resizeScrollThrottleDelay,
      tabOffset,
      trajectoryPredictionTime,
    }

    let settingsString = "ForesightManager.initialize({\n"
    settingsString += `  debug: ${settingsToCopy.debug},\n`
    settingsString += `  debuggerSettings: {\n`
    settingsString += `    isControlPanelDefaultMinimized: ${settingsToCopy.debuggerSettings.isControlPanelDefaultMinimized},\n`
    settingsString += `  },\n`
    settingsString += `  enableMousePrediction: ${settingsToCopy.enableMousePrediction},\n`
    settingsString += `  enableTabPrediction: ${settingsToCopy.enableTabPrediction},\n`
    settingsString += `  positionHistorySize: ${settingsToCopy.positionHistorySize},\n`
    settingsString += `  resizeScrollThrottleDelay: ${settingsToCopy.resizeScrollThrottleDelay},\n`
    settingsString += `  tabOffset: ${settingsToCopy.tabOffset},\n`
    settingsString += `  trajectoryPredictionTime: ${settingsToCopy.trajectoryPredictionTime},\n`
    settingsString += "})"

    navigator.clipboard
      .writeText(settingsString)
      .then(() => {
        this.copySettingsButton!.innerHTML = DebuggerControlPanel.TICK_SVG_ICON
        if (this.copyTimeoutId) {
          clearTimeout(this.copyTimeoutId)
        }
        this.copyTimeoutId = setTimeout(() => {
          if (this.copySettingsButton) {
            this.copySettingsButton.innerHTML = DebuggerControlPanel.COPY_SVG_ICON
          }
          this.copyTimeoutId = null
        }, 3000)
      })
      .catch((err) => {
        console.error("Foresight Debugger: Could not copy settings to clipboard", err)
      })
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
      const value = parseInt((e.target as HTMLInputElement).value, 10)
      if (this.historyValueSpan) this.historyValueSpan.textContent = `${value} points`
      this.foresightManagerInstance.alterGlobalSettings({
        positionHistorySize: value,
      })
    })
    this.predictionTimeSlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10)
      if (this.predictionValueSpan) this.predictionValueSpan.textContent = `${value} ms`
      this.foresightManagerInstance.alterGlobalSettings({
        trajectoryPredictionTime: value,
      })
    })
    this.throttleDelaySlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10)
      if (this.throttleValueSpan) this.throttleValueSpan.textContent = `${value} ms`
      this.foresightManagerInstance.alterGlobalSettings({
        resizeScrollThrottleDelay: value,
      })
    })
    this.tabOffsetSlider?.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10)
      if (this.tabOffsetValueSpan) this.tabOffsetValueSpan.textContent = `${value} tabs`
      this.foresightManagerInstance.alterGlobalSettings({ tabOffset: value })
    })

    this.minimizeButton?.addEventListener("click", () => {
      this.isMinimized = !this.isMinimized
      this._applyMinimizedStateVisuals()
    })

    this.copySettingsButton?.addEventListener("click", this._handleCopySettings.bind(this))

    const setupSectionToggle = (
      header: HTMLElement | null,
      button: HTMLButtonElement | null,
      isMinimizedFlagName:
        | "isMouseSettingsMinimized"
        | "isKeyboardSettingsMinimized"
        | "isGeneralSettingsMinimized"
        | "isElementsListMinimized"
    ) => {
      const toggleAction = () => {
        this[isMinimizedFlagName] = !this[isMinimizedFlagName]
        this._applySectionMinimizedStateVisuals()
        this._saveSectionStatesToSessionStorage()
      }
      button?.addEventListener("click", (e) => {
        e.stopPropagation()
        toggleAction()
      })
      header?.addEventListener("click", (e) => {
        if (button && button.contains(e.target as Node)) return
        toggleAction()
      })
    }

    setupSectionToggle(
      this.mouseSettingsHeader,
      this.mouseSettingsMinimizeButton,
      "isMouseSettingsMinimized"
    )
    setupSectionToggle(
      this.keyboardSettingsHeader,
      this.keyboardSettingsMinimizeButton,
      "isKeyboardSettingsMinimized"
    )
    setupSectionToggle(
      this.generalSettingsHeader,
      this.generalSettingsMinimizeButton,
      "isGeneralSettingsMinimized"
    )
    setupSectionToggle(
      this.elementsListHeader,
      this.elementsListMinimizeButton,
      "isElementsListMinimized"
    )
  }

  private _applyMinimizedStateVisuals() {
    if (!this.controlsContainer || !this.minimizeButton) return

    if (this.isMinimized) {
      this.controlsContainer.classList.add("minimized")
      this.minimizeButton.textContent = "+"
      if (this.allSettingsSectionsContainer)
        this.allSettingsSectionsContainer.style.display = "none"
      if (this.debuggerElementsSection) this.debuggerElementsSection.style.display = "none"
    } else {
      this.controlsContainer.classList.remove("minimized")
      this.minimizeButton.textContent = "-"
      if (this.allSettingsSectionsContainer) this.allSettingsSectionsContainer.style.display = ""
      if (this.debuggerElementsSection) this.debuggerElementsSection.style.display = ""
      this._applySectionMinimizedStateVisuals()
    }
  }

  private _applySectionMinimizedStateVisuals() {
    if (this.isMinimized) return

    const updateSectionDisplay = (
      contentElement: HTMLElement | null,
      buttonElement: HTMLButtonElement | null,
      isMinimized: boolean,
      displayType: string = "flex"
    ) => {
      if (contentElement && buttonElement) {
        if (isMinimized) {
          contentElement.style.display = "none"
          buttonElement.textContent = "+"
        } else {
          contentElement.style.display = displayType
          buttonElement.textContent = "-"
        }
      }
    }

    updateSectionDisplay(
      this.mouseSettingsSectionContent,
      this.mouseSettingsMinimizeButton,
      this.isMouseSettingsMinimized
    )
    updateSectionDisplay(
      this.keyboardSettingsSectionContent,
      this.keyboardSettingsMinimizeButton,
      this.isKeyboardSettingsMinimized
    )
    updateSectionDisplay(
      this.generalSettingsSectionContent,
      this.generalSettingsMinimizeButton,
      this.isGeneralSettingsMinimized
    )
    updateSectionDisplay(
      this.elementsListSectionContent,
      this.elementsListMinimizeButton,
      this.isElementsListMinimized,
      ""
    )
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
    if (!this.elementListItemsContainer) return

    this.elementListItemsContainer.innerHTML = ""
    this.elementListItems.clear()

    const elementsMap = this.foresightManagerInstance.elements

    if (this.elementCountSpan) {
      this.elementCountSpan.textContent = elementsMap.size.toString()
    }

    if (elementsMap.size === 0) {
      this.elementListItemsContainer.innerHTML = "<em>No elements registered.</em>"
      return
    }

    elementsMap.forEach((data, element) => {
      const listItem = document.createElement("div")
      listItem.className = "jsforesight-element-list-item"
      this._updateListItemContent(listItem, data)

      this.elementListItemsContainer!.appendChild(listItem)
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
    `
  }

  public cleanup() {
    this.controlsContainer?.remove()
    this.controlPanelStyleElement?.remove()

    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId)
      this.copyTimeoutId = null
    }

    this.controlsContainer = null
    this.elementListItemsContainer = null
    this.controlPanelStyleElement = null
    this.elementCountSpan = null
    this.elementListItems.clear()
    this.minimizeButton = null
    this.allSettingsSectionsContainer = null
    this.debuggerElementsSection = null
    this.mouseSettingsHeader = null
    this.mouseSettingsSectionContent = null
    this.mouseSettingsMinimizeButton = null
    this.keyboardSettingsHeader = null
    this.keyboardSettingsSectionContent = null
    this.keyboardSettingsMinimizeButton = null
    this.generalSettingsHeader = null
    this.generalSettingsSectionContent = null
    this.generalSettingsMinimizeButton = null
    this.elementsListHeader = null
    this.elementsListSectionContent = null
    this.elementsListMinimizeButton = null
    this.trajectoryEnabledCheckbox = null
    this.tabEnabledCheckbox = null
    this.historySizeSlider = null
    this.historyValueSpan = null
    this.predictionTimeSlider = null
    this.predictionValueSpan = null
    this.throttleDelaySlider = null
    this.throttleValueSpan = null
    this.tabOffsetSlider = null
    this.tabOffsetValueSpan = null
    this.copySettingsButton = null
  }
}
