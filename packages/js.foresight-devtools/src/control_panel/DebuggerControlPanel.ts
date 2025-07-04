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
import type { ForesightDebugger } from "../debugger/foresightDebugger"
import { createAndAppendStyle } from "../helpers/createAndAppend"
import { objectToMethodCall } from "../helpers/objectToMethodCall"
import { ControlPanelElementList } from "./controlPanelElementList"

const COPY_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
const TICK_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
const SORT_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l4-4 4 4M7 13V3M17 15l4-4 4 4M21 11v3M12 15l4 4 4-4M16 19v-9"></path></svg>`
const FILTER_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`

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
  private activeTab: ControllerTabs = "elements"

  private copySettingsButton: HTMLButtonElement | null = null
  private titleElementCount: HTMLSpanElement | null = null
  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null

  // Logs system
  private logsContainer: HTMLElement | null = null
  private logsFilterDropdown: HTMLElement | null = null
  private logsFilterButton: HTMLButtonElement | null = null
  private eventLogs: Array<{ type: string; timestamp: number; data: any }> = []
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
        this.copySettingsButton?.addEventListener("click", this.handleCopySettings.bind(this))
        break

      case "elements":
        // Get current element data
        const registeredElements = Array.from(
          this.foresightManagerInstance.registeredElements.entries()
        )
        const total = registeredElements.length
        const isIntersecting = registeredElements.filter(
          ([_, elementData]) => elementData.isIntersectingWithViewport
        ).length
        const { tab, mouse, scroll } =
          this.foresightManagerInstance.getManagerData.globalCallbackHits

        tabBar.innerHTML = `
          <div class="tab-bar-info">
            <span class="tab-info-text">Visible: ${isIntersecting}/${total} ~ Mouse: ${
          mouse.hover + mouse.trajectory
        } Tab: ${tab.forwards + tab.reverse} Scroll: ${
          scroll.down + scroll.left + scroll.right + scroll.up
        }</span>
          </div>
          <div class="tab-bar-actions">
            <div class="sort-control-container">
              <button class="tab-bar-extra-button" id="sort-elements-button" title="Change element list sort order">
                ${SORT_SVG_ICON}
              </button>
              <div id="sort-options-popup">
                <button data-sort="visibility" title="Sort by Visibility">Visibility</button>
                <button data-sort="documentOrder" title="Sort by Document Order">Document Order</button>
                <button data-sort="insertionOrder" title="Sort by Insertion Order">Insertion Order</button>
              </div>
            </div>
          </div>
        `

        // Re-attach sort functionality
        this.setupElementsSortListeners()
        this.elementListManager.updateSortOptionUI(
          this.debuggerInstance.getDebuggerData.settings.sortElementList ?? "visibility"
        )
        break

      case "logs":
        const filteredCount = this.eventLogs.filter(log => this.logFilters.has(log.type)).length
        const activeFilters = Array.from(this.logFilters)
        const filterText =
          activeFilters.length === 7
            ? "All events"
            : activeFilters.length === 0
            ? "No events"
            : `${activeFilters.length} event types`

        tabBar.innerHTML = `
          <div class="tab-bar-info">
            <span class="tab-info-text">Showing ${filteredCount} of ${this.eventLogs.length} events • ${filterText}</span>
          </div>
          <div class="tab-bar-actions">
            <button id="filter-logs-button" class="tab-bar-extra-button" title="Filter log types (${activeFilters.length}/7 active)">
              ${FILTER_SVG_ICON}
            </button>
            <div class="logs-filter-dropdown">
              <button data-log-type="elementRegistered">Element Registered</button>
              <button data-log-type="elementUnregistered">Element Unregistered</button>
              <button data-log-type="elementDataUpdated">Element Data Updated</button>
              <button data-log-type="callbackFired">Callback Fired</button>
              <button data-log-type="mouseTrajectoryUpdate">Mouse Trajectory Update</button>
              <button data-log-type="scrollTrajectoryUpdate">Scroll Trajectory Update</button>
              <button data-log-type="managerSettingsChanged">Manager Settings Changed</button>
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
    const sortPopup = this.controlsContainer?.querySelector("#sort-options-popup")

    sortButton?.addEventListener("click", e => {
      e.stopPropagation()
      sortPopup?.classList.toggle("active")
    })

    sortPopup?.addEventListener("click", e => {
      const target = e.target as HTMLElement
      const sortBtn = target.closest("[data-sort]") as HTMLElement | null
      if (sortBtn) {
        const value = sortBtn.dataset.sort as any
        this.debuggerInstance.alterDebuggerSettings({
          sortElementList: value,
        })
        this.elementListManager.reorderElementsInListContainer(
          this.elementListManager.sortElementsInListContainer()
        )
        this.elementListManager.updateSortOptionUI(value)
        sortPopup.classList.remove("active")
      }
    })
  }

  private setupLogsFilterListeners() {
    const filterButton = this.controlsContainer?.querySelector("#filter-logs-button")
    const filterDropdown = this.controlsContainer?.querySelector(".logs-filter-dropdown")

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

  public addEventLog(type: string, data: any) {
    if (!this.logFilters.has(type)) return

    const logEntry = {
      type,
      timestamp: Date.now(),
      data: this.safeSerializeEventData(type, data),
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

  private safeSerializeEventData(eventType: string, data: any): any {
    try {
      // For different event types, extract only the relevant serializable data
      switch (eventType) {
        case "elementRegistered":
        case "elementUnregistered":
          return {
            elementName: data.elementData?.name || "Unnamed Element",
            elementTag: data.elementData?.element?.tagName || "Unknown",
            elementId: data.elementData?.element?.id || "",
            elementClass: data.elementData?.element?.className || "",
            isIntersecting: data.elementData?.isIntersectingWithViewport,
            hitSlop: data.elementData?.elementBounds?.hitSlop,
            unregisterReason: data.unregisterReason || undefined,
          }

        case "elementDataUpdated":
          return {
            elementName: data.elementData?.name || "Unnamed Element",
            elementTag: data.elementData?.element?.tagName || "Unknown",
            updatedProps: data.updatedProps || [],
            isIntersecting: data.elementData?.isIntersectingWithViewport,
          }

        case "callbackFired":
          return {
            elementName: data.elementData?.name || "Unnamed Element",
            elementTag: data.elementData?.element?.tagName || "Unknown",
            hitType: data.hitType,
            predictionEnabled: data.managerData?.globalSettings?.enableMousePrediction,
            tabPredictionEnabled: data.managerData?.globalSettings?.enableTabPrediction,
            scrollPredictionEnabled: data.managerData?.globalSettings?.enableScrollPrediction,
          }

        case "mouseTrajectoryUpdate":
          return {
            currentPoint: data.trajectoryPositions?.currentPoint,
            predictedPoint: data.trajectoryPositions?.predictedPoint,
            positionCount: data.trajectoryPositions?.positions?.length || 0,
            predictionEnabled: data.predictionEnabled,
          }

        case "scrollTrajectoryUpdate":
          return {
            currentPoint: data.currentPoint,
            predictedPoint: data.predictedPoint,
          }

        case "managerSettingsChanged":
          return {
            globalSettings: data.managerData?.globalSettings || {},
          }

        default:
          // For unknown event types, try to extract basic info
          return {
            eventType,
            timestamp: data.timestamp || Date.now(),
            message: "Event data structure not recognized",
          }
      }
    } catch (error) {
      // Fallback if serialization fails
      return {
        eventType,
        error: "Failed to serialize event data",
        errorMessage: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private getNoLogsMessage(): string {
    console.log("here")
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

    const filteredLogs = this.eventLogs.filter(log => this.logFilters.has(log.type))
    console.log(filteredLogs.length === 0)
    this.logsContainer.innerHTML =
      filteredLogs.length === 0 ||
      this.debuggerInstance.getDebuggerData.settings.logging.logLocation === "console"
        ? `<div class="no-logs">${this.getNoLogsMessage()}</div>`
        : filteredLogs
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
    this.updateLogsDisplay()
    this.updateLogFilterUI()
    // Update tab bar count if on logs tab
    if (this.activeTab === "logs") {
      this.updateTabBarContent("logs")
    }
  }

  private updateLogFilterUI() {
    const filterButtons = this.logsFilterDropdown?.querySelectorAll("[data-log-type]")
    filterButtons?.forEach(button => {
      const logType = (button as HTMLElement).dataset.logType!
      button.classList.toggle("active", this.logFilters.has(logType))
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
    this.titleElementCount.textContent = `${isIntersecting}/${total}`
    this.titleElementCount.title = visibleTitle.join("\n")
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
        }, 3000)
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

    // Close filter dropdown when clicking outside (for any tab)
    document.addEventListener("click", e => {
      const activeDropdown = this.controlsContainer?.querySelector(
        ".logs-filter-dropdown.active, #sort-options-popup.active"
      )
      if (activeDropdown && !activeDropdown.contains(e.target as Node)) {
        activeDropdown.classList.remove("active")
      }
    })
  }

  private initializeTabSystem() {
    this.switchTab(this.activeTab)
    this.updateLogFilterUI()
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
              <h4>Mouse</h4>
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

            <div class="settings-group">
              <h4>Keyboard</h4>
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

            <div class="settings-group">
              <h4>Scroll</h4>
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

            <div class="settings-group">
              <h4>DevTools</h4>
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

        <div class="elements-content">
    
            <div id="element-list-items-container">
            </div>
         
        </div>

        <div class="logs-content">
          <div class="logs-container">
            <div class="no-logs"></div>
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
    const tabContentHeight = 400 // Fixed height for all tab content

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
        padding: 0; display: flex; align-items: center; justify-content: center;
      }

       .tab-bar-extra-button svg {
        width: 16px; height: 16px; stroke: white; transition: stroke 0.2s;

       }
      .tab-bar-extra-button:hover svg { stroke: white; }

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
      
      .tab-info-text {
        font-size: 12px;
        color: #9e9e9e;
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
        border-radius: 4px; 
      }
      
      .settings-content::-webkit-scrollbar-thumb,
      .elements-content::-webkit-scrollbar-thumb,
      .logs-content::-webkit-scrollbar-thumb,
      .element-list::-webkit-scrollbar-thumb,
      .logs-container::-webkit-scrollbar-thumb { 
        background-color: rgba(176, 196, 222, 0.5); 
        border-radius: 4px; 
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
        padding: 0;
      }
      
      .settings-group {
        margin-bottom: 16px;
      }
      
      .settings-group h4 {
        margin: 8px 0 4px 0;
        font-size: 13px;
        font-weight: 600;
        color: #b0c4de;
        text-transform: uppercase;
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
      .sort-control-container {
        position: relative;
      }
      
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
        text-align: center;
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
      
      .logs-filter-dropdown {
        position: absolute;
        top: calc(100% + 5px);
        right: 0;
        z-index: 10;
        display: none;
        flex-direction: column;
        gap: 2px;
        background-color: #3a3a3a;
        border: 1px solid #555;
        border-radius: 4px;
        min-width: 200px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      
      .tab-bar-actions {
        position: relative;
      }
      
      .logs-filter-dropdown.active {
        display: flex;
      }
      
      .logs-filter-dropdown button {
        background: none;
        border: none;
        color: #ccc;
        font-size: 12px;
        text-align: left;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 3px;
        transition: all 0.2s ease;
        position: relative;
      }
      
      .logs-filter-dropdown button:hover {
        background-color: #555;
        color: white;
      }
      
      .logs-filter-dropdown button.active {
        color: #b0c4de;
        font-weight: bold;
        background-color: rgba(176, 196, 222, 0.1);
      }
      
      .logs-filter-dropdown button.active::before {
        content: '✓';
        position: absolute;
        left: -6px;
        top: 50%;
        transform: translateY(-50%);
        color: #b0c4de;
      }
      
      .logs-container {
        flex: 1;
        overflow-y: auto;
        background-color: rgba(20, 20, 20, 0.5);
        font-family: 'Courier New', monospace;
      }
      
      .no-logs {
        text-align: center;
        color: #9e9e9e;
        font-style: italic;
        padding: 20px;
      }
      
      .log-entry {
        margin-bottom: 6px;
        border-radius: 3px;
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
