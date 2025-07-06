import type { ForesightManager } from "js.foresight"
import type { ForesightEvent, ForesightEventMap } from "js.foresight/types/types"

import { BaseTab } from "../baseTab/BaseTab"
import type { ForesightDebugger } from "../../debugger/ForesightDebugger"
import { createAndAppendStyle } from "../../debugger/helpers/createAndAppend"
import type { LoggingLocations } from "../../types/types"
import { safeSerializeEventData, type SerializedEventData } from "./helpers/safeSerializeEventData"
import { queryAllAndAssert, queryAndAssert } from "../../debugger/helpers/queryAndAssert"

type LogConfig = {
  label: string
  title: string
}

const LOGGABLE_EVENTS_CONFIG: Record<ForesightEvent, LogConfig> = {
  callbackFired: {
    label: "Callback Fired",
    title: "Logs whenever an element's callback is hit.",
  },
  elementRegistered: {
    label: "Element Registered",
    title: "Logs whenever an element is registered to the manager.",
  },
  elementUnregistered: {
    label: "Element Unregistered",
    title: "Logs whenever an element is unregistered from the manager.",
  },
  elementDataUpdated: {
    label: "Element Data Updated",
    title: "Logs when element data like visibility changes.",
  },
  mouseTrajectoryUpdate: {
    label: "Mouse Trajectory",
    title: "Logs all mouse trajectory updates.",
  },
  scrollTrajectoryUpdate: {
    label: "Scroll Trajectory",
    title: "Logs scroll trajectory updates.",
  },
  managerSettingsChanged: {
    label: "Settings Changed",
    title: "Logs whenever manager settings are changed.",
  },
}

/**
 * ControlPanelLogTab manages all log-related functionality for the debugger control panel.
 * It handles event logging, filtering, display, and provides a comprehensive interface
 * for monitoring ForesightJS events in real-time.
 */
export class ControlPanelLogTab extends BaseTab {
  // Log system properties
  private logsContainer: HTMLElement | null = null
  private eventLogs: Array<SerializedEventData> = []
  private MAX_LOGS: number = 100
  private logIdCounter: number = 0

  // Control panel container reference
  private logStyleElement: HTMLStyleElement | null = null

  constructor(
    foresightManager: ForesightManager,
    debuggerInstance: ForesightDebugger,
    controlsContainer: HTMLDivElement,
    shadowRoot: ShadowRoot
  ) {
    super(foresightManager, debuggerInstance, controlsContainer)
    // Inject log-specific styles
    if (shadowRoot) {
      this.logStyleElement = createAndAppendStyle(
        this.getLogStyles(),
        shadowRoot,
        "debug-control-panel-logs"
      )
    }

    this.queryDOMElements()
    this.setupEventListeners()
    this.forceResetLogsListDisplay()
  }

  public cleanup(): void {
    this.logStyleElement?.remove()
    this.logsContainer = null
    this.eventLogs = []
    this.logStyleElement = null

    // Clean up global reference
    if ((window as any).debuggerInstance === this) {
      delete (window as any).debuggerInstance
    }
  }

  protected queryDOMElements(): void {
    this.logsContainer = queryAndAssert(".logs-container", this.controlsContainer)
  }

  protected setupEventListeners(): void {
    const filterButton = queryAndAssert("#filter-logs-button", this.controlsContainer)
    const filterDropdown = queryAndAssert("#logs-filter-dropdown", this.controlsContainer)
    const logLocationButton = queryAndAssert("#log-location-button", this.controlsContainer)
    const logLocationDropdown = queryAndAssert("#log-location-dropdown", this.controlsContainer)
    const clearLogsButton = queryAndAssert("#clear-logs-button", this.controlsContainer)

    filterButton?.addEventListener("click", e => {
      e.stopPropagation()
      filterDropdown?.classList.toggle("active")
    })

    filterDropdown?.addEventListener("click", e => {
      const target = e.target as HTMLElement
      // Find the button that was clicked, if any
      const filterBtn = target.closest("[data-log-type]") as HTMLElement | null
      if (filterBtn && filterBtn.dataset.logType) {
        // We can safely cast here because we set it from our typed config
        const eventType = filterBtn.dataset.logType as ForesightEvent
        const currentSetting = this.debuggerInstance.getDebuggerData.settings.logging[eventType]
        this.debuggerInstance.alterDebuggerSettings({
          logging: {
            [eventType]: !currentSetting,
          },
        })
        this.updateLogFilterDropdownUI()
      }
    })

    logLocationButton?.addEventListener("click", e => {
      e.stopPropagation()
      logLocationDropdown?.classList.toggle("active")
    })

    logLocationDropdown?.addEventListener("click", e => {
      const target = e.target as HTMLElement
      const locationBtn = target.closest("[data-log-location]") as HTMLElement | null
      if (locationBtn) {
        const location = locationBtn.dataset.logLocation as LoggingLocations
        this.debuggerInstance.alterDebuggerSettings({
          logging: {
            logLocation: location,
          },
        })
        this.setLocationChip()
        this.updateLogLocationDropdownUI()
        logLocationDropdown.classList.remove("active")
      }
    })

    clearLogsButton?.addEventListener("click", e => {
      e.stopPropagation()
      this.clearLogs()
    })
  }

