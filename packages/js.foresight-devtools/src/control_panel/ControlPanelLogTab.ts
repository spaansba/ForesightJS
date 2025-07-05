import type { ForesightManager } from "js.foresight"
import type { ForesightDebugger } from "../debugger/ForesightDebugger"
import type { ForesightEvent, ForesightEventMap } from "js.foresight/types/types"
import type { LoggingLocations } from "../types/types"
import { BaseTab } from "./BaseTab"
import { safeSerializeEventData, type ControlPanelLogEntry } from "./helpers/safeSerializeEventData"
import { createAndAppendStyle } from "../debugger/helpers/createAndAppend"

// Type for serialized event data from safeSerializeEventData helper function
type SerializedEventData = ReturnType<typeof safeSerializeEventData>

type LogConfig = {
  label: string
  title: string
}

// The single source of truth for all loggable events.
// It's typed with Record<ForesightEvent, ...> for full type safety.
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
  private eventLogs: Array<ControlPanelLogEntry> = []
  private maxLogs: number = 100

  // Control panel container reference
  private controlsContainer: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private logStyleElement: HTMLStyleElement | null = null

  constructor(foresightManager: ForesightManager, debuggerInstance: ForesightDebugger) {
    super(foresightManager, debuggerInstance)
  }

  public initialize(controlsContainer: HTMLElement, shadowRoot?: ShadowRoot): void {
    this.controlsContainer = controlsContainer
    this.shadowRoot = shadowRoot || null

    // Inject log-specific styles
    if (this.shadowRoot) {
      this.logStyleElement = createAndAppendStyle(
        this.getLogStyles(),
        this.shadowRoot,
        "debug-control-panel-logs"
      )
    }

    this.queryDOMElements(controlsContainer)
    this.setupEventListeners()
    this.forceResetLogsListDisplay() // Initial render

    // Store reference for toggle functionality
    if ((window as any).debuggerInstance !== this) {
      ;(window as any).debuggerInstance = this
    }
  }

  public cleanup(): void {
    this.logStyleElement?.remove()
    this.logsContainer = null
    this.eventLogs = []
    this.controlsContainer = null
    this.shadowRoot = null
    this.logStyleElement = null

    // Clean up global reference
    if ((window as any).debuggerInstance === this) {
      delete (window as any).debuggerInstance
    }
  }

  protected queryDOMElements(controlsContainer: HTMLElement): void {
    this.logsContainer = controlsContainer.querySelector(".logs-container")
  }

  protected setupEventListeners(): void {
    // Event listeners will be set up when tab bar is created
  }

  public clearLogs(): void {
    this.eventLogs = []
    this.setLogsCountChip()
    // Perform a full refresh to show the "no logs" message
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

    const logEntry: ControlPanelLogEntry = {
      type,
      data: logData,
    }

    const logCount = this.eventLogs.length

    // If this is the first log, clear the "no logs" message
    if (logCount === 0) {
      this.logsContainer.innerHTML = ""
    }

    if (logCount > this.maxLogs) {
      this.eventLogs.pop()
      this.logsContainer.lastElementChild?.remove()
    }

    this.eventLogs.unshift(logEntry)
    const logElementHTML = this.createSingleLogElementHTML(logEntry, 0)
    this.logsContainer.insertAdjacentHTML("afterbegin", logElementHTML)

    this.setLogsCountChip()
  }

  private setLogsCountChip() {
    const logsChip = this.controlsContainer?.querySelector('[data-dynamic="logs-count"]')
    if (!logsChip) {
      return
    }
    const logCount = this.eventLogs.length

    logsChip.textContent = `${logCount > this.maxLogs - 1 ? `${this.maxLogs}+` : logCount} events`
    logsChip.setAttribute(
      "title",
      `Number of events logged (only tracked events are logged)
        
Max ${this.maxLogs} events are shown at ones`
    )
  }

  public updateTabBarContent(): void {
    const activeFilterCount = Object.values(
      this.debuggerInstance.getDebuggerData.settings.logging
    ).filter(value => value === true).length

    const filterText =
      activeFilterCount === 7
        ? "All events"
        : activeFilterCount === 0
        ? "No events"
        : `${activeFilterCount} event types`

    const logLocation =
      this.debuggerInstance.getDebuggerData.settings.logging.logLocation || "controlPanel"

    this.setLogsCountChip()

    // Update filter status
    const filterChip = this.controlsContainer?.querySelector('[data-dynamic="logs-filter"]')
    if (filterChip) {
      filterChip.textContent = `${filterText.toLowerCase()}`
    }

    // Update location
    const locationChip = this.controlsContainer?.querySelector('[data-dynamic="logs-location"]')
    if (locationChip) {
      locationChip.textContent = logLocation
      locationChip.setAttribute("title", `Log output location: ${logLocation}`)
    }

    // Update UI states
    this.updateLogFilterUI()
    this.updateLogLocationUI()
  }

  public attachEventListeners(): void {
    this.setupLogsFilterListeners()
  }

  private getReasonForNoLogs(): string {
    const debuggerSettings = this.debuggerInstance.getDebuggerData.settings
    const logging = debuggerSettings.logging

    // If we have logs but they're filtered out, show filter message
    if (this.eventLogs.length > 0) {
      return "No logs to display. Check your filter settings."
    }

    // Check if all logging options are disabled
    const allLoggingDisabled =
      !logging.callbackFired &&
      !logging.elementDataUpdated &&
      !logging.elementRegistered &&
      !logging.elementUnregistered &&
      !logging.managerSettingsChanged &&
      !logging.mouseTrajectoryUpdate &&
      !logging.scrollTrajectoryUpdate

    if (allLoggingDisabled) {
      return "No logs to display. Enable logging options above to see events."
    }

    if (logging.logLocation === "console") {
      return "No logs to display. Logging is set to console - check browser console for events."
    }

    return "No logs to display. Interact with elements to generate events."
  }

  /**
   * Creates the HTML string for a single log entry.
   */
  private createSingleLogElementHTML(log: ControlPanelLogEntry, index: number): string {
    const logId = `log-${index}` // Note: index is only for initial render
    const summary = this.getLogSummary(log.data)

    return `<div class="log-entry log-${log.type}" data-log-id="${logId}">
      <div class="log-header" onclick="window.debuggerInstance?.toggleLogEntry('${logId}')">
        <span class="log-time">${log.data.localizedTimestamp}</span>
        <span class="log-type">${log.type}</span>
        <span class="log-summary">${summary}</span>
        <span class="log-toggle">▶</span>
      </div>
      <div class="log-details" style="display: none;">
        <pre class="log-data">${JSON.stringify(log.data, null, 2)}</pre>
      </div>
    </div>`
  }

  /**
   * Used ONLY for initialization and after clearing logs.
   */
  private forceResetLogsListDisplay(): void {
    if (!this.logsContainer) return

    if (this.eventLogs.length === 0) {
      this.logsContainer.innerHTML = `<div class="no-items">${this.getReasonForNoLogs()}</div>`
    } else {
      this.logsContainer.innerHTML = this.eventLogs
        .map((log, index) => this.createSingleLogElementHTML(log, index))
        .join("")
    }
  }

  // TODO logs details are not showing in the correct spot
  public toggleLogEntry(logId: string): void {
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

  // The small summary you see in the right of the event
  private getLogSummary(event: SerializedEventData): string {
    switch (event.type) {
      case "elementRegistered":
        return `${event.name}`
      case "elementUnregistered":
        return `${event.name} - ${event.unregisterReason}`
      case "callbackFired":
        return `${event.name} - ${event.hitType}`
      case "elementDataUpdated":
        return `${event.name} - ${event.updatedProps?.join(", ") || "unknown props"}`
      case "mouseTrajectoryUpdate":
        return `${event.positionCount} positions`
      case "scrollTrajectoryUpdate":
        return `scroll prediction`
      case "managerSettingsChanged":
        return `settings updated`
      default:
        return "event data"
    }
  }

  private populateLogFilterDropdown(): void {
    const filterDropdown = this.controlsContainer?.querySelector("#logs-filter-dropdown")
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

  private setupLogsFilterListeners(): void {
    const filterButton = this.controlsContainer?.querySelector("#filter-logs-button")
    const filterDropdown = this.controlsContainer?.querySelector("#logs-filter-dropdown")
    const logLocationButton = this.controlsContainer?.querySelector("#log-location-button")
    const logLocationDropdown = this.controlsContainer?.querySelector("#log-location-dropdown")
    const clearLogsButton = this.controlsContainer?.querySelector("#clear-logs-button")

    // This listener ONLY toggles visibility. No more button creation here.
    filterButton?.addEventListener("click", e => {
      e.stopPropagation()
      filterDropdown?.classList.toggle("active")
    })

    // Use EVENT DELEGATION for efficiency. One listener on the parent.
    filterDropdown?.addEventListener("click", e => {
      const target = e.target as HTMLElement
      // Find the button that was clicked, if any
      const filterBtn = target.closest("[data-log-type]") as HTMLElement | null
      if (filterBtn && filterBtn.dataset.logType) {
        // We can safely cast here because we set it from our typed config
        const eventType = filterBtn.dataset.logType as ForesightEvent
        this.toggleLogFilter(eventType)
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
        this.setLogLocation(location)
        this.updateTabBarContent()
        logLocationDropdown.classList.remove("active")
      }
    })

    clearLogsButton?.addEventListener("click", e => {
      e.stopPropagation()
      this.clearLogs()
    })
  }

  private toggleLogFilter(eventType: ForesightEvent): void {
    const currentSetting = this.debuggerInstance.getDebuggerData.settings.logging[eventType]

    this.debuggerInstance.alterDebuggerSettings({
      logging: {
        [eventType]: !currentSetting,
      },
    })
    // After altering the setting, we must update the UI to reflect the change.
    this.updateLogFilterUI()
    this.updateTabBarContent()
  }

  private setLogLocation(location: LoggingLocations): void {
    this.debuggerInstance.alterDebuggerSettings({
      logging: {
        logLocation: location,
      },
    })
  }

  private updateLogFilterUI(): void {
    const filterDropdown = this.controlsContainer?.querySelector("#logs-filter-dropdown")
    if (!filterDropdown) return

    const filterButtons = filterDropdown.querySelectorAll("[data-log-type]")
    const currentSettings = this.debuggerInstance.getDebuggerData.settings.logging

    filterButtons.forEach(button => {
      const btn = button as HTMLElement
      const logType = btn.dataset.logType as ForesightEvent
      if (logType) {
        button.classList.toggle("active", !!currentSettings[logType])
      }
    })
  }

  private updateLogLocationUI(): void {
    const logLocationDropdown = this.controlsContainer?.querySelector("#log-location-dropdown")
    const logLocationButtons = logLocationDropdown?.querySelectorAll("[data-log-location]")
    const currentLocation =
      this.debuggerInstance.getDebuggerData.settings.logging.logLocation || "controlPanel"

    logLocationButtons?.forEach(button => {
      const location = (button as HTMLElement).dataset.logLocation!
      button.classList.toggle("active", location === currentLocation)
    })
  }

  public initializeTabBar(): void {
    this.populateLogFilterDropdown()
    this.updateTabBarContent()
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
