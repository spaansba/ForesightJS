import type {
  ForesightElementData,
  ForesightManagerSettings,
  UpdateForsightManagerSettings,
} from "js.foresight"
import { ForesightManager } from "js.foresight"
import type {
  ControllerTabs,
  DebuggerBooleanSettingKeys,
  DebuggerSettings,
  ManagerBooleanSettingKeys,
  NumericSettingKeys,
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
import { createAndAppendStyle } from "../debugger/helpers/createAndAppend"
import { objectToMethodCall } from "./helpers/objectToMethodCall"
import { safeSerializeEventData } from "./helpers/safeSerializeEventData"
import { ControlPanelElementList } from "./ControlPanelElementList"
import type { ForesightEvent, ForesightEventMap } from "js.foresight/types/types"

// Type for serialized event data from safeSerializeEventData helper function
type SerializedEventData = ReturnType<typeof safeSerializeEventData>

const COPY_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
const TICK_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
const SORT_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path></svg>`
const FILTER_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`
const LOCATION_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><circle cx="8" cy="12" r="2"></circle><path d="m14 12 2 2 4-4"></path></svg>`

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
  private isContainerMinimized: boolean = false

  // Tab system
  private tabContainer: HTMLElement | null = null
  private settingsTab: HTMLElement | null = null
  private elementsTab: HTMLElement | null = null
  private logsTab: HTMLElement | null = null
  private settingsContent: HTMLElement | null = null
  private elementsContent: HTMLElement | null = null
  private logsContent: HTMLElement | null = null
  private activeTab: ControllerTabs = "logs"

  private copySettingsButton: HTMLButtonElement | null = null
  private titleElementCount: HTMLSpanElement | null = null
  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null

  // Logs system
  private logsContainer: HTMLElement | null = null
  private logsFilterDropdown: HTMLElement | null = null
  private logsFilterButton: HTMLButtonElement | null = null
  private eventLogs: Array<{ type: string; timestamp: number; data: SerializedEventData }> = []
  private maxLogs: number = 1000
  private logFilters: Set<string> = new Set([
    "elementRegistered",
    "elementUnregistered",
    "callbackFired",
  ])

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

  public resetLogs() {
    this.eventLogs = []
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
    this.setupEventListeners()
    this.initializeTabSystem()
    this.updateContainerVisibilityState()
    this.updateControlsState(
      this.foresightManagerInstance.getManagerData.globalSettings,
      debuggerSettings
    )
  }

  private static get isInitiated(): boolean {
    return !!DebuggerControlPanel.debuggerControlPanelInstance
  }

  private switchTab(tab: ControllerTabs) {
    this.activeTab = tab

    // Update tab buttons
    this.settingsTab?.classList.toggle("active", tab === "settings")
    this.elementsTab?.classList.toggle("active", tab === "elements")
    this.logsTab?.classList.toggle("active", tab === "logs")

    // Update content visibility
    if (this.settingsContent)
      this.settingsContent.style.display = tab === "settings" ? "block" : "none"
    if (this.elementsContent)
      this.elementsContent.style.display = tab === "elements" ? "block" : "none"
    if (this.logsContent) this.logsContent.style.display = tab === "logs" ? "block" : "none"

    // Update tab bar content
    this.updateTabBarContent(tab)
  }

  private updateTabBarContent(tab: ControllerTabs) {
    const tabBar = this.controlsContainer?.querySelector(".tab-bar")
    if (!tabBar) return

    switch (tab) {
      case "settings":
        tabBar.innerHTML = `
          <div class="tab-bar-info">
            <span class="tab-info-text">Change Foresight Settings in real-time</span>
          </div>
          <div class="tab-bar-actions">
            <button id="copy-settings" class="tab-bar-extra-button" title="Copy Settings to Clipboard">
              ${COPY_SVG_ICON}
            </button>
          </div>
        `
        // Re-query and re-attach the copy button after DOM update
        this.copySettingsButton = this.controlsContainer?.querySelector("#copy-settings")
        this.copySettingsButton?.addEventListener("click", this.handleCopySettings.bind(this))
        break

      case "elements":
        // Get current element data (reuse calculation from updateTitleElementCount)
        const registeredElements = Array.from(
          this.foresightManagerInstance.registeredElements.entries()
        )
        const total = registeredElements.length
        const isIntersecting = registeredElements.filter(
          ([_, elementData]) => elementData.isIntersectingWithViewport
        ).length
        const {
          tab,
          mouse,
          scroll,
          total: totalHits,
        } = this.foresightManagerInstance.getManagerData.globalCallbackHits

        const currentSort =
          this.debuggerInstance.getDebuggerData.settings.sortElementList ?? "visibility"
        const sortLabels = {
          visibility: "Visibility",
          documentOrder: "Document Order",
          insertionOrder: "Insertion Order",
        }

        tabBar.innerHTML = `
          <div class="tab-bar-info">
            <div class="stats-chips">
              <span class="chip visible" title="Elements visible in viewport vs total registered elements">${isIntersecting}/${total} visible</span>
              <span class="chip hits" title="Total callback hits breakdown:

Mouse: ${mouse.hover + mouse.trajectory}
  • hover: ${mouse.hover}
  • trajectory: ${mouse.trajectory}

Tab: ${tab.forwards + tab.reverse}
  • forwards: ${tab.forwards}
  • reverse: ${tab.reverse}

Scroll: ${scroll.down + scroll.left + scroll.right + scroll.up}
  • down: ${scroll.down}
  • up: ${scroll.up}
  • left: ${scroll.left}
  • right: ${scroll.right}">${totalHits} hits </span>
              <span class="chip sort" title="Current element sorting method">▼ ${sortLabels[
                currentSort as keyof typeof sortLabels
              ].toLowerCase()}</span>
            </div>
          </div>
          <div class="tab-bar-actions">
            <div class="dropdown-container">
              <button class="tab-bar-extra-button" id="sort-elements-button" title="Change element list sort order">
                ${SORT_SVG_ICON}
              </button>
              <div class="dropdown-menu" id="sort-options-dropdown">
                <button data-sort="visibility" title="Sort by Visibility">Visibility</button>
                <button data-sort="documentOrder" title="Sort by Document Order">Document Order</button>
                <button data-sort="insertionOrder" title="Sort by Insertion Order">Insertion Order</button>
              </div>
            </div>
          </div>
        `

        // Re-attach sort functionality
        this.setupElementsSortListeners()
        break

      case "logs":
        // Since eventLogs only contains tracked events now, just show the count
        const loggedCount = this.eventLogs.length
        const activeFilters = Array.from(this.logFilters)
        const filterText =
          activeFilters.length === 7
            ? "All events"
            : activeFilters.length === 0
            ? "No events"
            : `${activeFilters.length} event types`

        const logLocation = this.debuggerInstance.getDebuggerData.settings.logging.logLocation
        const locationLabels = {
          controlPanel: "Panel",
          console: "Console",
          both: "Both",
        }

        tabBar.innerHTML = `
          <div class="tab-bar-info">
            <div class="stats-chips">
              <span class="chip logs" title="Number of events logged (only tracked events are logged)">${loggedCount} events</span>
              <span class="chip filter" title="Event Filter Status:

Active filters:
${
  Array.from(this.logFilters)
    .map(filter => "  • " + filter)
    .join("\n") || "  • None"
}

Filtered out:
${
  [
    "elementRegistered",
    "elementUnregistered",
    "elementDataUpdated",
    "callbackFired",
    "mouseTrajectoryUpdate",
    "scrollTrajectoryUpdate",
    "managerSettingsChanged",
  ]
    .filter(type => !this.logFilters.has(type))
    .map(filter => "  • " + filter)
    .join("\n") || "  • None"
}">⚬ ${filterText.toLowerCase()}</span>
              <span class="chip location" title="Log output location: ${logLocation}">📍 ${
          locationLabels[logLocation as keyof typeof locationLabels]
        }</span>
            </div>
          </div>
          <div class="tab-bar-actions">
            <button id="toggle-log-location-button" class="tab-bar-extra-button" title="Toggle log output location: ${logLocation}">
              ${LOCATION_SVG_ICON}
            </button>
            <div class="dropdown-container">
              <button id="filter-logs-button" class="tab-bar-extra-button" title="Filter log types (${
                activeFilters.length
              }/7 active)">
                ${FILTER_SVG_ICON}
              </button>
              <div class="dropdown-menu" id="logs-filter-dropdown">
                <button title="logs whenever an element is registered to the manager" data-log-type="elementRegistered">Element Registered</button>
                <button title="logs whenever an element is unregistered from the manager" data-log-type="elementUnregistered">Element Unregistered</button>
                <button title="logs whenever an element's data is updated in the manager" data-log-type="elementDataUpdated">Element Data Updated</button>
                <button title="logs whenever an element's callback is hit" data-log-type="callbackFired">Callback Fired</button>
                <button title="logs all mouse trajectory updates" data-log-type="mouseTrajectoryUpdate">Mouse Trajectory Update</button>
                <button title="logs scroll trajectory updates" data-log-type="scrollTrajectoryUpdate">Scroll Trajectory Update</button>
                <button title="logs whenever settings changed in the manager" data-log-type="managerSettingsChanged">Manager Settings Changed</button>
              </div>
            </div>
          </div>
        `
        // Re-attach logs filter event listeners
        this.setupLogsFilterListeners()
        this.updateLogFilterUI()
        break
    }
  }

  private setupElementsSortListeners() {
    const sortButton = this.controlsContainer?.querySelector("#sort-elements-button")
    const sortDropdown = this.controlsContainer?.querySelector("#sort-options-dropdown")

    sortButton?.addEventListener("click", e => {
      e.stopPropagation()
      sortDropdown?.classList.toggle("active")
    })

    sortDropdown?.addEventListener("click", e => {
      const target = e.target as HTMLElement
      const sortBtn = target.closest("[data-sort]") as HTMLElement | null
      if (sortBtn) {
        const value = sortBtn.dataset.sort as any
        this.debuggerInstance.alterDebuggerSettings({
          sortElementList: value,
        })
        // Immediately re-sort and update the list
        this.elementListManager.reorderElementsInListContainer(
          this.elementListManager.sortElementsInListContainer()
        )
        // Update the tab bar to show new sort method
        this.updateTabBarContent("elements")
        sortDropdown.classList.remove("active")
      }
    })

    // Update sort option UI
    this.updateSortOptionUI()
  }

  private setupLogsFilterListeners() {
    const filterButton = this.controlsContainer?.querySelector("#filter-logs-button")
    const filterDropdown = this.controlsContainer?.querySelector("#logs-filter-dropdown")

    filterButton?.addEventListener("click", e => {
      e.stopPropagation()
      filterDropdown?.classList.toggle("active")
    })

    filterDropdown?.addEventListener("click", e => {
      const target = e.target as HTMLElement
      const filterBtn = target.closest("[data-log-type]") as HTMLElement | null
      if (filterBtn) {
        const logType = filterBtn.dataset.logType!
        this.toggleLogFilter(logType)
      }
    })
  }

  public addEventLog<K extends ForesightEvent>(type: K, event: ForesightEventMap[K]) {
    // Only add events that are being tracked (in logFilters)
    if (!this.logFilters.has(type)) return

    const logEntry = {
      type,
      timestamp: Date.now(),
      data: this.safeSerializeEventData(event),
    }

    this.eventLogs.unshift(logEntry)
    if (this.eventLogs.length > this.maxLogs) {
      this.eventLogs = this.eventLogs.slice(0, this.maxLogs)
    }

    this.updateLogsDisplay()

    // Update elements tab bar for relevant events
    if (
      this.activeTab === "elements" &&
      (type === "elementRegistered" ||
        type === "elementUnregistered" ||
        type === "elementDataUpdated" ||
        type === "callbackFired")
    ) {
      this.updateTabBarContent("elements")
    }
  }

  private safeSerializeEventData<K extends ForesightEvent>(event: ForesightEventMap[K]) {
    return safeSerializeEventData(event)
  }

  private getNoLogsMessage(): string {
    const debuggerSettings = this.debuggerInstance.getDebuggerData.settings
    const logging = debuggerSettings.logging

    // If we have logs but they're filtered out, show filter message
    if (this.eventLogs.length > 0) {
      return "No logs to display. Check your filter settings."
    }

    // Check if all logging options are disabled
    const allLoggingDisabled =
      !logging.logCallbackFired &&
      !logging.logElementDataUpdated &&
      !logging.logElementRegistered &&
      !logging.logElementUnregistered &&
      !logging.logManagerSettingsChanged &&
      !logging.logMouseTrajectoryUpdate &&
      !logging.logScrollTrajectoryUpdate

    if (allLoggingDisabled) {
      return "No logs to display. Enable logging options above to see events."
    }

    if (logging.logLocation === "console") {
      return "No logs to display. Logging is set to console - check browser console for events."
    }

    return "No logs to display. Interact with elements to generate events."
  }

  private updateLogsDisplay() {
    if (!this.logsContainer) return

    this.logsContainer.innerHTML =
      this.eventLogs.length === 0
        ? `<div class="no-items">${this.getNoLogsMessage()}</div>`
        : this.eventLogs
            .map((log, index) => {
              const time = new Date(log.timestamp).toLocaleTimeString()
              const logId = `log-${index}`
              const summary = this.getLogSummary(log.type, log.data)

              return `<div class="log-entry log-${log.type}" data-log-id="${logId}">
                <div class="log-header" onclick="window.debuggerInstance?.toggleLogEntry('${logId}')">
                  <span class="log-time">${time}</span>
                  <span class="log-type">${log.type}</span>
                  <span class="log-summary">${summary}</span>
                  <span class="log-toggle">▶</span>
                </div>
                <div class="log-details" style="display: none;">
                  <pre class="log-data">${JSON.stringify(log.data, null, 2)}</pre>
                </div>
              </div>`
            })
            .join("")

    // Store reference for toggle functionality
    if ((window as any).debuggerInstance !== this) {
      ;(window as any).debuggerInstance = this
    }

    // Update tab bar if on logs tab
    if (this.activeTab === "logs") {
      this.updateTabBarContent("logs")
    }
  }

  public toggleLogEntry(logId: string) {
    const logEntry = this.logsContainer?.querySelector(`[data-log-id="${logId}"]`)
    if (!logEntry) return

    const details = logEntry.querySelector(".log-details") as HTMLElement
    const toggle = logEntry.querySelector(".log-toggle") as HTMLElement

    if (details && toggle) {
      const isVisible = details.style.display !== "none"
      details.style.display = isVisible ? "none" : "block"
      toggle.textContent = isVisible ? "▶" : "▼"
    }
  }

  private getLogSummary(eventType: string, data: any): string {
    switch (eventType) {
      case "elementRegistered":
        return `${data.elementName} (${data.elementTag})`
      case "elementUnregistered":
        return `${data.elementName} - ${data.unregisterReason || "unknown"}`
      case "callbackFired":
        return `${data.elementName} - ${data.hitType}`
      case "elementDataUpdated":
        return `${data.elementName} - ${data.updatedProps?.join(", ") || "unknown props"}`
      case "mouseTrajectoryUpdate":
        return `${data.positionCount} positions`
      case "scrollTrajectoryUpdate":
        return `scroll prediction`
      case "managerSettingsChanged":
        return `settings updated`
      default:
        return "event data"
    }
  }

  private toggleLogFilter(eventType: string) {
    if (this.logFilters.has(eventType)) {
      this.logFilters.delete(eventType)
    } else {
      this.logFilters.add(eventType)
    }

    // Clear event logs since filter changed - only tracked events should be logged
    this.eventLogs = []

    this.updateLogsDisplay()
    this.updateLogFilterUI()
    // Update tab bar count if on logs tab
    if (this.activeTab === "logs") {
      this.updateTabBarContent("logs")
    }
  }

  private updateLogFilterUI() {
    const filterDropdown = this.controlsContainer?.querySelector("#logs-filter-dropdown")
    const filterButtons = filterDropdown?.querySelectorAll("[data-log-type]")
    filterButtons?.forEach(button => {
      const logType = (button as HTMLElement).dataset.logType!
      button.classList.toggle("active", this.logFilters.has(logType))
    })

    // Update filter button appearance
    const filterButton = this.controlsContainer?.querySelector("#filter-logs-button")
    const activeFilters = Array.from(this.logFilters)
  }

  private updateSortOptionUI() {
    const sortDropdown = this.controlsContainer?.querySelector("#sort-options-dropdown")
    const sortButtons = sortDropdown?.querySelectorAll("[data-sort]")
    const currentSort =
      this.debuggerInstance.getDebuggerData.settings.sortElementList ?? "visibility"

    sortButtons?.forEach(button => {
      const sortValue = (button as HTMLElement).dataset.sort!
      button.classList.toggle("active", sortValue === currentSort)
    })
  }

  public updateTitleElementCount() {
    if (!this.titleElementCount) return
    const registeredElements = Array.from(
      this.foresightManagerInstance.registeredElements.entries()
    )
    const total = registeredElements.length
    const isIntersecting = registeredElements.filter(
      ([_, elementData]) => elementData.isIntersectingWithViewport
    ).length

    this.titleElementCount.textContent = `${isIntersecting}/${total}`
    this.titleElementCount.title = `Elements visible in viewport vs total registered elements`

    // Update elements tab bar if currently active
    if (this.activeTab === "elements") {
      this.updateTabBarContent("elements")
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
    this.showNameTagsCheckbox = this.controlsContainer.querySelector("#toggle-name-tags")
    this.containerMinimizeButton = this.controlsContainer.querySelector(".minimize-button")
    this.copySettingsButton = this.controlsContainer.querySelector("#copy-settings")
    this.titleElementCount = this.controlsContainer.querySelector(".title-element-count")

    // Tab system
    this.tabContainer = this.controlsContainer.querySelector(".tab-container")
    this.settingsTab = this.controlsContainer.querySelector("[data-tab='settings']")
    this.elementsTab = this.controlsContainer.querySelector("[data-tab='elements']")
    this.logsTab = this.controlsContainer.querySelector("[data-tab='logs']")
    this.settingsContent = this.controlsContainer.querySelector(".settings-content")
    this.elementsContent = this.controlsContainer.querySelector(".elements-content")
    this.logsContent = this.controlsContainer.querySelector(".logs-content")

    // Logs system
    this.logsContainer = this.controlsContainer.querySelector(".logs-container")
    this.logsFilterDropdown = this.controlsContainer.querySelector(".logs-filter-dropdown")
    this.logsFilterButton = this.controlsContainer.querySelector("#filter-logs-button")
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
        }, 500)
      })
      .catch(err => {
        console.error("Foresight Debugger: Could not copy manager settings to clipboard", err)
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

    // Tab system event listeners
    this.settingsTab?.addEventListener("click", () => this.switchTab("settings"))
    this.elementsTab?.addEventListener("click", () => this.switchTab("elements"))
    this.logsTab?.addEventListener("click", () => this.switchTab("logs"))

    // Close dropdowns when clicking outside
    document.addEventListener("click", e => {
      const activeDropdown = this.controlsContainer?.querySelector(".dropdown-menu.active")
      if (
        activeDropdown &&
        !activeDropdown.closest(".dropdown-container")?.contains(e.target as Node)
      ) {
        activeDropdown.classList.remove("active")
      }
    })
  }

  private initializeTabSystem() {
    this.switchTab(this.activeTab)
    this.updateLogFilterUI()
    this.updateLogsDisplay()
  }

  private updateContainerVisibilityState() {
    if (!this.containerMinimizeButton) return
    if (this.isContainerMinimized) {
      this.controlsContainer.classList.add("minimized")
      this.containerMinimizeButton.textContent = "+"
      if (this.tabContainer) this.tabContainer.style.display = "none"
    } else {
      this.controlsContainer.classList.remove("minimized")
      this.containerMinimizeButton.textContent = "-"
      if (this.tabContainer) this.tabContainer.style.display = ""
      // Show active tab content and update tab bar
      this.switchTab(this.activeTab)
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
    // Update tab bar if on elements tab
    this.updateTitleElementCount()
    if (this.activeTab === "elements") {
      this.updateTabBarContent("elements")
    }
  }

  public updateElementVisibilityStatus(elementData: ForesightElementData) {
    this.elementListManager.updateElementVisibilityStatus(elementData)
    // Update tab bar if on elements tab
    if (this.activeTab === "elements") {
      this.updateTabBarContent("elements")
    }
  }

  public addElementToList(elementData: ForesightElementData) {
    this.elementListManager.addElementToList(elementData)
    // Update tab bar if on elements tab
    if (this.activeTab === "elements") {
      this.updateTabBarContent("elements")
    }
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

    // Tab system cleanup
    this.tabContainer = null
    this.settingsTab = null
    this.elementsTab = null
    this.logsTab = null
    this.settingsContent = null
    this.elementsContent = null
    this.logsContent = null

    // Logs system cleanup
    this.logsContainer = null
    this.logsFilterDropdown = null
    this.logsFilterButton = null
    this.eventLogs = []

    // Clean up global reference
    if ((window as any).debuggerInstance === this) {
      delete (window as any).debuggerInstance
    }
  }

  private createControlContainer(): HTMLElement {
    const container = document.createElement("div")
    container.id = "debug-controls"
    container.innerHTML = /* html */ `
      <div class="debugger-title-container">
        <button class="minimize-button">-</button>
        <h1>Foresight DevTools</h1>
        <span class="title-element-count">

        </span>
      </div>

      <div class="tab-container">
        <button class="tab-button active" data-tab="settings">Settings</button>
        <button class="tab-button" data-tab="elements">Elements</button>
        <button class="tab-button" data-tab="logs">Logs</button>
      </div>

      <div class="tab-content">
        <div class="tab-bar">
          <!-- Dynamic content populated by updateTabBarContent -->
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <div class="settings-group">
              <h4>Mouse Prediction</h4>
              <div class="setting-item">
                <label for="trajectory-enabled">Enable Mouse Prediction
                  <span class="setting-description">Predict mouse movement trajectory and trigger callbacks before cursor reaches target</span>
                </label>
                <div class="setting-controls">
                  <input type="checkbox" id="trajectory-enabled">
                </div>
              </div>
              <div class="setting-item">
                <label for="history-size">Position History
                  <span class="setting-description">Number of past mouse positions stored for velocity calculations</span>
                </label>
                <div class="setting-controls">
                  <input type="range" id="history-size" min="${MIN_POSITION_HISTORY_SIZE}" max="${MAX_POSITION_HISTORY_SIZE}">
                  <span id="history-value" class="setting-value"></span>
                </div>
              </div>
              <div class="setting-item">
                <label for="prediction-time">Prediction Time
                  <span class="setting-description">How far into the future to calculate mouse trajectory path</span>
                </label>
                <div class="setting-controls">
                  <input type="range" id="prediction-time" min="${MIN_TRAJECTORY_PREDICTION_TIME}" max="${MAX_TRAJECTORY_PREDICTION_TIME}" step="10">
                  <span id="prediction-value" class="setting-value"></span>
                </div>
              </div>
            </div>

            <div class="settings-group">
              <h4>Keyboard Navigation</h4>
              <div class="setting-item">
                <label for="tab-enabled">Enable Tab Prediction
                  <span class="setting-description">Execute callbacks when user is within tab offset of registered elements</span>
                </label>
                <div class="setting-controls">
                  <input type="checkbox" id="tab-enabled">
                </div>
              </div>
              <div class="setting-item">
                <label for="tab-offset">Tab Offset
                  <span class="setting-description">Number of tabbable elements to look ahead when predicting navigation</span>
                </label>
                <div class="setting-controls">
                  <input type="range" id="tab-offset" min="${MIN_TAB_OFFSET}" max="${MAX_TAB_OFFSET}" step="1">
                  <span id="tab-offset-value" class="setting-value"></span>
                </div>
              </div>
            </div>

            <div class="settings-group">
              <h4>Scroll Prediction</h4>
              <div class="setting-item">
                <label for="scroll-enabled">Enable Scroll Prediction
                  <span class="setting-description">Predict scroll direction and trigger callbacks for elements in path</span>
                </label>
                <div class="setting-controls">
                  <input type="checkbox" id="scroll-enabled">
                </div>
              </div>
              <div class="setting-item">
                <label for="scroll-margin">Scroll Margin
                  <span class="setting-description">Pixel distance to check from mouse position in scroll direction</span>
                </label>
                <div class="setting-controls">
                  <input type="range" id="scroll-margin" min="${MIN_SCROLL_MARGIN}" max="${MAX_SCROLL_MARGIN}" step="10">
                  <span id="scroll-margin-value" class="setting-value"></span>
                </div>
              </div>
            </div>

            <div class="settings-group">
              <h4>Developer Tools</h4>
              <div class="setting-item">
                <label for="toggle-name-tags">Show Name Tags
                  <span class="setting-description">Display name tags over each registered element in debug mode</span>
                </label>
                <div class="setting-controls">
                  <input type="checkbox" id="toggle-name-tags">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="elements-content">
    
            <div id="element-list-items-container">
            </div>
         
        </div>

        <div class="logs-content">
          <div class="logs-container">
            <div class="no-items"></div>
          </div>
        </div>
      </div>
    `
    return container
  }

  private getStyles(): string {
    const elementItemHeight = 35 // px
    const elementListGap = 3 // px
    const numRowsToShow = 6
    const numItemsPerRow = 1
    const tabContentHeight = 330 // Fixed height for all tab content

    const rowsContentHeight =
      elementItemHeight * numRowsToShow + elementListGap * (numRowsToShow - 1)

    return /* css */ `
      #debug-controls {
        position: fixed; bottom: 10px; right: 10px;
        background-color: rgba(0, 0, 0, 0.90); color: white; padding: 12px;
        font-family: Arial, sans-serif; font-size: 13px;
        z-index: 10001; pointer-events: auto; display: flex; flex-direction: column;
        width: 400px;
        transition: width 0.3s ease, height 0.3s ease;
      }
      #debug-controls.minimized {
        width: 250px;
        overflow: hidden;
        padding: 12px; 
        gap: 0px;
      }

      #element-count,#callback-count {
        font-size: 12px;
        color: #9e9e9e;
      }

      .debugger-title-container {
        display: flex;
        justify-content: space-between ;
        padding: 0;
      }
      
      .minimize-button {
        background: none; border: none; color: white;
        font-size: 22px; cursor: pointer;
        line-height: 1;
        padding: 0;
        
      }
      
      .title-group { 
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        justify-content: center;
      }
      
      .title-element-count {
        font-size: 14px;
        text-align: right;
      }
      .debugger-title-container h1 { margin: 0; font-size: 15px; }

      /* Tab System */
      .tab-container {
        display: flex;
        justify-content: space-evenly;
        border-bottom: 2px solid #444;
        margin-top: 12px;
      }
      
      .tab-bar-extra-button {
        background: none; border: none; color: white; cursor: pointer;
        padding: 6px; display: flex; align-items: center; justify-content: center;
        transition: all 0.2s ease;
      }

       .tab-bar-extra-button svg {
        width: 16px; height: 16px; stroke: white; transition: stroke 0.2s;
       }
      
      .tab-bar-extra-button:hover {
        background-color: rgba(176, 196, 222, 0.1);
      }
      
      .tab-bar-extra-button:hover svg { 
        stroke: #b0c4de; 
      }
      
      .tab-bar-extra-button.active {
        background-color: rgba(176, 196, 222, 0.2);
      }
      
      .tab-bar-extra-button.active svg {
        stroke: #b0c4de;
      }

      .tab-button {
        background: none;
        border: none;
        color: #9e9e9e;
        width: 100%;
        padding: 8px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        font-size: 13px;
        font-weight: 500;
      }
      
      .tab-button:hover {
        color: #b0c4de;
        background-color: rgba(176, 196, 222, 0.1);
      }
      
      .tab-button.active {
        color: #b0c4de;
        border-bottom-color: #b0c4de;
      }
      
      .tab-content {
        height: ${tabContentHeight}px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      #debug-controls.minimized .tab-content {
        height: 0;
        overflow: hidden;
      }
      
      /* Unified Tab Bar */
      .tab-bar {
        display: flex;
        justify-content: space-between;

        padding: 4px 0 4px 0;
        border-bottom: 1px solid #444;
        position: sticky;
        top: 0;
        z-index: 5;
        min-height: 36px;
        backdrop-filter: none;
      }
      
      .tab-bar-info {
        display: flex;
        gap: 12px;
        align-items: center;
        flex: 1;
      }
      
      .tab-bar-actions {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      
      .stats-chips {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .chip {
        font-size: 11px;
        font-weight: 500;
        padding: 4px 8px;
        border: 1px solid #555;
        white-space: nowrap;
        letter-spacing: 0.3px;
        background: rgba(40, 40, 40, 0.7);
        color: #b0c4de;
      }
      
      .settings-content,
      .elements-content,
      .logs-content {
        flex: 1;
        overflow-y: auto;
      }
      
      /* Universal scrollbar styling for all scrollable areas */
      .settings-content::-webkit-scrollbar,
      .elements-content::-webkit-scrollbar,
      .logs-content::-webkit-scrollbar,
      .element-list::-webkit-scrollbar,
      .logs-container::-webkit-scrollbar { 
        width: 8px; 
      }
      
      .settings-content::-webkit-scrollbar-track,
      .elements-content::-webkit-scrollbar-track,
      .logs-content::-webkit-scrollbar-track,
      .element-list::-webkit-scrollbar-track,
      .logs-container::-webkit-scrollbar-track { 
        background: rgba(30, 30, 30, 0.5); 

      }
      
      .settings-content::-webkit-scrollbar-thumb,
      .elements-content::-webkit-scrollbar-thumb,
      .logs-content::-webkit-scrollbar-thumb,
      .element-list::-webkit-scrollbar-thumb,
      .logs-container::-webkit-scrollbar-thumb { 
        background-color: rgba(176, 196, 222, 0.5); 
       
        border: 2px solid rgba(0, 0, 0, 0.2); 
      }
      
      .settings-content::-webkit-scrollbar-thumb:hover,
      .elements-content::-webkit-scrollbar-thumb:hover,
      .logs-content::-webkit-scrollbar-thumb:hover,
      .element-list::-webkit-scrollbar-thumb:hover,
      .logs-container::-webkit-scrollbar-thumb:hover { 
        background-color: rgba(176, 196, 222, 0.7); 
      }
      
      /* Firefox scrollbar support */
      .settings-content,
      .elements-content,
      .logs-content,
      .element-list,
      .logs-container { 
        scrollbar-width: thin; 
        scrollbar-color: rgba(176, 196, 222, 0.5) rgba(30, 30, 30, 0.5); 
      }
      
      .settings-content {
        display: block;
      }

      /* Settings Tab Styles */
      .settings-section {
        
      }
      
      .settings-group {
        margin-bottom: 20px;
        background: rgba(30, 30, 30, 0.6);
        padding: 16px;
        border: 1px solid rgba(176, 196, 222, 0.1);
      }
      
      .settings-group h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #b0c4de;
        border-bottom: 1px solid rgba(176, 196, 222, 0.2);
        padding-bottom: 8px;
      }
      
      .setting-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid rgba(80, 80, 80, 0.2);
      }
      
      .setting-item:last-child {
        border-bottom: none;
      }
      
      .setting-item label {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-weight: 500;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
        min-width: 180px;
      }
      
      .setting-description {
        font-size: 11px;
        color: #9e9e9e;
        line-height: 1.3;
        font-weight: normal;
      }
      
      .setting-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      
      .setting-value {
        font-size: 12px;
        color: #b0c4de;
        font-weight: 500;
        min-width: 45px;
        text-align: right;
      }

      /* Modern Toggle Switches */
      #debug-controls input[type="checkbox"] {
        appearance: none; -webkit-appearance: none; -moz-appearance: none;
        position: relative; width: 44px; height: 22px;
        background-color: #444; cursor: pointer;
        outline: none; transition: all 0.3s ease;
        vertical-align: middle; flex-shrink: 0; margin: 0;
        border: 2px solid #555;
      }
      
      #debug-controls input[type="checkbox"]::before {
        content: ""; position: absolute; width: 16px; height: 16px;
        background-color: white; top: 1px; left: 1px;
        transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      
      #debug-controls input[type="checkbox"]:checked {
        background-color: #b0c4de;
        border-color: #b0c4de;
      }
      
      #debug-controls input[type="checkbox"]:checked::before {
        transform: translateX(22px);
        background-color: white;
      }
      
      #debug-controls input[type="checkbox"]:hover {
        box-shadow: 0 0 0 3px rgba(176, 196, 222, 0.1);
      }

      /* Modern Range Sliders */
      #debug-controls input[type="range"] {
        margin: 0; cursor: pointer; -webkit-appearance: none;
        appearance: none; background: transparent; height: 22px; vertical-align: middle;
        width: 100px;
      }
      
      #debug-controls input[type="range"]::-webkit-slider-runnable-track {
        height: 6px; background: #444; border-radius: 3px;
        border: 1px solid #555;
      }
      
      #debug-controls input[type="range"]::-moz-range-track {
        height: 6px; background: #444; border-radius: 3px;
        border: 1px solid #555;
      }
      
      #debug-controls input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; margin-top: -7px;
        background: #b0c4de; height: 20px; width: 20px;
        border-radius: 50%; border: 2px solid #333;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      }
      
      #debug-controls input[type="range"]::-moz-range-thumb {
        background: #b0c4de; height: 20px; width: 20px;
        border-radius: 50%; border: 2px solid #333;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      }
      
      #debug-controls input[type="range"]:hover::-webkit-slider-thumb {
        transform: scale(1.1);
        box-shadow: 0 0 0 4px rgba(176, 196, 222, 0.2);
      }
      
      #debug-controls input[type="range"]:hover::-moz-range-thumb {
        transform: scale(1.1);
        box-shadow: 0 0 0 4px rgba(176, 196, 222, 0.2);
      }
      /* Elements Tab Styles */
      #element-count,#callback-count {
        font-size: 12px;
        color: #9e9e9e;
      }
      .header-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      /* Unified Dropdown Styles */
      .dropdown-container {
        position: relative;
      }
      
      .dropdown-menu {
        position: absolute;
        top: calc(100% + 5px);
        right: 0;
        z-index: 10;
        display: none;
        flex-direction: column;
        background-color: #3a3a3a;
        border: 1px solid #555;
        min-width: 200px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      
      .dropdown-menu.active {
        display: flex;
      }
      
      .dropdown-menu button {
        background: none; border: none; color: #ccc;
        font-size: 12px; text-align: left; padding: 8px 12px;
        cursor: pointer; transition: all 0.2s ease;
        display: flex; align-items: center; position: relative;
      }
      
      .dropdown-menu button:hover {
        background-color: #555; color: white;
      }
      
      .dropdown-menu button.active {
        color: #b0c4de; font-weight: bold;
        background-color: rgba(176, 196, 222, 0.1);
      }
      
      .dropdown-menu button.active::after {
        content: '✓'; position: absolute; right: 8px;
        top: 50%; transform: translateY(-50%); color: #b0c4de;
        font-weight: bold;
      }

      .element-list {
        flex: 1;
        overflow-y: auto;
        background-color: rgba(20, 20, 20, 0.5);
        border-radius: 3px;
        padding: 0;
        display: flex;
        min-height: 300px;
      }


      #element-list-items-container { 
        display: flex;
        flex-wrap: wrap;
        
        min-height: ${rowsContentHeight}px;
        box-sizing: border-box;
        align-content: flex-start;
      }
      #element-list-items-container > em {
        flex-basis: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        font-style: italic;
        color: #9e9e9e;
        font-size: 12px;
        background: none;
      }
      .element-list-item {
        flex-basis: calc((100% - (${
          numItemsPerRow - 1
        } * ${elementListGap}px)) / ${numItemsPerRow});
        flex-grow: 0;
        flex-shrink: 0;
        height: ${elementItemHeight}px;
        box-sizing: border-box;
        padding: 5px;
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
      
      .tab-bar-actions {
        position: relative;
      }
      
      .logs-container {
        flex: 1;
        overflow-y: auto;
        /* background-color: rgba(20, 20, 20, 0.5); */
        font-family: 'Courier New', monospace;
      }
      
      .no-items {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        font-family: 'Courier New', monospace;
        font-style: italic;
        padding: 20px;
    
      }
      
      .log-entry {
        margin-bottom: 6px;

        background-color: rgba(40, 40, 40, 0.7);
        border-left: 3px solid #555;
        font-size: 11px;
        line-height: 1.4;
        overflow: hidden;
      }
      
      .log-header {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        gap: 8px;
      }
      
      .log-header:hover {
        background-color: rgba(60, 60, 60, 0.7);
      }
      
      .log-details {
        padding: 0 8px 8px 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .log-summary {
        flex: 1;
        color: #ccc;
        font-size: 10px;
        opacity: 0.8;
      }
      
      .log-toggle {
        color: #b0c4de;
        font-size: 10px;
        transition: transform 0.2s ease;
        width: 12px;
        text-align: center;
      }
      
      .log-entry.log-callbackFired {
        border-left-color: #4caf50;
      }
      
      .log-entry.log-elementRegistered {
        border-left-color: #2196f3;
      }
      
      .log-entry.log-elementUnregistered {
        border-left-color: #ff9800;
      }
      
      .log-entry.log-mouseTrajectoryUpdate {
        border-left-color: #9c27b0;
      }
      
      .log-entry.log-scrollTrajectoryUpdate {
        border-left-color: #00bcd4;
      }
      
      .log-entry.log-elementDataUpdated {
        border-left-color: #ffeb3b;
      }
      
      .log-entry.log-managerSettingsChanged {
        border-left-color: #f44336;
      }
      
      .log-time {
        color: #9e9e9e;
        margin-right: 8px;
        font-weight: bold;
      }
      
      .log-type {
        color: #b0c4de;
        margin-right: 8px;
        font-weight: bold;
        text-transform: capitalize;
      }
      
      .log-data {
        color: #e0e0e0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    `
  }
}