  public clearLogs(): void {
    this.eventLogs = []
    this.logIdCounter = 0 // Reset counter
    this.refreshLogsCountChip()
    this.forceResetLogsListDisplay()
  }

  /**
   * Adds a new log entry to the top of the display efficiently.
   */
  public addEventLog<K extends ForesightEvent>(type: K, event: ForesightEventMap[K]): void {
    if (!this.logsContainer) return

    const logData = safeSerializeEventData(event)

    if (logData.type === "serializationError") {
      console.error(logData.error, logData.errorMessage)
      return
    }

    const logCount = this.eventLogs.length

    // If this is the first log, clear the "no logs" message
    if (logCount === 0) {
      this.logsContainer.innerHTML = ""
    }

    // Manage MAX_LOGS: if the limit is reached, remove the oldest log from the bottom.
    if (logCount >= this.MAX_LOGS) {
      this.eventLogs.pop() // Remove from the end of the data array (oldest).
      this.logsContainer.lastElementChild?.remove() // Remove from the bottom of the DOM.
    }

    // Add the new log to the beginning (top).
    this.eventLogs.unshift(logData)
    const logElementHTML = this.createSingleLogElementHTML(logData)
    this.logsContainer.insertAdjacentHTML("afterbegin", logElementHTML)

    this.refreshLogsCountChip()
  }

  private refreshEventCountChip() {
    const activeFilterCount = Object.values(
      this.debuggerInstance.getDebuggerData.settings.logging
    ).filter(value => value === true).length

    const filterText = `${activeFilterCount}/7`

    // Update filter status
    const filterChip = queryAndAssert('[data-dynamic="logs-filter"]', this.controlsContainer)
    if (filterChip) {
      filterChip.textContent = `${filterText.toLowerCase()}`
      filterChip.setAttribute("title", `Logging ${filterText} of the available event types`)
    }
  }

  private refreshLogsCountChip() {
    const logsChip = queryAndAssert('[data-dynamic="logs-count"]', this.controlsContainer)
    if (!logsChip) {
      return
    }
    const logCount = this.eventLogs.length

    logsChip.textContent = `${logCount > this.MAX_LOGS - 1 ? `${this.MAX_LOGS}+` : logCount} events`
    logsChip.setAttribute(
      "title",
      `Number of events logged (only tracked events are logged)
        
Max ${this.MAX_LOGS} events are shown at ones`
    )
  }

  private setLocationChip() {
    const logLocation =
      this.debuggerInstance.getDebuggerData.settings.logging.logLocation || "controlPanel"
    // Update location
    const locationChip = queryAndAssert('[data-dynamic="logs-location"]', this.controlsContainer)
    if (locationChip) {
      locationChip.textContent = logLocation
      locationChip.setAttribute("title", `Log output location: ${logLocation}`)
    }
  }

  public refreshFullTabBarContent(): void {
    this.refreshEventCountChip()
    this.refreshLogsCountChip()
    this.setLocationChip()
    this.updateLogFilterDropdownUI()
    this.updateLogLocationDropdownUI()
    this.populateLogFilterDropdown()
  }

  private getReasonForNoLogs(): string {
    const debuggerSettings = this.debuggerInstance.getDebuggerData.settings
    const logging = debuggerSettings.logging
    const allLoggingDisabled =
      !logging.callbackFired &&
      !logging.elementDataUpdated &&
      !logging.elementRegistered &&
      !logging.elementUnregistered &&
      !logging.managerSettingsChanged &&
      !logging.mouseTrajectoryUpdate &&
      !logging.scrollTrajectoryUpdate

    if (allLoggingDisabled) {
      return "Enable logging options above to see events."
    }

    if (logging.logLocation === "console") {
      return "No logs to display. Logging is set to console - check browser console for events."
    }

    return "Interact with Foresight to generate events."
  }

