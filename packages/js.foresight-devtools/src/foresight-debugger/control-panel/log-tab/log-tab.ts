import { ForesightManager } from "js.foresight"
import type { ForesightEvent, ForesightEventMap } from "js.foresight/types/types"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { map } from "lit/directives/map.js"
import {
  safeSerializeEventData,
  type SerializedEventData,
} from "packages/js.foresight-devtools/src/control_panel/controlPanelLogTab/helpers/safeSerializeEventData"
import type { LogEvents, LoggingLocations } from "packages/js.foresight-devtools/src/types/types"
import { ForesightDebuggerLit } from "../../ForesightDebuggerLit"
import {
  BOTH_SVG,
  CLEAR_SVG,
  CONSOLE_SVG,
  CONTROL_PANEL_SVG,
  FILTER_SVG,
} from "../../svg/svg-icons"
import "../chip"
import "../dropdown/multi-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import "../tab-content"
import "../tab-header"

@customElement("log-tab")
export class LogTab extends LitElement {
  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .clear-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        vertical-align: top;
      }

      .clear-button svg {
        width: 16px;
        height: 16px;
        stroke: white;
        transition: stroke 0.2s;
      }

      .clear-button:hover {
        background-color: rgba(176, 196, 222, 0.1);
      }

      .clear-button:hover svg {
        stroke: #b0c4de;
      }

      .clear-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .clear-button:disabled:hover {
        background: none;
      }

      .clear-button:disabled svg {
        stroke: #666;
      }

      .logs-container {
        flex: 1;
        overflow-y: auto;
      }

      .no-items {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        text-align: center;
        font-family: "Courier New", monospace;
        font-style: italic;
        padding: 20px;
        color: #999;
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
        max-height: 200px;
        overflow-y: auto;
      }

      .log-summary {
        flex: 1;
        color: #ccc;
        font-size: 11px;
        opacity: 0.8;
      }

      .log-toggle {
        color: #b0c4de;
        font-size: 11px;
        transition: transform 0.2s ease;
        width: 12px;
        text-align: center;
        user-select: none;
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
        font-size: 11px;
      }

      .log-type {
        color: #b0c4de;
        margin-right: 8px;
        font-weight: bold;
        font-size: 11px;
      }

      .log-data {
        color: #e0e0e0;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-size: 11px;
        margin: 4px 0 0 0;
      }
    `,
  ]

  @state() private logDropdown: DropdownOption[]
  @state() private filterDropdown: DropdownOption[]
  @state() private logLocation: LoggingLocations = "controlPanel"
  @state() private logs: Array<SerializedEventData> = []
  @state() private expandedLogs: Set<string> = new Set()
  private MAX_LOGS: number = 100

  @state() private eventsEnabled: LogEvents = {
    elementRegistered: false,
    elementUnregistered: false,
    elementDataUpdated: false,
    callbackInvoked: true,
    callbackCompleted: true,
    mouseTrajectoryUpdate: false,
    scrollTrajectoryUpdate: false,
    managerSettingsChanged: false,
  }

  @property() noContentMessage: string = "No logs available"
  private _abortController: AbortController | null = null
  private _eventListeners: Map<ForesightEvent, (event: ForesightEventMap[ForesightEvent]) => void> =
    new Map()

  constructor() {
    super()
    this.logDropdown = [
      {
        value: "controlPanel",
        label: "Control Panel",
        title: "Log only to the control panel",
        icon: CONTROL_PANEL_SVG,
      },
      {
        value: "console",
        label: "Console",
        title: "Log only to the console",
        icon: CONSOLE_SVG,
      },
      {
        value: "both",
        label: "Both",
        title: "Log to both the control panel and the console",
        icon: BOTH_SVG,
      },
    ]

    this.filterDropdown = [
      {
        value: "elementRegistered",
        label: "Element Registered",
        title: "Show element registration events",
        icon: FILTER_SVG,
      },
      {
        value: "elementUnregistered",
        label: "Element Unregistered",
        title: "Show element unregistration events",
        icon: FILTER_SVG,
      },
      {
        value: "elementDataUpdated",
        label: "Element Data Updated",
        title: "Show element data update events",
        icon: FILTER_SVG,
      },
      {
        value: "callbackInvoked",
        label: "Callback Invoked",
        title: "Show callback invoked events",
        icon: FILTER_SVG,
      },
      {
        value: "callbackCompleted",
        label: "Callback Completed",
        title: "Show callback completed events",
        icon: FILTER_SVG,
      },
      {
        value: "mouseTrajectoryUpdate",
        label: "Mouse Trajectory Update",
        title: "Show mouse trajectory update events",
        icon: FILTER_SVG,
      },
      {
        value: "scrollTrajectoryUpdate",
        label: "Scroll Trajectory Update",
        title: "Show scroll trajectory update events",
        icon: FILTER_SVG,
      },
      {
        value: "managerSettingsChanged",
        label: "Manager Settings Changed",
        title: "Show manager settings change events",
        icon: FILTER_SVG,
      },
    ]
  }

  private handleLogLocationChange = (value: string): void => {
    this.logLocation = value as LoggingLocations
  }

  private handleFilterChange = (changedEventType: string, isEnabled: boolean): void => {
    // Update just the changed event in the state
    this.eventsEnabled = {
      ...this.eventsEnabled,
      [changedEventType]: isEnabled,
    }

    // Add or remove the specific event listener
    if (isEnabled) {
      this.addForesightEventListener(changedEventType as ForesightEvent)
    } else {
      this.removeForesightEventListener(changedEventType as ForesightEvent)
    }
  }

  private getSelectedEventFilters(): string[] {
    return Object.entries(this.eventsEnabled)
      .filter(([_, enabled]) => enabled)
      .map(([eventType, _]) => eventType)
  }

  /**
   * Toggles the expanded state of a log entry
   */
  private toggleLogEntry(logId: string): void {
    if (this.expandedLogs.has(logId)) {
      this.expandedLogs.delete(logId)
    } else {
      this.expandedLogs.add(logId)
    }
    this.requestUpdate()
  }

  /**
   * Gets the message to display when no logs are available
   */
  private getNoLogsMessage(): string {
    const enabledCount = Object.values(this.eventsEnabled).filter(Boolean).length

    if (enabledCount === 0) {
      return "Enable logging options above to see events."
    }

    if (this.logLocation === "console") {
      return "No logs to display. Logging is set to console - check browser console for events."
    }

    return "Interact with Foresight to generate events."
  }

  private clearLogs(): void {
    this.logs = []
    this.expandedLogs.clear()
    this.requestUpdate()
    this.noContentMessage = "Logs cleared"
  }

  connectedCallback(): void {
    super.connectedCallback()
    const {
      logging: { logLocation, ...eventFlags },
    } = ForesightDebuggerLit.instance.devtoolsSettings

    this.eventsEnabled = eventFlags
    this.logLocation = logLocation

    this._abortController = new AbortController()

    // Set up event listeners for enabled events
    this.setupDynamicEventListeners()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
    this.removeAllEventListeners()
  }

  /**
   * Sets up event listeners for all enabled events
   */
  private setupDynamicEventListeners(): void {
    Object.entries(this.eventsEnabled).forEach(([eventType, enabled]) => {
      if (enabled) {
        this.addForesightEventListener(eventType as ForesightEvent)
      }
    })
  }

  /**
   * Adds an event listener for a specific event type
   */
  private addForesightEventListener(eventType: ForesightEvent): void {
    if (this._eventListeners.has(eventType)) {
      return
    }

    const handler = (event: ForesightEventMap[typeof eventType]) => {
      this.handleEvent(eventType, event)
    }

    // Store the handler for later removal
    this._eventListeners.set(eventType, handler)

    // Add the listener to ForesightManager
    ForesightManager.instance.addEventListener(eventType, handler, {
      signal: this._abortController?.signal,
    })
  }

  /**
   * Removes an event listener for a specific event type
   */
  private removeForesightEventListener(eventType: ForesightEvent): void {
    const handler = this._eventListeners.get(eventType)
    if (handler) {
      ForesightManager.instance.removeEventListener(eventType, handler)
      this._eventListeners.delete(eventType)
    }
  }

  /**
   * Removes all event listeners
   */
  private removeAllEventListeners(): void {
    this._eventListeners.forEach((handler, eventType) => {
      ForesightManager.instance.removeEventListener(eventType, handler)
    })
    this._eventListeners.clear()
  }

  /**
   * Gets the color for a specific event type (matching control panel colors)
   */
  private getEventColor(eventType: ForesightEvent): string {
    const colorMap: Record<ForesightEvent, string> = {
      callbackCompleted: "#4caf50", // Green
      callbackInvoked: "#2cd466", // Green
      elementRegistered: "#2196f3", // Blue
      elementUnregistered: "#ff9800", // Orange
      mouseTrajectoryUpdate: "#9c27b0", // Purple
      scrollTrajectoryUpdate: "#00bcd4", // Cyan
      elementDataUpdated: "#ffeb3b", // Yellow
      managerSettingsChanged: "#f44336", // Red
    }
    return colorMap[eventType] || "#ffffff"
  }

  /**
   * Handles incoming events and logs them appropriately
   */
  private handleEvent<K extends ForesightEvent>(eventType: K, event: ForesightEventMap[K]): void {
    const logLocation = this.logLocation

    if (logLocation === "console" || logLocation === "both") {
      const color = this.getEventColor(eventType)
      console.log(`%c[ForesightJS] ${eventType}:`, `color: ${color}; font-weight: bold;`, event)
    }

    // Add to control panel logs if enabled
    if (logLocation === "controlPanel" || logLocation === "both") {
      this.addEventLog(eventType, event)
    }
  }

  /**
   * Adds an event log to the control panel (based on original implementation)
   */
  private addEventLog<K extends ForesightEvent>(eventType: K, event: ForesightEventMap[K]): void {
    const logData = safeSerializeEventData(event)

    if (logData.type === "serializationError") {
      console.error(logData.error, logData.errorMessage)
      return
    }

    // Manage MAX_LOGS: if the limit is reached, remove the oldest log
    if (this.logs.length >= this.MAX_LOGS) {
      this.logs.pop() // Remove from the end (oldest)
    }

    // Add the new log to the beginning (most recent)
    this.logs.unshift(logData)
    this.requestUpdate()
  }

  private serializeLogDataWithoutSummary(log: SerializedEventData): string {
    const { summary, ...rest } = log
    return JSON.stringify(rest, null, 2)
  }

  render() {
    return html`
      <tab-header>
        <div slot="chips">
          <chip-element title="Number of logged events (Max ${this.MAX_LOGS})">
            ${this.logs.length} events
          </chip-element>
        </div>
        <div slot="actions">
          <single-select-dropdown
            .dropdownOptions="${this.logDropdown}"
            .selectedOptionValue="${this.logLocation}"
            .onSelectionChange="${this.handleLogLocationChange}"
          ></single-select-dropdown>
          <multi-select-dropdown
            .dropdownOptions="${this.filterDropdown}"
            .selectedValues="${this.getSelectedEventFilters()}"
            .onSelectionChange="${this.handleFilterChange}"
          ></multi-select-dropdown>
          <button
            class="clear-button"
            title="Clear all logs"
            ?disabled="${this.logs.length === 0}"
            @click="${this.clearLogs}"
          >
            ${CLEAR_SVG}
          </button>
        </div>
      </tab-header>
      <tab-content .noContentMessage=${this.noContentMessage} .hasContent=${!!this.logs.length}>
        <div class="logs-container">
          ${this.logs.length === 0
            ? html`<div class="no-items">${this.getNoLogsMessage()}</div>`
            : map(this.logs, (log, index) => {
                const logId = `log-${index}-${log.type}-${log.localizedTimestamp}`
                const isExpanded = this.expandedLogs.has(logId)

                return html`
                  <div class="log-entry log-${log.type}">
                    <div class="log-header" @click="${() => this.toggleLogEntry(logId)}">
                      <span class="log-time">${log.localizedTimestamp}</span>
                      <span class="log-type">${log.type}</span>
                      <span class="log-summary">${log.summary}</span>
                      <span class="log-toggle">${isExpanded ? "▼" : "▶"}</span>
                    </div>
                    ${isExpanded
                      ? html`
                          <div class="log-details">
                            <pre class="log-data">${this.serializeLogDataWithoutSummary(log)}</pre>
                          </div>
                        `
                      : ""}
                  </div>
                `
              })}
        </div>
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "log-tab": LogTab
  }
}
