// DebuggerControlPanel.ts
import type { ForesightManager } from "../Manager/ForesightManager"
import type {
  ForesightElementData,
  ForesightElement,
  DebuggerSettings,
  NumericSettingKeys,
  BooleanSettingKeys,
  ForesightManagerSettings,
} from "../types/types"
import {
  DEFAULT_IS_DEBUGGER_MINIMIZED,
  DEFAULT_SHOW_NAME_TAGS,
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
} from "../Manager/constants"
import { objectToMethodCall } from "./helpers/objectToMethodCall"
import { createAndAppendStyle } from "./helpers/createAndAppend"

type SectionStates = {
  mouse: boolean
  keyboard: boolean
  scroll: boolean
  general: boolean
  elements: boolean
}

const COPY_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
const TICK_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

export class DebuggerControlPanel {
  private foresightManagerInstance: ForesightManager
  private static debuggerControlPanelInstance: DebuggerControlPanel

  // These properties will be assigned in _setupDOMAndListeners
  private shadowRoot!: ShadowRoot
  private controlsContainer!: HTMLElement
  private controlPanelStyleElement!: HTMLStyleElement
  private elementListItemsContainer: HTMLElement | null = null
  private elementCountSpan: HTMLSpanElement | null = null
  private callbackCountSpan: HTMLSpanElement | null = null
  private elementListItems: Map<ForesightElement, HTMLElement> = new Map()

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
  private isElementsListMinimized: boolean = true
  private readonly SESSION_STORAGE_KEY = "jsforesightDebuggerSectionStates"

  private copySettingsButton: HTMLButtonElement | null = null
  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null

  /**
   * The constructor is now minimal, only storing the manager instance.
   * The actual setup is deferred to _setupDOMAndListeners.
   */
  private constructor(foresightManager: ForesightManager) {
    this.foresightManagerInstance = foresightManager
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
    this.isContainerMinimized =
      debuggerSettings.isControlPanelDefaultMinimized ?? DEFAULT_IS_DEBUGGER_MINIMIZED
    this.controlsContainer = this.createControlContainer()
    this.shadowRoot.appendChild(this.controlsContainer)

    this.controlPanelStyleElement = createAndAppendStyle(
      this.getStyles(),
      this.shadowRoot,
      "debug-control-panel"
    )
    this.queryDOMElements()
    this.originalSectionStates()
    this.setupEventListeners()
    this.refreshElementList()
    this.updateContainerVisibilityState()
  }

  /**
   * The initialize method now creates the instance if needed,
   * then calls the setup method to ensure the UI is ready.
   */
  public static initialize(
    foresightManager: ForesightManager,
    shadowRoot: ShadowRoot,
    debuggerSettings: DebuggerSettings
  ): DebuggerControlPanel {
    if (!DebuggerControlPanel.isInitiated) {
      DebuggerControlPanel.debuggerControlPanelInstance = new DebuggerControlPanel(foresightManager)
    }

    const instance = DebuggerControlPanel.debuggerControlPanelInstance

    // This will build the DOM on first run or rebuild it on subsequent runs after cleanup.
    instance._setupDOMAndListeners(shadowRoot, debuggerSettings)

    return instance
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
    this.isElementsListMinimized = loadedStates.elements ?? false
    return loadedStates
  }

  private saveSectionStatesToSessionStorage() {
    const states: SectionStates = {
      mouse: this.isMouseSettingsMinimized,
      keyboard: this.isKeyboardSettingsMinimized,
      scroll: this.isScrollSettingsMinimized,
      general: this.isGeneralSettingsMinimized,
      elements: this.isElementsListMinimized,
    }
    try {
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(states))
    } catch (e) {
      console.error("Foresight Debugger: Could not save section states to session storage.", e)
    }
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
    this.elementListItemsContainer = this.controlsContainer.querySelector(
      "#element-list-items-container"
    )
    this.showNameTagsCheckbox = this.controlsContainer.querySelector("#toggle-name-tags")
    this.elementCountSpan = this.controlsContainer.querySelector("#element-count")
    this.callbackCountSpan = this.controlsContainer.querySelector("#callback-count")
    this.containerMinimizeButton = this.controlsContainer.querySelector(".minimize-button")
    this.allSettingsSectionsContainer = this.controlsContainer.querySelector(
      ".all-settings-sections-container"
    )
    this.debuggerElementsSection = this.controlsContainer.querySelector(".debugger-elements")
    this.copySettingsButton = this.controlsContainer.querySelector(".copy-settings-button")
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
      .catch((err) => {
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
    element.addEventListener("input", (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10)
      spanElement.textContent = `${value} ${unit}`
      this.foresightManagerInstance.alterGlobalSettings({
        [setting]: value,
      })
    })
  }

