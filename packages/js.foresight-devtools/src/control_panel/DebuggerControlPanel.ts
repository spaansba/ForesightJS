import type {
  ForesightElementData,
  ForesightManagerSettings,
  UpdateForsightManagerSettings,
} from "js.foresight"
import { ForesightManager } from "js.foresight"
import type {
  DebuggerBooleanSettingKeys,
  DebuggerSettings,
  ManagerBooleanSettingKeys,
  NumericSettingKeys,
  SectionStates,
} from "../types/types"

import {
  MAX_POSITION_HISTORY_SIZE,
  MAX_SCROLL_MARGIN,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_POSITION_HISTORY_SIZE,
  MIN_SCROLL_MARGIN,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
  POSITION_HISTORY_SIZE_UNIT,
  SCROLL_MARGIN_UNIT,
  TAB_OFFSET_UNIT,
  TRAJECTORY_PREDICTION_TIME_UNIT,
} from "../constants"
import type { ForesightDebugger } from "../debugger/ForesightDebugger"
import { createAndAppendStyle } from "../helpers/createAndAppend"
import { objectToMethodCall } from "../helpers/objectToMethodCall"
import { ControlPanelElementList } from "./ControlPanelElementList"

const COPY_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
const TICK_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
const SORT_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`

export class DebuggerControlPanel {
  private foresightManagerInstance: ForesightManager
  private debuggerInstance: ForesightDebugger
  private static debuggerControlPanelInstance: DebuggerControlPanel
  private elementListManager!: ControlPanelElementList

  // These properties will be assigned in _setupDOMAndListeners
  private shadowRoot!: ShadowRoot
  private controlsContainer!: HTMLElement
  private controlPanelStyleElement!: HTMLStyleElement

  private trajectoryEnabledCheckbox: HTMLInputElement | null = null
  private tabEnabledCheckbox: HTMLInputElement | null = null
  private scrollEnabledCheckbox: HTMLInputElement | null = null
  private historySizeSlider: HTMLInputElement | null = null
  private historyValueSpan: HTMLSpanElement | null = null
  private predictionTimeSlider: HTMLInputElement | null = null
  private predictionValueSpan: HTMLSpanElement | null = null
  private tabOffsetSlider: HTMLInputElement | null = null
  private tabOffsetValueSpan: HTMLSpanElement | null = null
  private scrollMarginSlider: HTMLInputElement | null = null
  private scrollMarginValueSpan: HTMLSpanElement | null = null
  private showNameTagsCheckbox: HTMLInputElement | null = null

  private containerMinimizeButton: HTMLButtonElement | null = null
  private allSettingsSectionsContainer: HTMLElement | null = null
  private debuggerElementsSection: HTMLElement | null = null
  private isContainerMinimized: boolean = false

  private isMouseSettingsMinimized: boolean = true
  private isKeyboardSettingsMinimized: boolean = true
  private isScrollSettingsMinimized: boolean = true
  private isGeneralSettingsMinimized: boolean = true
  private readonly SESSION_STORAGE_KEY = "jsforesightDebuggerSectionStates"

  private copySettingsButton: HTMLButtonElement | null = null
  private minimizedElementCount: HTMLSpanElement | null = null
  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null

  private constructor(foresightManager: ForesightManager, debuggerInstance: ForesightDebugger) {
    this.foresightManagerInstance = foresightManager
    this.debuggerInstance = debuggerInstance
  }

  /**
   * The initialize method now creates the instance if needed,
   * then calls the setup method to ensure the UI is ready.
   */
  public static initialize(
    foresightManager: ForesightManager,
    debuggerInstance: ForesightDebugger,
    shadowRoot: ShadowRoot,
    debuggerSettings: DebuggerSettings
  ): DebuggerControlPanel {
    if (!DebuggerControlPanel.isInitiated) {
      DebuggerControlPanel.debuggerControlPanelInstance = new DebuggerControlPanel(
        foresightManager,
        debuggerInstance
      )
    }

    const instance = DebuggerControlPanel.debuggerControlPanelInstance

    // This will build the DOM on first run or rebuild it on subsequent runs after cleanup.
    instance._setupDOMAndListeners(shadowRoot, debuggerSettings)

    return instance
  }

  /**
   * All DOM creation and event listener setup logic is moved here.
   * This method can be called to "revive" a cleaned-up instance.
   */
  private _setupDOMAndListeners(shadowRoot: ShadowRoot, debuggerSettings: DebuggerSettings) {
    // Guard clause to prevent re-running if the UI is already active.
    if (this.controlsContainer) {
      return
    }

    this.shadowRoot = shadowRoot
    this.isContainerMinimized = debuggerSettings.isControlPanelDefaultMinimized
    this.controlsContainer = this.createControlContainer()
    this.shadowRoot.appendChild(this.controlsContainer)

    this.controlPanelStyleElement = createAndAppendStyle(
      this.getStyles(),
      this.shadowRoot,
      "debug-control-panel"
    )
    this.queryDOMElements()
    this.initializeElementListManager()
    this.originalSectionStates()
    this.setupEventListeners()
    this.updateContainerVisibilityState()
    this.updateControlsState(
      this.foresightManagerInstance.getManagerData.globalSettings,
      debuggerSettings
    )
  }

  private static get isInitiated(): boolean {
    return !!DebuggerControlPanel.debuggerControlPanelInstance
  }

  private loadSectionStatesFromSessionStorage(): Partial<SectionStates> {
    const storedStatesRaw = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
    let loadedStates: Partial<SectionStates> = {}

    if (storedStatesRaw) {
      loadedStates = JSON.parse(storedStatesRaw)
    }

    this.isMouseSettingsMinimized = loadedStates.mouse ?? true
    this.isKeyboardSettingsMinimized = loadedStates.keyboard ?? true
    this.isScrollSettingsMinimized = loadedStates.scroll ?? true
    this.isGeneralSettingsMinimized = loadedStates.general ?? true
    return loadedStates
  }

  private saveSectionStatesToSessionStorage() {
    const states: SectionStates = {
      mouse: this.isMouseSettingsMinimized,
      keyboard: this.isKeyboardSettingsMinimized,
      scroll: this.isScrollSettingsMinimized,
      general: this.isGeneralSettingsMinimized,
    }
    try {
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(states))
    } catch (e) {
      console.error("Foresight Debugger: Could not save section states to session storage.", e)
    }
  }

  public updateMinimizedElementCount() {
    if (!this.minimizedElementCount) return
    const registeredElements = Array.from(
      this.foresightManagerInstance.registeredElements.entries()
    )
    const total = registeredElements.length
    const isIntersecting = registeredElements.filter(
      ([_, elementData]) => elementData.isIntersectingWithViewport
    ).length

    const visibleTitle = [
      "Element Visibility Status",
      "-----------------------------------------------------",
      `Visible in Viewport: ${isIntersecting}`,
      `Not in Viewport: ${total - isIntersecting}`,
      `Total Registered Elements: ${total}`,
      "",
      "Note: Only elements visible in the viewport",
      "are actively tracked by intersection observers.",
    ]
    this.minimizedElementCount.textContent = `${isIntersecting}/${total}`
    this.minimizedElementCount.title = visibleTitle.join("\n")
  }

  private queryDOMElements() {
    this.trajectoryEnabledCheckbox = this.controlsContainer.querySelector("#trajectory-enabled")
    this.tabEnabledCheckbox = this.controlsContainer.querySelector("#tab-enabled")
    this.scrollEnabledCheckbox = this.controlsContainer.querySelector("#scroll-enabled")
    this.historySizeSlider = this.controlsContainer.querySelector("#history-size")
    this.historyValueSpan = this.controlsContainer.querySelector("#history-value")
    this.predictionTimeSlider = this.controlsContainer.querySelector("#prediction-time")
    this.predictionValueSpan = this.controlsContainer.querySelector("#prediction-value")
    this.tabOffsetSlider = this.controlsContainer.querySelector("#tab-offset")
    this.tabOffsetValueSpan = this.controlsContainer.querySelector("#tab-offset-value")
    this.scrollMarginSlider = this.controlsContainer.querySelector("#scroll-margin")
    this.scrollMarginValueSpan = this.controlsContainer.querySelector("#scroll-margin-value")
    this.showNameTagsCheckbox = this.controlsContainer.querySelector("#toggle-name-tags")
    this.containerMinimizeButton = this.controlsContainer.querySelector(".minimize-button")
    this.allSettingsSectionsContainer = this.controlsContainer.querySelector(
      ".all-settings-sections-container"
    )
    this.debuggerElementsSection = this.controlsContainer.querySelector(".debugger-elements")
    this.copySettingsButton = this.controlsContainer.querySelector(".copy-settings-button")
    this.minimizedElementCount = this.controlsContainer.querySelector(".minimized-element-count")
  }

  private initializeElementListManager() {
    this.elementListManager = new ControlPanelElementList(
      this.foresightManagerInstance,
      this.debuggerInstance
    )
    this.elementListManager.initialize(this.controlsContainer)
  }

  private handleCopySettings() {
    if (!this.copySettingsButton) return
    navigator.clipboard
      .writeText(
        objectToMethodCall(
          this.foresightManagerInstance.getManagerData.globalSettings,
          "ForesightManager.initialize"
        )
      )
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
      .catch(err => {
        console.error("Foresight Debugger: Could not copy settings to clipboard", err)
      })
  }

  private createInputEventListener(
    element: HTMLInputElement | null,
    spanElement: HTMLSpanElement | null,
    unit: string,
    setting: NumericSettingKeys
  ) {
    if (!element || !spanElement) {
      return
    }
    element.addEventListener("input", e => {
      const value = parseInt((e.target as HTMLInputElement).value, 10)
      spanElement.textContent = `${value} ${unit}`
      this.foresightManagerInstance.alterGlobalSettings({
        [setting]: value,
      })
    })
  }

  private createChangeEventListener(
    element: HTMLElement | null,
    setting: ManagerBooleanSettingKeys | DebuggerBooleanSettingKeys
  ) {
    if (!element) {
      return
    }

    // This is the crucial part. We get an object representing the debugger's
    // settings so we can check against it at runtime.
    // Replace `this.debuggerInstance.settings` with however you access
    // the settings object on your instance.
    const debuggerSettings = this.debuggerInstance.getDebuggerData.settings

    element.addEventListener("change", e => {
      const isChecked = (e.target as HTMLInputElement).checked

      // The `in` operator checks if the key (e.g., "showOverlay") exists on the
      // debuggerSettings object. This is a true runtime check.
      if (setting in debuggerSettings) {
        // Although we've confirmed the key belongs to the debugger, TypeScript's
        // control flow analysis doesn't automatically narrow the type of the
        // `setting` variable itself here.
        // So, we use a type assertion to satisfy the compiler.
        this.debuggerInstance.alterDebuggerSettings({
          [setting]: isChecked,
        } as Partial<DebuggerSettings>)
      } else {
        // If the key is not in debuggerSettings, it must be a manager setting.
        this.foresightManagerInstance.alterGlobalSettings({
          [setting]: isChecked,
        } as Partial<UpdateForsightManagerSettings>)
      }
    })
  }

  private createSectionVisibilityToggleEventListener(
    section: HTMLDivElement | null,
    isMinimizedFlagName:
      | "isMouseSettingsMinimized"
      | "isKeyboardSettingsMinimized"
      | "isScrollSettingsMinimized"
      | "isGeneralSettingsMinimized"
  ) {
    const sectionHeader = section?.querySelector(".debugger-section-header")
    sectionHeader?.addEventListener("click", e => {
      e.stopPropagation()
      this.toggleMinimizeSection(section, (this[isMinimizedFlagName] = !this[isMinimizedFlagName]))
    })
  }

  private setupEventListeners() {
    this.createChangeEventListener(this.trajectoryEnabledCheckbox, "enableMousePrediction")
    this.createChangeEventListener(this.tabEnabledCheckbox, "enableTabPrediction")
    this.createChangeEventListener(this.scrollEnabledCheckbox, "enableScrollPrediction")
    this.createChangeEventListener(this.showNameTagsCheckbox, "showNameTags")
    this.createInputEventListener(
      this.historySizeSlider,
      this.historyValueSpan,
      POSITION_HISTORY_SIZE_UNIT,
      "positionHistorySize"
    )

    this.createInputEventListener(
      this.predictionTimeSlider,
      this.predictionValueSpan,
      TRAJECTORY_PREDICTION_TIME_UNIT,
      "trajectoryPredictionTime"
    )

    this.createInputEventListener(
      this.tabOffsetSlider,
      this.tabOffsetValueSpan,
      TAB_OFFSET_UNIT,
      "tabOffset"
    )

    this.createInputEventListener(
      this.scrollMarginSlider,
      this.scrollMarginValueSpan,
      SCROLL_MARGIN_UNIT,
      "scrollMargin"
    )

    this.containerMinimizeButton?.addEventListener("click", () => {
      this.isContainerMinimized = !this.isContainerMinimized
      this.updateContainerVisibilityState()
    })
    this.copySettingsButton?.addEventListener("click", this.handleCopySettings.bind(this))

    this.createSectionVisibilityToggleEventListener(
      this.controlsContainer.querySelector(".mouse-settings-section"),
      "isMouseSettingsMinimized"
    )
    this.createSectionVisibilityToggleEventListener(
      this.controlsContainer.querySelector(".keyboard-settings-section"),
      "isKeyboardSettingsMinimized"
    )
    this.createSectionVisibilityToggleEventListener(
      this.controlsContainer.querySelector(".scroll-settings-section"),
      "isScrollSettingsMinimized"
    )
    this.createSectionVisibilityToggleEventListener(
      this.controlsContainer.querySelector(".general-settings-section"),
      "isGeneralSettingsMinimized"
    )
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
    this.toggleMinimizeSection(
      this.controlsContainer.querySelector(".mouse-settings-section"),
      states.mouse ?? true
    )
    this.toggleMinimizeSection(
      this.controlsContainer.querySelector(".keyboard-settings-section"),
      states.keyboard ?? true
    )
    this.toggleMinimizeSection(
      this.controlsContainer.querySelector(".scroll-settings-section"),
      states.scroll ?? true
    )
    this.toggleMinimizeSection(
      this.controlsContainer.querySelector(".general-settings-section"),
      states.general ?? true
    )
    // Ensure the element list is always open by default
    const elementListContent = this.debuggerElementsSection?.querySelector(
      ".debugger-section-content"
    )
    if (elementListContent) {
      ;(elementListContent as HTMLElement).style.display = "flex"
    }
  }

  private updateContainerVisibilityState() {
    if (!this.containerMinimizeButton) return
    if (this.isContainerMinimized) {
      this.controlsContainer.classList.add("minimized")
      this.containerMinimizeButton.textContent = "+"
      if (this.allSettingsSectionsContainer)
        this.allSettingsSectionsContainer.style.display = "none"
      if (this.debuggerElementsSection) this.debuggerElementsSection.style.display = "none"
      if (this.copySettingsButton) this.copySettingsButton.style.display = "none"
      if (this.minimizedElementCount) this.minimizedElementCount.style.display = ""
    } else {
      this.controlsContainer.classList.remove("minimized")
      this.containerMinimizeButton.textContent = "-"
      if (this.allSettingsSectionsContainer) this.allSettingsSectionsContainer.style.display = ""
      if (this.debuggerElementsSection) this.debuggerElementsSection.style.display = ""
      if (this.copySettingsButton) this.copySettingsButton.style.display = ""
      if (this.minimizedElementCount) this.minimizedElementCount.style.display = "none"
    }
  }

  public updateControlsState(
    managerSettings: ForesightManagerSettings,
    debuggerSettings: DebuggerSettings
  ) {
    if (this.trajectoryEnabledCheckbox) {
      this.trajectoryEnabledCheckbox.checked = managerSettings.enableMousePrediction
    }
    if (this.tabEnabledCheckbox) {
      this.tabEnabledCheckbox.checked = managerSettings.enableTabPrediction
    }
    if (this.scrollEnabledCheckbox) {
      this.scrollEnabledCheckbox.checked = managerSettings.enableScrollPrediction
    }
    if (this.showNameTagsCheckbox) {
      this.showNameTagsCheckbox.checked = debuggerSettings.showNameTags
    }
    this.elementListManager.updateSortOptionUI(debuggerSettings.sortElementList ?? "visibility")
    if (this.historySizeSlider && this.historyValueSpan) {
      this.historySizeSlider.value = managerSettings.positionHistorySize.toString()
      this.historyValueSpan.textContent = `${managerSettings.positionHistorySize} ${POSITION_HISTORY_SIZE_UNIT}`
    }
    if (this.predictionTimeSlider && this.predictionValueSpan) {
      this.predictionTimeSlider.value = managerSettings.trajectoryPredictionTime.toString()
      this.predictionValueSpan.textContent = `${managerSettings.trajectoryPredictionTime} ${TRAJECTORY_PREDICTION_TIME_UNIT}`
    }
    if (this.tabOffsetSlider && this.tabOffsetValueSpan) {
      this.tabOffsetSlider.value = managerSettings.tabOffset.toString()
      this.tabOffsetValueSpan.textContent = `${managerSettings.tabOffset} ${TAB_OFFSET_UNIT}`
    }
    if (this.scrollMarginSlider && this.scrollMarginValueSpan) {
      this.scrollMarginSlider.value = managerSettings.scrollMargin.toString()
      this.scrollMarginValueSpan.textContent = `${managerSettings.scrollMargin} ${SCROLL_MARGIN_UNIT}`
    }
  }

  public removeElementFromListContainer(elementData: ForesightElementData) {
    this.elementListManager.removeElementFromListContainer(elementData)
  }

  public updateElementVisibilityStatus(elementData: ForesightElementData) {
    this.elementListManager.updateElementVisibilityStatus(elementData)
  }

  public addElementToList(elementData: ForesightElementData) {
    this.elementListManager.addElementToList(elementData)
  }
  /**
   * The cleanup method is updated to be more thorough, nullifying all
   * DOM-related properties to put the instance in a dormant state.
   */
  public cleanup() {
    this.controlsContainer?.remove()
    this.controlPanelStyleElement?.remove()

    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId)
      this.copyTimeoutId = null
    }

    this.elementListManager.cleanup()

    // Nullify all DOM-related properties to signal it's "cleaned up"
    this.controlsContainer = null!
    this.controlPanelStyleElement = null!
    this.containerMinimizeButton = null
    this.allSettingsSectionsContainer = null
    this.debuggerElementsSection = null
    this.trajectoryEnabledCheckbox = null
    this.tabEnabledCheckbox = null
    this.scrollEnabledCheckbox = null
    this.historySizeSlider = null
    this.historyValueSpan = null
    this.predictionTimeSlider = null
    this.predictionValueSpan = null
    this.tabOffsetSlider = null
    this.tabOffsetValueSpan = null
    this.scrollMarginSlider = null
    this.scrollMarginValueSpan = null
    this.showNameTagsCheckbox = null
    this.copySettingsButton = null
  }

  private createControlContainer(): HTMLElement {
    const container = document.createElement("div")
    container.id = "debug-controls"
    container.innerHTML = /* html */ `
      <div class="debugger-title-container">
        <button class="minimize-button">-</button>
        <div class="title-group">
          <h2>Foresight Debugger</h2>
         <span class="info-icon" title="${[
           "Foresight Debugger Information",
           "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
           "Session-Only Changes:",
           "All adjustments made here apply only to the",
           "current browser session and won't persist.",
           "",
           "Permanent Configuration:",
           "To make lasting changes, update the initial",
           "values in your ForesightManager.initialize().",
           "",
           "You can copy the current debugger settings",
           "with the button on the right",
         ].join("\n")}">i</span>
        </div>
           <button class="copy-settings-button" title="${[
             "Copy Settings to Clipboard",
             "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
             "Copies the current configuration as a",
             "formatted method call that you can paste",
             "directly into your code.",
           ].join("\n")}">
          ${COPY_SVG_ICON}
        </button>
        <span class="minimized-element-count">
        </span>
      </div>

      <div class="all-settings-sections-container">
        <div class="debugger-section mouse-settings-section">
          <div class="debugger-section-header collapsible">
            <h3>Mouse Settings</h3>
            <button class="section-minimize-button">-</button>
          </div>
          <div class="debugger-section-content mouse-settings-content">
            <div class="control-row">
             <label for="trajectory-enabled">
                Enable Mouse Prediction
                <span class="info-icon" title="${[
                  "Mouse Prediction Control",
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                  "When enabled: Predicts mouse movement",
                  "trajectory and triggers callbacks before",
                  "the cursor reaches the target element.",
                  "",
                  "When disabled: Only direct hover events",
                  "trigger actions (next to tab/scroll).",
                  "",
                  "Property: enableMousePrediction",
                ].join("\n")}">i</span>
              </label>
              <input type="checkbox" id="trajectory-enabled">
            </div>
            <div class="control-row">
             <label for="history-size">
                History Size
                <span class="info-icon" title="${[
                  "Position History",
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                  "Controls how many past mouse positions",
                  "are stored for velocity calculations.",
                  "",
                  "Higher values:",
                  "   • More accurate trajectory predictions",
                  "   • Smoother movement detection",
                  "   • Slightly increased processing overhead",
                  "",
                  "Lower values:",
                  "   • Faster response to direction changes",
                  "   • Less memory usage",
                  "   • May be less accurate for fast movements",
                  "",
                  "Property: positionHistorySize",
                ].join("\n")}">i</span>
              </label>
              <input type="range" id="history-size" min="${MIN_POSITION_HISTORY_SIZE}" max="${MAX_POSITION_HISTORY_SIZE}">
              <span id="history-value"></span>
            </div>
            <div class="control-row">
            <label for="prediction-time">
                Prediction Time
                <span class="info-icon" title="${[
                  "Trajectory Prediction Time",
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                  `How far into the future (in ${TRAJECTORY_PREDICTION_TIME_UNIT})`,
                  "to calculate the mouse trajectory path.",
                  "",
                  "Larger values:",
                  "   • Elements are detected sooner",
                  "   • More time for preloading/preparation",
                  "   • May trigger false positives for curved paths",
                  "",
                  "Smaller values:",
                  "   • More precise targeting",
                  "   • Reduced false positive rate",
                  "   • Less time for preparation",
                  "",
                  "Property: trajectoryPredictionTime",
                ].join("\n")}">i</span>
              </label>
              <input type="range" id="prediction-time" min="${MIN_TRAJECTORY_PREDICTION_TIME}" max="${MAX_TRAJECTORY_PREDICTION_TIME}" step="10">
              <span id="prediction-value"></span>
            </div>
          </div>
        </div>

        <div class="debugger-section keyboard-settings-section">
          <div class="debugger-section-header collapsible">
            <h3>Keyboard Settings</h3>
            <button class="section-minimize-button">-</button>
          </div>
          <div class="debugger-section-content keyboard-settings-content">
            <div class="control-row">
             <label for="tab-enabled">
                Enable Tab Prediction
                <span class="info-icon" title="${[
                  "Tab Navigation Prediction",
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                  "When enabled: Callbacks are executed when",
                  `the user is ${this.foresightManagerInstance.getManagerData.globalSettings.tabOffset} (tabOffset) ${TAB_OFFSET_UNIT} away from`,
                  "a registered element during tab navigation.",
                  "",
                  "(works with Shift+Tab too).",
                  "",
                  "Property: enableTabPrediction",
                ].join("\n")}">i</span>
              </label>
              <input type="checkbox" id="tab-enabled">
            </div>
            <div class="control-row">
               <label for="tab-offset">
                Tab Offset
                <span class="info-icon" title="${[
                  "Tab Offset",
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                  "Number of tabbable elements to look ahead",
                  "when predicting tab navigation targets.",
                  "",
                  "How it works:",
                  "   • Tracks the current focused element",
                  "   • Looks ahead by the specified offset",
                  "   • Triggers callbacks for registered elements",
                  "     within that range",
                  "",
                  "Property: tabOffset",
                ].join("\n")}">i</span>
              </label>
              <input type="range" id="tab-offset" min="${MIN_TAB_OFFSET}" max="${MAX_TAB_OFFSET}" step="1">
              <span id="tab-offset-value"></span>
            </div>
          </div>
        </div>

        <div class="debugger-section scroll-settings-section">
          <div class="debugger-section-header collapsible">
            <h3>Scroll Settings</h3>
            <button class="section-minimize-button">-</button>
          </div>
        <div class="debugger-section-content scroll-settings-content">
          <div class="control-row">
          <label for="scroll-enabled">
              Enable Scroll Prediction
              <span class="info-icon" title="${[
                "Scroll Prediction",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                "Enables predictive scrolling based on mouse",
                "position and scroll direction.",
                "",
                "When enabled, calculates scroll direction from",
                "mouse movement and triggers callbacks for",
                "elements that intersect the predicted path.",
                "",
                "Property: enableScrollPrediction",
              ].join("\n")}">i</span>
            </label>
            <input type="checkbox" id="scroll-enabled">
          </div>
          <div class="control-row">
            <label for="scroll-margin">
              Scroll Margin
              <span class="info-icon" title="${[
                "Scroll Margin",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                "Sets the pixel distance to check from the",
                "mouse position in the scroll direction.",
                "",
                "Higher values check further ahead, allowing",
                "earlier detection of elements that will come",
                "into view during scrolling.",
                "",
                "Property: scrollMargin",
              ].join("\n")}">i</span>
            </label>
            <input type="range" id="scroll-margin" min="${MIN_SCROLL_MARGIN}" max="${MAX_SCROLL_MARGIN}" step="10">
            <span id="scroll-margin-value"></span>
          </div>
        </div>

        <div class="debugger-section general-settings-section">
          <div class="debugger-section-header collapsible">
            <h3>General Settings</h3>
            <button class="section-minimize-button">-</button>
          </div>
          <div class="debugger-section-content general-settings-content">
           <div class="control-row">
              <label for="toggle-name-tags">
                Show Name Tags
                <span class="info-icon" title="${[
                  "Visual Debug Name Tags",
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                  "When enabled: Displays name tags over",
                  "each registered element in debug mode.",
                  "",
                  "Property: debuggerSettings.showNameTags",
                ].join("\n")}">i</span>
              </label>
              <input type="checkbox" id="toggle-name-tags">
            </div>
          </div>
        </div>
      </div>

      <div class="debugger-section debugger-elements">
        <div class="debugger-section-header elements-list-header">
          <h3>Elements <span id="element-count"></span> <span id="callback-count"></span></h3>
          <div class="header-controls">
            <div class="sort-control-container">
              <button class="sort-button" title="Change element list sort order">
                ${SORT_SVG_ICON}
              </button>
              <div id="sort-options-popup">
              <button
                data-sort="visibility"
                title="${[
                  "Sort by Visibility",
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                  "Sorts elements by their viewport visibility",
                  "(visible elements first), with a secondary",
                  "sort by their order in the document.",
                  "",
                  "Property: debuggerSettings.sortElementList",
                  "Value: 'visibility'",
                ].join("\n")}">
                  Visibility
                </button>
                <button
                  data-sort="documentOrder"
                  title="${[
                    "Sort by Document Order",
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                    "Sorts elements based on their order of",
                    "appearance in the document's structure",
                    "(matching the HTML source).",
                    "",
                    "Property: debuggerSettings.sortElementList",
                    "Value: 'documentOrder'",
                  ].join("\n")}"
                >
                  Document Order
                </button>
                <button
                  data-sort="insertionOrder"
                  title="${[
                    "Sort by Insertion Order",
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                    "Sorts elements based on the order they",
                    "were registered with the ForesightManager.",
                    "",
                    "Property: debuggerSettings.sortElementList",
                    "Value: 'insertionOrder'",
                  ].join("\n")}"
                >
                  Insertion Order
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="debugger-section-content element-list">
          <div id="element-list-items-container">
          </div>
        </div>
      </div>
    `
    return container
  }

  private getStyles(): string {
    const elementItemHeight = 35 // px
    const elementListGap = 3 // px
    const elementListItemsContainerPadding = 6 // px
    const numRowsToShow = 6
    const numItemsPerRow = 1

    const rowsContentHeight =
      elementItemHeight * numRowsToShow + elementListGap * (numRowsToShow - 1)
    const elementListContainerHeight = rowsContentHeight + elementListItemsContainerPadding * 2

    return /* css */ `
      #debug-controls {
        position: fixed; bottom: 10px; right: 10px;
        background-color: rgba(0, 0, 0, 0.90); color: white; padding: 12px;
        border-radius: 5px; font-family: Arial, sans-serif; font-size: 13px;
        z-index: 10001; pointer-events: auto; display: flex; flex-direction: column; gap: 8px;
        width: 400px;
        transition: width 0.3s ease, height 0.3s ease;
      }
      #debug-controls.minimized {
        width: 250px;
        overflow: hidden;
        padding: 12px 0; 
      }
      #debug-controls.minimized .debugger-title-container {
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

      #element-count,#callback-count {
        font-size: 12px;
        color: #9e9e9e;
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
        padding-inline: 0px;
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

      .minimized-element-count {
         font-size: 14px;
         min-width: 30px;
         text-align: right;
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
      }
      .debugger-section-header.collapsible {
        cursor: pointer;
      }
      .debugger-section-header h3 {
         margin: 0;
         font-size: 14px;
         font-weight: bold;
         color: #b0c4de;
         flex-grow: 1;
      }

      .section-minimize-button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0px;
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
      .elements-list-header { cursor: default; }
      .header-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sort-control-container {
        position: relative;
      }
      .sort-button {
        background: none; border: none; color: white; cursor: pointer;
        padding: 0; display: flex; align-items: center; justify-content: center;
      }
      .sort-button svg {
        width: 16px; height: 16px; stroke: white; transition: stroke 0.2s;
      }
      .sort-button:hover svg { stroke: white; }
      
      #sort-options-popup {
        position: absolute;
        bottom: calc(100% + 5px);
        right: -5px;
        z-index: 10;
        display: none;
        flex-direction: column;
        gap: 4px;
        background-color: #3a3a3a;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 3px;
        width: 200px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      #sort-options-popup.active {
        display: flex;
      }
      #sort-options-popup button {
        background: none; border: none; color: #ccc;
        font-size: 12px; text-align: left; padding: 5px 8px;
        cursor: pointer; border-radius: 3px;
        transition: background-color 0.2s, color 0.2s;
        display: flex;
        align-items: center;
        height: 26px;
      }
      #sort-options-popup button:hover {
        background-color: #555;
        color: white;
      }
      #sort-options-popup button.active-sort-option {
        color: #b0c4de;
        font-weight: bold;
      }
      #sort-options-popup button.active-sort-option::before {
        content: '✓';
        margin-right: 6px;
        width: 10px;
      }
      #sort-options-popup button::before {
        content: '';
        margin-right: 6px;
        width: 10px;
      }

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
      .element-list::-webkit-scrollbar { width: 8px; }
      .element-list::-webkit-scrollbar-track { background: rgba(30, 30, 30, 0.5); border-radius: 4px; }
      .element-list::-webkit-scrollbar-thumb { background-color: rgba(176, 196, 222, 0.5); border-radius: 4px; border: 2px solid rgba(0, 0, 0, 0.2); }
      .element-list::-webkit-scrollbar-thumb:hover { background-color: rgba(176, 196, 222, 0.7); }
      .element-list { scrollbar-width: thin; scrollbar-color: rgba(176, 196, 222, 0.5) rgba(30, 30, 30, 0.5); }

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
        transition: background-color 0.2s ease, opacity 0.2s ease;
        font-size: 11px; 
        overflow: hidden;
      }
      
      /* Viewport intersection styling */
      .element-list-item.not-in-viewport { opacity: 0.4; }
      
      .element-list-item .element-name {
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px; 
        font-weight: bold;
      }
      .element-list-item .intersecting-indicator {
        font-size: 12px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
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