  /**
   * Creates the HTML string for a single log entry.
   */
  private createSingleLogElementHTML(logData: SerializedEventData): string {
    const logId = `log-${this.logIdCounter++}` // Use a class counter for a unique ID
    return /* html */ ` <div class="log-entry log-${logData.type}" data-log-id="${logId}">
      <div class="log-header" onclick="window.debuggerInstance?.toggleLogEntry('${logId}')">
        <span class="log-time">${logData.localizedTimestamp}</span>
        <span class="log-type">${logData.type}</span>
        <span class="log-summary">${logData.summary}</span>
        <span class="log-toggle">▶</span>
      </div>
      <div class="log-details" style="display: none;">
        <pre class="log-data">${JSON.stringify(logData, null, 2)}</pre>
      </div>
    </div>`
  }

  /**
   * Used ONLY for initialization and after clearing logs.
   */
  private forceResetLogsListDisplay(): void {
    if (!this.logsContainer) return

    this.logIdCounter = 0 // Reset counter on full refresh

    if (this.eventLogs.length === 0) {
      this.logsContainer.innerHTML = `<div class="no-items">${this.getReasonForNoLogs()}</div>`
    } else {
      this.logsContainer.innerHTML = this.eventLogs
        .map(log => this.createSingleLogElementHTML(log))
        .join("")
    }
  }

  // TODO logs details are not showing in the correct spot
  public toggleLogEntry(logId: string): void {
    const logEntry = queryAndAssert(`[data-log-id="${logId}"]`, this.logsContainer) as HTMLElement
    if (!logEntry) return

    const details = queryAndAssert(".log-details", logEntry) as HTMLElement
    const toggle = queryAndAssert(".log-toggle", logEntry) as HTMLElement

    if (details && toggle) {
      const isVisible = details.style.display !== "none"
      details.style.display = isVisible ? "none" : "block"
      toggle.textContent = isVisible ? "▶" : "▼"
    }
  }

  private populateLogFilterDropdown(): void {
    const filterDropdown = queryAndAssert("#logs-filter-dropdown", this.controlsContainer)
    if (!filterDropdown) return

    // Clear any existing content to be safe
    filterDropdown.innerHTML = ""

    // Iterate over our type-safe config object
    for (const key in LOGGABLE_EVENTS_CONFIG) {
      // TypeScript knows `key` is of type `ForesightEvent` here
      const eventType = key as ForesightEvent
      const config = LOGGABLE_EVENTS_CONFIG[eventType]

      const button = document.createElement("button")
      button.textContent = config.label
      button.title = config.title
      // Use a data-attribute to identify the button's purpose
      button.dataset.logType = eventType
      filterDropdown.appendChild(button)
    }
  }

  private updateLogFilterDropdownUI(): void {
    const filterDropdown = queryAndAssert(
      "#logs-filter-dropdown",
      this.controlsContainer
    ) as HTMLElement
    if (!filterDropdown) return

    const filterButtons = queryAllAndAssert("[data-log-type]", filterDropdown)
    if (!filterButtons) {
      return
    }
    const currentSettings = this.debuggerInstance.getDebuggerData.settings.logging

    filterButtons.forEach(button => {
      const btn = button as HTMLElement
      const logType = btn.dataset.logType as ForesightEvent
      if (logType) {
        button.classList.toggle("active", !!currentSettings[logType])
      }
    })
  }

  private updateLogLocationDropdownUI(): void {
    const logLocationDropdown = queryAndAssert(
      "#log-location-dropdown",
      this.controlsContainer
    ) as HTMLElement
    const logLocationButtons = queryAllAndAssert("[data-log-location]", logLocationDropdown)
    const currentLocation =
      this.debuggerInstance.getDebuggerData.settings.logging.logLocation || "controlPanel"

    logLocationButtons?.forEach(button => {
      const location = (button as HTMLElement).dataset.logLocation!
      button.classList.toggle("active", location === currentLocation)
    })
  }

  public initializeTabBar(): void {
    this.refreshFullTabBarContent()
  }

  public getLogStyles(): string {
    return /* css */ `
      .logs-container {
        flex: 1;
        overflow-y: auto;
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
      }
      
      .log-data {
        color: #e0e0e0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    `
  }
}