  private createChangeEventListener(
    element: HTMLElement | null,
    setting: BooleanSettingKeys | "name-tag"
  ) {
    if (!element) {
      return
    }
    element.addEventListener("change", (e) => {
      if (setting === "name-tag") {
        this.foresightManagerInstance.alterGlobalSettings({
          debuggerSettings: {
            showNameTags: (e.target as HTMLInputElement).checked,
          },
        })
      } else {
        this.foresightManagerInstance.alterGlobalSettings({
          [setting]: (e.target as HTMLInputElement).checked,
        })
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
      | "isElementsListMinimized"
  ) {
    const sectionHeader = section?.querySelector(".debugger-section-header")
    sectionHeader?.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggleMinimizeSection(section, (this[isMinimizedFlagName] = !this[isMinimizedFlagName]))
    })
  }

  private setupEventListeners() {
    this.createChangeEventListener(this.trajectoryEnabledCheckbox, "enableMousePrediction")
    this.createChangeEventListener(this.tabEnabledCheckbox, "enableTabPrediction")
    this.createChangeEventListener(this.scrollEnabledCheckbox, "enableScrollPrediction")
    this.createChangeEventListener(this.showNameTagsCheckbox, "name-tag")
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
    this.createSectionVisibilityToggleEventListener(
      this.controlsContainer.querySelector(".debugger-elements"),
      "isElementsListMinimized"
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
    this.toggleMinimizeSection(
      this.controlsContainer.querySelector(".debugger-elements"),
      states.elements ?? false
    )
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
    } else {
      this.controlsContainer.classList.remove("minimized")
      this.containerMinimizeButton.textContent = "-"
      if (this.allSettingsSectionsContainer) this.allSettingsSectionsContainer.style.display = ""
      if (this.debuggerElementsSection) this.debuggerElementsSection.style.display = ""
      if (this.copySettingsButton) this.copySettingsButton.style.display = ""
    }
  }

  public updateControlsState(settings: ForesightManagerSettings) {
    if (this.trajectoryEnabledCheckbox) {
      this.trajectoryEnabledCheckbox.checked = settings.enableMousePrediction
    }
    if (this.tabEnabledCheckbox) {
      this.tabEnabledCheckbox.checked = settings.enableTabPrediction
    }
    if (this.scrollEnabledCheckbox) {
      this.scrollEnabledCheckbox.checked = settings.enableScrollPrediction
    }
    if (this.showNameTagsCheckbox) {
      this.showNameTagsCheckbox.checked =
        settings.debuggerSettings.showNameTags ?? DEFAULT_SHOW_NAME_TAGS
    }
    if (this.historySizeSlider && this.historyValueSpan) {
      this.historySizeSlider.value = settings.positionHistorySize.toString()
      this.historyValueSpan.textContent = `${settings.positionHistorySize} ${POSITION_HISTORY_SIZE_UNIT}`
    }
    if (this.predictionTimeSlider && this.predictionValueSpan) {
      this.predictionTimeSlider.value = settings.trajectoryPredictionTime.toString()
      this.predictionValueSpan.textContent = `${settings.trajectoryPredictionTime} ${TRAJECTORY_PREDICTION_TIME_UNIT}`
    }
    if (this.tabOffsetSlider && this.tabOffsetValueSpan) {
      this.tabOffsetSlider.value = settings.tabOffset.toString()
      this.tabOffsetValueSpan.textContent = `${settings.tabOffset} ${TAB_OFFSET_UNIT}`
    }
    if (this.scrollMarginSlider && this.scrollMarginValueSpan) {
      this.scrollMarginSlider.value = settings.scrollMargin.toString()
      this.scrollMarginValueSpan.textContent = `${settings.scrollMargin} ${SCROLL_MARGIN_UNIT}`
    }
  }

  // private create

  private refreshRegisteredElementCountDisplay(
    elementsMap: ReadonlyMap<Element, ForesightElementData>
  ) {
    if (!this.elementCountSpan || !this.callbackCountSpan) {
      return
    }

    let visibleElementCount = 0
    elementsMap.forEach((data) => {
      if (data.isIntersectingWithViewport) {
        visibleElementCount++
      }
    })
    const totalElements = elementsMap.size
    const { tab, mouse, scroll, total } =
      this.foresightManagerInstance.getManagerData.globalCallbackHits
    this.elementCountSpan.textContent = `Visible: ${visibleElementCount}/${totalElements} ~ `
    this.elementCountSpan.title = [
      "Element Visibility Status",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      `Visible in Viewport: ${visibleElementCount}`,
      `Not in Viewport: ${totalElements - visibleElementCount}`,
      `Total Registered Elements: ${totalElements}`,
      "",
      "Note: Only elements visible in the viewport",
      "are actively tracked by intersection observers.",
    ].join("\n")
    this.callbackCountSpan.textContent = `Mouse: ${mouse.hover + mouse.trajectory} Tab: ${
      tab.forwards + tab.reverse
    } Scroll: ${scroll.down + scroll.left + scroll.right + scroll.up}`
    this.callbackCountSpan.title = [
      "Callback Execution Stats",
      "━━━━━━━━━━━━━━━━━━━━━━━━",
      "Mouse Callbacks",
      `   • Trajectory: ${mouse.trajectory}`,
      `   • Hover: ${mouse.hover}`,
      `   • Subtotal: ${mouse.hover + mouse.trajectory}`,
      "",
      "Keyboard Callbacks:",
      `   • Tab Forward: ${tab.forwards}`,
      `   • Tab Reverse: ${tab.reverse}`,
      `   • Subtotal: ${tab.forwards + tab.reverse}`,
      "",
      "Scroll Callbacks:",
      `   • Up: ${scroll.up} | Down: ${scroll.down}`,
      `   • Left: ${scroll.left} | Right: ${scroll.right}`,
      `   • Subtotal: ${scroll.up + scroll.down + scroll.left + scroll.right}`,
      "",
      "Total Callbacks: " + total,
    ].join("\n")
  }

  public refreshElementList() {
    if (!this.elementListItemsContainer) return

    this.elementListItemsContainer.innerHTML = ""
    this.elementListItems.clear()

    const elementsMap = this.foresightManagerInstance.registeredElements
    this.refreshRegisteredElementCountDisplay(elementsMap)

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
    listItem.classList.toggle("not-in-viewport", !data.isIntersectingWithViewport)

    const hitBehaviorText = data.unregisterOnCallback ? "Single" : "Multi"
    let hitSlopText = "N/A"

    if (data.elementBounds.hitSlop) {
      const { top, right, bottom, left } = data.elementBounds.hitSlop
      hitSlopText = `T:${top} R:${right} B:${bottom} L:${left}`
    }

    const viewportIcon = data.isIntersectingWithViewport ? "👁️" : "🚫"

    // Create comprehensive title with all information
    const comprehensiveTitle = [
      `${data.name || "Unnamed Element"}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "Viewport Status:",
      data.isIntersectingWithViewport
        ? "   ✓ In viewport - actively tracked by observers"
        : "   ✗ Not in viewport - not being tracked",
      "",
      "Hit Behavior:",
      data.unregisterOnCallback
        ? "   • Single: Callback triggers once"
        : "   • Multi: Callback can trigger multiple times",
      "",
      "Hit Slop:",
      data.elementBounds.hitSlop
        ? [
            `     Top: ${data.elementBounds.hitSlop.top}px, Bottom: ${data.elementBounds.hitSlop.bottom}px `,
            `     Right: ${data.elementBounds.hitSlop.right}px, Left: ${data.elementBounds.hitSlop.left}px`,
          ].join("\n")
        : "   • Not defined - using element's natural boundaries",
      "",
    ].join("\n")

    listItem.title = comprehensiveTitle

    listItem.innerHTML = `
    <span class="viewport-indicator">${viewportIcon}</span>
    <span class="element-name">${data.name || "Unnamed Element"}</span>
    <span class="hit-slop">${hitSlopText}</span>
    <span class="hit-behavior">${hitBehaviorText}</span>
  `
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

    // Nullify all DOM-related properties to signal it's "cleaned up"
    this.controlsContainer = null!
    this.controlPanelStyleElement = null!
    this.elementListItemsContainer = null
    this.elementCountSpan = null
    this.callbackCountSpan = null
    this.elementListItems.clear()
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
    container.innerHTML = `
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
          <div class="debugger-section-header keyboard-settings-header">
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
          <div class="debugger-section-header scroll-settings-header">
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
          <div class="debugger-section-header general-settings-header">
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
           <button class="section-minimize-button">-</button>
        </div>
        <div class="debugger-section-content element-list">
          <div id="element-list-items-container">
            <em>Initializing...</em>
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

    return `
      #debug-controls {
        position: fixed; bottom: 10px; right: 10px;
        background-color: rgba(0, 0, 0, 0.90); color: white; padding: 12px;
        border-radius: 5px; font-family: Arial, sans-serif; font-size: 13px;
        z-index: 10001; pointer-events: auto; display: flex; flex-direction: column; gap: 8px;
        width: 400px;
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
        transition: background-color 0.2s ease, opacity 0.2s ease;
        font-size: 11px; 
        overflow: hidden;
      }
      
      /* Viewport intersection styling */
      .element-list-item.not-in-viewport {
        opacity: 0.4;
      }
      
      .element-list-item .element-name {
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px; 
        font-weight: bold;
      }
      .element-list-item .viewport-indicator {
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
