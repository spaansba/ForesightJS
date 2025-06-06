// DebuggerControlPanel.ts
import type { ForesightManager } from "../Manager/ForesightManager"
import type {
  ForesightElementData,
  ForesightElement,
  ForesightManagerProps,
  DebuggerSettings,
} from "../../types/types"
import {
  DEFAULT_ENABLE_MOUSE_PREDICTION,
  DEFAULT_ENABLE_TAB_PREDICTION,
  DEFAULT_POSITION_HISTORY_SIZE,
  DEFAULT_RESIZE_SCROLL_THROTTLE_DELAY,
  DEFAULT_TAB_OFFSET,
  DEFAULT_TRAJECTORY_PREDICTION_TIME,
  MAX_POSITION_HISTORY_SIZE,
  MAX_RESIZE_SCROLL_THROTTLE_DELAY,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_POSITION_HISTORY_SIZE,
  MIN_RESIZE_SCROLL_THROTTLE_DELAY,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
} from "../constants"

interface SectionStates {
  mouse: boolean
  keyboard: boolean
  general: boolean
  elements: boolean
}

const COPY_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
const TICK_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

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

  private containerMinimizeButton: HTMLButtonElement | null = null
  private allSettingsSectionsContainer: HTMLElement | null = null
  private debuggerElementsSection: HTMLElement | null = null
  private isContainerMinimized: boolean = false

  private isMouseSettingsMinimized: boolean = true
  private isKeyboardSettingsMinimized: boolean = true
  private isGeneralSettingsMinimized: boolean = true
  private isElementsListMinimized: boolean = true
  private readonly SESSION_STORAGE_KEY = "jsforesightDebuggerSectionStates"

  private copySettingsButton: HTMLButtonElement | null = null
  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(manager: ForesightManager) {
    this.foresightManagerInstance = manager
  }

  public initialize(shadowRoot: ShadowRoot, debuggerSettings: DebuggerSettings) {
    this.shadowRoot = shadowRoot
    this.createDOM()
    if (debuggerSettings.isControlPanelDefaultMinimized) {
      this.isContainerMinimized = true
    }

    if (this.controlsContainer && this.shadowRoot) {
      this.controlPanelStyleElement = document.createElement("style")
      this.controlPanelStyleElement.textContent = this.getStyles()
      this.controlPanelStyleElement.id = "debug-control-panel"
      this.shadowRoot.appendChild(this.controlPanelStyleElement)

      this.shadowRoot.appendChild(this.controlsContainer)
      this.queryDOMElements()
      this.originalSectionStates()
      this.setupEventListeners()
      this.refreshElementList()
      this.applyMinimizedStateVisuals()
    }
  }

  /**
   * All sections are closed by default. If the user opens a section in their session and refreshes the page it will remain open.
   */
  private loadSectionStatesFromSessionStorage(): Partial<SectionStates> {
    const storedStatesRaw = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
    let loadedStates: Partial<SectionStates> = {}

    if (storedStatesRaw) {
      loadedStates = JSON.parse(storedStatesRaw)
    }

    this.isMouseSettingsMinimized = loadedStates.mouse ?? true
    this.isKeyboardSettingsMinimized = loadedStates.keyboard ?? true
    this.isGeneralSettingsMinimized = loadedStates.general ?? true
    this.isElementsListMinimized = loadedStates.elements ?? false
    return loadedStates
  }

  private saveSectionStatesToSessionStorage() {
    const states: SectionStates = {
      mouse: this.isMouseSettingsMinimized,
      keyboard: this.isKeyboardSettingsMinimized,
      general: this.isGeneralSettingsMinimized,
      elements: this.isElementsListMinimized,
    }
    try {
      // can throw QuotaExceededError for several reasons
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(states))
    } catch (e) {
      console.error("Foresight Debugger: Could not save section states to session storage.", e)
    }
  }

  private queryDOMElements() {
    if (!this.controlsContainer) return

    this.trajectoryEnabledCheckbox = this.controlsContainer.querySelector("#trajectory-enabled")
    this.tabEnabledCheckbox = this.controlsContainer.querySelector("#tab-enabled")
    this.historySizeSlider = this.controlsContainer.querySelector("#history-size")
    this.historyValueSpan = this.controlsContainer.querySelector("#history-value")
    this.predictionTimeSlider = this.controlsContainer.querySelector("#prediction-time")
    this.predictionValueSpan = this.controlsContainer.querySelector("#prediction-value")
    this.throttleDelaySlider = this.controlsContainer.querySelector("#throttle-delay")
    this.throttleValueSpan = this.controlsContainer.querySelector("#throttle-value")
    this.tabOffsetSlider = this.controlsContainer.querySelector("#tab-offset")
    this.tabOffsetValueSpan = this.controlsContainer.querySelector("#tab-offset-value")
    this.elementListItemsContainer = this.controlsContainer.querySelector(
      "#element-list-items-container"
    )
    this.elementCountSpan = this.controlsContainer.querySelector("#element-count")
    this.containerMinimizeButton = this.controlsContainer.querySelector(".minimize-button")
    this.allSettingsSectionsContainer = this.controlsContainer.querySelector(
      ".all-settings-sections-container"
    )

    this.debuggerElementsSection = this.controlsContainer.querySelector(".debugger-elements")

    this.copySettingsButton = this.controlsContainer.querySelector(".copy-settings-button")
  }

  private handleCopySettings() {
    if (!this.copySettingsButton) return

    const enableMousePrediction =
      this.trajectoryEnabledCheckbox?.checked ?? DEFAULT_ENABLE_MOUSE_PREDICTION
    const enableTabPrediction = this.tabEnabledCheckbox?.checked ?? DEFAULT_ENABLE_TAB_PREDICTION
    const positionHistorySize = parseInt(
      this.historySizeSlider?.value ?? DEFAULT_POSITION_HISTORY_SIZE.toString(),
      10
    )
    const trajectoryPredictionTime = parseInt(
      this.predictionTimeSlider?.value ?? DEFAULT_TRAJECTORY_PREDICTION_TIME.toString(),
      10
    )
    const resizeScrollThrottleDelay = parseInt(
      this.throttleDelaySlider?.value ?? DEFAULT_RESIZE_SCROLL_THROTTLE_DELAY.toString(),
      10
    )
    const tabOffset = parseInt(this.tabOffsetSlider?.value ?? DEFAULT_TAB_OFFSET.toString(), 10)

    const settingsToCopy = {
      debug: true,
      debuggerSettings: {
        isControlPanelDefaultMinimized: this.isContainerMinimized,
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
        this.copySettingsButton!.innerHTML = TICK_SVG_ICON
        if (this.copyTimeoutId) {
          clearTimeout(this.copyTimeoutId)
        }
        this.copyTimeoutId = setTimeout(() => {
          if (this.copySettingsButton) {
            this.copySettingsButton.innerHTML = COPY_SVG_ICON
          }
          this.copyTimeoutId = null
        }, 3000)
      })
      .catch((err) => {
        console.error("Foresight Debugger: Could not copy settings to clipboard", err)
      })
  }

  private setupEventListeners() {
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

    this.containerMinimizeButton?.addEventListener("click", () => {
      this.isContainerMinimized = !this.isContainerMinimized
      this.applyMinimizedStateVisuals()
    })

    this.copySettingsButton?.addEventListener("click", this.handleCopySettings.bind(this))

    // We toggle the minimize on the entire section header div instead of solely on the minimize button
    const sectionToggleEvent = (
      section: HTMLDivElement | null,
      isMinimizedFlagName:
        | "isMouseSettingsMinimized"
        | "isKeyboardSettingsMinimized"
        | "isGeneralSettingsMinimized"
        | "isElementsListMinimized"
    ) => {
      const sectionHeader = section?.querySelector(".debugger-section-header")
      sectionHeader?.addEventListener("click", (e) => {
        e.stopPropagation()
        this.toggleMinimizeSection(
          section,
          (this[isMinimizedFlagName] = !this[isMinimizedFlagName])
        )
      })
    }
    if (this.controlsContainer) {
      sectionToggleEvent(
        this.controlsContainer.querySelector(".mouse-settings-section"),
        "isMouseSettingsMinimized"
      )
      sectionToggleEvent(
        this.controlsContainer.querySelector(".keyboard-settings-section"),
        "isKeyboardSettingsMinimized"
      )
      sectionToggleEvent(
        this.controlsContainer.querySelector(".general-settings-section"),
        "isGeneralSettingsMinimized"
      )
      sectionToggleEvent(
        this.controlsContainer.querySelector(".debugger-elements"),
        "isElementsListMinimized"
      )
    }
  }

  private toggleMinimizeSection(section: HTMLDivElement | null, shouldMinimize: boolean) {
    if (!section) {
      return
    }
    const sectionContent: HTMLDivElement | null = section.querySelector(".debugger-section-content")
    const minimizeButton: HTMLButtonElement | null = section.querySelector(
      ".section-minimize-button"
    )
    if (sectionContent && minimizeButton) {
      if (shouldMinimize) {
        sectionContent.style.display = "none"
        minimizeButton.textContent = "+"
      } else {
        sectionContent.style.display = "flex"
        minimizeButton.textContent = "-"
      }
    }
    this.saveSectionStatesToSessionStorage()
  }

  private originalSectionStates() {
    const states = this.loadSectionStatesFromSessionStorage()
    if (!this.controlsContainer) {
      return
    }
    this.toggleMinimizeSection(
      this.controlsContainer.querySelector(".mouse-settings-section"),
      states.mouse ?? true
    )
    this.toggleMinimizeSection(
      this.controlsContainer.querySelector(".keyboard-settings-section"),
      states.keyboard ?? true
    )
    this.toggleMinimizeSection(
      this.controlsContainer.querySelector(".general-settings-section"),
      states.general ?? true
    )
    this.toggleMinimizeSection(
      this.controlsContainer.querySelector(".debugger-elements"),
      states.elements ?? false
    )
  }

  private applyMinimizedStateVisuals() {
    if (!this.controlsContainer || !this.containerMinimizeButton) return
    if (this.isContainerMinimized) {
      this.controlsContainer.classList.add("minimized")
      this.containerMinimizeButton.textContent = "+"
      if (this.allSettingsSectionsContainer)
        this.allSettingsSectionsContainer.style.display = "none"
      if (this.debuggerElementsSection) this.debuggerElementsSection.style.display = "none"
      if (this.copySettingsButton) this.copySettingsButton.style.display = "none"
    } else {
      this.controlsContainer.classList.remove("minimized")
      this.containerMinimizeButton.textContent = "-"
      if (this.allSettingsSectionsContainer) this.allSettingsSectionsContainer.style.display = ""
      if (this.debuggerElementsSection) this.debuggerElementsSection.style.display = ""
      if (this.copySettingsButton) this.copySettingsButton.style.display = ""
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
      listItem.className = "element-list-item"
      this.updateListItemContent(listItem, data)
      this.elementListItemsContainer!.appendChild(listItem)
      this.elementListItems.set(element, listItem)
    })
  }

  private updateListItemContent(listItem: HTMLElement, data: ForesightElementData) {
    listItem.classList.toggle("hovering", data.isHovering)
    listItem.classList.toggle("trajectory-hit", data.trajectoryHitData.isTrajectoryHit)

    const statusIndicatorHTML = `<span class="status-indicator"></span>`
    const hitBehaviorText = data.unregisterOnCallback ? "Single" : "Multi"
    const hitBehaviorTitle = data.unregisterOnCallback
      ? "Callback triggers once, then element unregisters."
      : "Callback can trigger multiple times."

    let hitSlopText = "N/A"
    let hitSlopTitle = "Hit Slop: Not defined"

    if (data.elementBounds.hitSlop) {
      const { top, right, bottom, left } = data.elementBounds.hitSlop
      hitSlopText = `T:${top} R:${right} B:${bottom} L:${left}`
      hitSlopTitle = `Hit Slop (px): Top: ${top}, Right: ${right}, Bottom: ${bottom}, Left: ${left}`
    }

    listItem.innerHTML = `
      ${statusIndicatorHTML}
      <span class="element-name" title="${data.name || "Unnamed Element"}">${
      data.name || "Unnamed Element"
    }</span>
          <span class="hit-slop" title="${hitSlopTitle}">${hitSlopText}</span>
      <span class="hit-behavior" title="${hitBehaviorTitle}">${hitBehaviorText}</span>

    `
  }

  public cleanup() {
    this.controlsContainer?.remove() // This indirectly removes all event listeners
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
    this.containerMinimizeButton = null
    this.allSettingsSectionsContainer = null
    this.debuggerElementsSection = null
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
  private createDOM() {
    this.controlsContainer = document.createElement("div")
    this.controlsContainer.id = "debug-controls"

    this.controlsContainer.innerHTML = `
      <div class="debugger-title-container">
        <button class="minimize-button">-</button>
        <div class="title-group">
          <h2>Foresight Debugger</h2>
          <span class="info-icon" title="Changes made here are for the current session only and won't persist. Update initial values in the ForesightManager.initialize() props for permanent changes.">i</span>
        </div>
        <button class="copy-settings-button" title="Copy current settings to clipboard">
          ${COPY_SVG_ICON}
        </button>
      </div>

      <div class="all-settings-sections-container">
        <div class="debugger-section mouse-settings-section">
          <div class="debugger-section-header mouse-settings-header">
            <h3>Mouse Settings</h3>
            <button class="section-minimize-button">-</button>
          </div>
          <div class="debugger-section-content mouse-settings-content">
            <div class="control-row">
              <label for="trajectory-enabled">
                Enable Mouse Prediction
                <span class="info-icon" title="Toggles mouse movement prediction. If disabled, only direct hovers trigger actions (or tab if enabled).">i</span>
              </label>
              <input type="checkbox" id="trajectory-enabled">
            </div>
            <div class="control-row">
              <label for="history-size">
                History Size
                <span class="info-icon" title="Number of past mouse positions to use for velocity calculation. Higher values smooth predictions but add latency.">i</span>
              </label>
              <input type="range" id="history-size" min="${MIN_POSITION_HISTORY_SIZE}" max="${MAX_POSITION_HISTORY_SIZE}">
              <span id="history-value"></span>
            </div>
            <div class="control-row">
              <label for="prediction-time">
                Prediction Time
                <span class="info-icon" title="How many ms in the future to calculate the mouse trajectory. Larger values detect intent sooner.">i</span>
              </label>
              <input type="range" id="prediction-time" min="${MIN_TRAJECTORY_PREDICTION_TIME}" max="${MAX_TRAJECTORY_PREDICTION_TIME}" step="10">
              <span id="prediction-value"></span>
            </div>
          </div>
        </div>

        <div class="debugger-section keyboard-settings-section">
          <div class="debugger-section-header keyboard-settings-header">
            <h3>Keyboard Settings</h3>
            <button class="section-minimize-button">-</button>
          </div>
          <div class="debugger-section-content keyboard-settings-content">
            <div class="control-row">
              <label for="tab-enabled">
                Enable Tab Prediction
                <span class="info-icon" title="With tab prediction the callback will be executed when the user is tabOffset amount of tabs away from an registered element (works with reversed shift-tabs).">i</span>
              </label>
              <input type="checkbox" id="tab-enabled">
            </div>
            <div class="control-row">
              <label for="tab-offset">
                Tab Prediction Offset
                <span class="info-icon" title="Number of next/previous tabbable elements to consider for prediction when using the Tab key.">i</span>
              </label>
              <input type="range" id="tab-offset" min="${MIN_TAB_OFFSET}" max="${MAX_TAB_OFFSET}" step="1">
              <span id="tab-offset-value"></span>
            </div>
          </div>
        </div>

        <div class="debugger-section general-settings-section">
          <div class="debugger-section-header general-settings-header">
            <h3>General Settings</h3>
            <button class="section-minimize-button">-</button>
          </div>
          <div class="debugger-section-content general-settings-content">
            <div class="control-row">
              <label for="throttle-delay">
                Scroll/Resize Throttle
                <span class="info-icon" title="Delay (ms) for recalculating element positions on resize/scroll. Higher values improve performance during rapid events.">i</span>
              </label>
              <input type="range" id="throttle-delay" min="${MIN_RESIZE_SCROLL_THROTTLE_DELAY}" max="${MAX_RESIZE_SCROLL_THROTTLE_DELAY}" step="10">
              <span id="throttle-value"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="debugger-section debugger-elements">
        <div class="debugger-section-header elements-list-header">
          <h3>Registered Elements (<span id="element-count">0</span>)</h3>
           <button class="section-minimize-button">-</button>
        </div>
        <div class="debugger-section-content element-list">
          <div id="element-list-items-container">
            <em>Initializing...</em>
          </div>
        </div>
      </div>
    `
  }

  private getStyles(): string {
    const elementItemHeight = 35 // px
    const elementListGap = 3 // px
    const elementListItemsContainerPadding = 6 // px
    const numRowsToShow = 4
    const numItemsPerRow = 1

    const rowsContentHeight =
      elementItemHeight * numRowsToShow + elementListGap * (numRowsToShow - 1)
    const elementListContainerHeight = rowsContentHeight + elementListItemsContainerPadding * 2

    return `
      #debug-controls {
        position: fixed; bottom: 10px; right: 10px;
        background-color: rgba(0, 0, 0, 0.75); color: white; padding: 12px;
        border-radius: 5px; font-family: Arial, sans-serif; font-size: 13px;
        z-index: 10001; pointer-events: auto; display: flex; flex-direction: column; gap: 8px;
        width: 380px;
        transition: width 0.3s ease, height 0.3s ease;
      }
      #debug-controls.minimized {
        width: 220px;
        overflow: hidden;
        padding: 12px 0; 
      }
      #debug-controls.minimized .debugger-title-container {
        justify-content: flex-start; 
        padding-left: 10px; 
        padding-right: 10px;
        gap: 10px; 
      }
      #debug-controls.minimized .debugger-title-container h2 {
        display: inline;
        font-size: 14px;
        margin: 0;
        white-space: nowrap;
      }
      #debug-controls.minimized .info-icon {
        display: none;
      }

      .debugger-title-container {
        display: flex;
        align-items: center;
        justify-content: space-between; 
        padding: 0 0px; 
      }
      .title-group { 
        display: flex;
        align-items: center;
        gap: 8px; 

      }
      .minimize-button {
        background: none; border: none; color: white;
        font-size: 22px; cursor: pointer;
        line-height: 1;
      }
      .debugger-title-container h2 { margin: 0; font-size: 15px; }

      .copy-settings-button {
        background: none; border: none; color: white;
        cursor: pointer; padding: 0;
        display: flex; align-items: center; justify-content: center;
      }
      .copy-settings-button svg {
        width: 16px; height: 16px;
        stroke: white;
      }

      .all-settings-sections-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .debugger-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 5px;
        margin-bottom: 2px;
        padding-bottom: 2px;
        border-bottom: 1px solid #444;
        cursor: pointer;
      }
      .debugger-section-header h3 {
         margin: 0;
         font-size: 14px;
         font-weight: bold;
         color: #b0c4de;
      }

      .section-minimize-button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      #debug-controls .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      #debug-controls label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
      }
      #debug-controls .control-row:has(input[type="checkbox"]) label {
        flex-grow: 1;
      }
      #debug-controls .control-row input[type="checkbox"] {
        appearance: none; -webkit-appearance: none; -moz-appearance: none;
        position: relative; width: 40px; height: 18px;
        background-color: #555; border-radius: 10px; cursor: pointer;
        outline: none; transition: background-color 0.2s ease;
        vertical-align: middle; flex-shrink: 0; margin: 0;
      }
      #debug-controls .control-row input[type="checkbox"]::before {
        content: ""; position: absolute; width: 14px; height: 14px;
        border-radius: 50%; background-color: white; top: 2px; left: 2px;
        transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
      #debug-controls .control-row input[type="checkbox"]:checked {
        background-color: #b0c4de;
      }
      #debug-controls .control-row input[type="checkbox"]:checked::before {
        transform: translateX(22px);
      }
      #debug-controls .control-row:has(input[type="range"]) label {
        flex-basis: 170px; flex-shrink: 0;
      }
      #debug-controls input[type="range"] {
        flex-grow: 1; margin: 0; cursor: pointer; -webkit-appearance: none;
        appearance: none; background: transparent; height: 18px; vertical-align: middle;
      }
      #debug-controls input[type="range"]::-webkit-slider-runnable-track {
        height: 6px; background: #555; border-radius: 3px;
      }
      #debug-controls input[type="range"]::-moz-range-track {
        height: 6px; background: #555; border-radius: 3px;
      }
      #debug-controls input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; margin-top: -5px;
        background: #b0c4de; height: 16px; width: 16px;
        border-radius: 50%; border: 1px solid #333;
      }
      #debug-controls input[type="range"]::-moz-range-thumb {
        background: #b0c4de; height: 16px; width: 16px;
        border-radius: 50%; border: 1px solid #333; border: none;
      }
      #debug-controls .control-row:has(input[type="range"]) span:not(.info-icon) {
        width: 55px; min-width: 55px; text-align: right; flex-shrink: 0;
      }
      .info-icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 16px; height: 16px; border-radius: 50%;
        background-color: #555; color: white; font-size: 10px;
        font-style: italic; font-weight: bold; font-family: 'Georgia', serif;
        cursor: help; user-select: none; flex-shrink: 0;
      }
      .debugger-section {
        display: flex; flex-direction: column; gap: 6px;
      }
      .debugger-section-content {
        display: none; flex-direction: column; gap: 8px;
      }

      /* Element List Styles */
      .element-list { /* Scroll container */
        min-height: ${elementListContainerHeight}px;
        max-height: ${elementListContainerHeight}px; 
        overflow-y: auto;
        background-color: rgba(20, 20, 20, 0.5);
        border-radius: 3px;
        padding: 0;
        display: flex;
      }

      /* Modern Scrollbar Styling */
      .element-list::-webkit-scrollbar {
        width: 8px; 
      }
      .element-list::-webkit-scrollbar-track {
        background: rgba(30, 30, 30, 0.5); 
        border-radius: 4px;
      }
      .element-list::-webkit-scrollbar-thumb {
        background-color: rgba(176, 196, 222, 0.5); 
        border-radius: 4px; 
        border: 2px solid rgba(0, 0, 0, 0.2); 
      }
      .element-list::-webkit-scrollbar-thumb:hover {
        background-color: rgba(176, 196, 222, 0.7);
      }
      /* Firefox scrollbar styling */
      .element-list {
        scrollbar-width: thin;
        scrollbar-color: rgba(176, 196, 222, 0.5) rgba(30, 30, 30, 0.5);
      }


      #element-list-items-container { 
        display: flex;
        flex-wrap: wrap;
        gap: ${elementListGap}px;
        padding: ${elementListItemsContainerPadding}px;
        min-height: ${rowsContentHeight}px;
        box-sizing: border-box;
        align-content: flex-start;
      }
      #element-list-items-container > em {
        flex-basis: 100%;
        text-align: center;
        padding: 10px 0;
        font-style: italic;
        color: #ccc;
        font-size: 12px;
      }
      .element-list-item {
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
      .element-list-item .status-indicator {
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
      .element-list-item.hovering .status-indicator {
        background-color: oklch(83.7% 0.128 66.29 / 0.7);
      }
      .element-list-item.trajectory-hit .status-indicator {
        background-color: oklch(89.7% 0.196 126.665 / 0.7);
      }
      .element-list-item.hovering.trajectory-hit .status-indicator {
        background: linear-gradient(45deg, oklch(89.7% 0.196 126.665 / 0.7) 50%, oklch(83.7% 0.128 66.29 / 0.7) 50%);
      }
      .element-list-item .element-name {
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px; 
        font-weight: bold;
      }
      .element-list-item .hit-behavior,
      .element-list-item .hit-slop {
        font-size: 10px; 
        color: #b0b0b0;
        padding: 2px 5px; 
        border-radius: 3px; 
        background-color: rgba(0,0,0,0.2);
        flex-shrink: 0;
      }
    `
  }
}
