import { ForesightManager } from "js.foresight"
import type { ForesightEvent, ForesightEventMap } from "js.foresight/types/types"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { map } from "lit/directives/map.js"
import {
  safeSerializeEventData,
  safeSerializeManagerData,
  type SerializedEventData,
} from "../../../helpers/safeSerializeEventData"
import {
  BOTH_SVG,
  CLEAR_SVG,
  CONSOLE_SVG,
  CONTROL_PANEL_SVG,
  FILTER_SVG,
  NONE_SVG,
  STATE_SVG,
  WARNING_SVG,
} from "../../../svg/svg-icons"
import type { LogEvents, LoggingLocations } from "../../../types/types"
import { ForesightDevtools } from "../../foresight-devtools"
import "../base-tab/chip"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../copy-icon/copy-icon"
import "../dropdown/multi-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import "./single-log"

@customElement("log-tab")
export class LogTab extends LitElement {
  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .chips-container {
        display: flex;
        gap: 4px;
      }

      .single-button {
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

      .single-button svg {
        width: 16px;
        height: 16px;
        stroke: white;
        transition: stroke 0.2s;
      }

      .single-button:hover {
        background-color: rgba(176, 196, 222, 0.1);
      }

      .single-button:hover svg {
        stroke: #b0c4de;
      }

      .single-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .single-button:disabled:hover {
        background: none;
      }

      .single-button:disabled svg {
        stroke: #666;
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

      .warning-container {
        background: none;
        border: none;
        color: #ffc107;
        cursor: help;
        padding: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        vertical-align: top;
      }

      .warning-container svg {
        width: 16px;
        height: 16px;
        stroke: #ffc107;
        fill: none;
        transition: stroke 0.2s;
      }

      .warning-container:hover {
        background-color: rgba(255, 193, 7, 0.1);
      }

      .warning-container:hover svg {
        stroke: #ffdc3e;
      }
    `,
  ]

  @state() private logDropdown: DropdownOption[]
  @state() private filterDropdown: DropdownOption[]
  @state() private logLocation: LoggingLocations
  @state() private eventsEnabled: LogEvents
  @state() private logs: Array<SerializedEventData> = []
  @state() private expandedLogIds: Set<string> = new Set()
  private MAX_LOGS: number = 100
  private logIdCounter: number = 0

  @property() noContentMessage: string = "No logs available"
  private _abortController: AbortController | null = null
  private _eventListeners: Map<ForesightEvent, (event: ForesightEventMap[ForesightEvent]) => void> =
    new Map()

  constructor() {
    super()
    const {
      logging: { logLocation, ...eventFlags },
    } = ForesightDevtools.instance.devtoolsSettings
    this.eventsEnabled = eventFlags
    this.logLocation = logLocation
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
      {
        value: "none",
        label: "None",
        title: "Dont log anywhere",
        icon: NONE_SVG,
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
        value: "elementReactivated",
        label: "Element Reactivated",
        title: "Show when element gets reactivated after stale time has passed",
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
      {
        value: "deviceStrategyChanged",
        label: "Strategy Changed",
        title: "Show strategy change events",
        icon: FILTER_SVG,
      },
    ]
  }

  private handleLogLocationChange = (value: string): void => {
    this.logLocation = value as LoggingLocations
  }

  private handleFilterChange = (changedEventType: string, isEnabled: boolean): void => {
    this.eventsEnabled = {
      ...this.eventsEnabled,
      [changedEventType]: isEnabled,
    }
    if (isEnabled) {
      this.addForesightEventListener(changedEventType as ForesightEvent)
    } else {
      this.removeForesightEventListener(changedEventType as ForesightEvent)
    }
  }

  private getSelectedEventFilters(): string[] {
    return Object.entries(this.eventsEnabled)
      .filter(([, enabled]) => enabled)
      .map(([eventType]) => eventType)
  }

  //TODO check if devtools is open, but is harder than I thought. Look into later
  private shouldShowPerformanceWarning(): boolean {
    const hasConsoleOutput = this.logLocation === "console" || this.logLocation === "both"
    const hasFrequentEvents =
      this.eventsEnabled.mouseTrajectoryUpdate ||
      this.eventsEnabled.scrollTrajectoryUpdate ||
      this.eventsEnabled.elementDataUpdated
    return hasConsoleOutput && hasFrequentEvents
  }

  private getNoLogsMessage(): string {
    const enabledCount = Object.values(this.eventsEnabled).filter(Boolean).length
    if (enabledCount === 0) {
      return "Logging for all events is turned off"
    }
    if (this.logLocation === "console") {
      return "No logs to display. Logging location is set to console - check browser console for events."
    }
    if (this.logLocation === "none") {
      return "No logs to display. Logging location is set to none"
    }
    return "Interact with Foresight to generate events."
  }

  private handleLogToggle = (logId: string): void => {
    const newExpandedLogIds = new Set(this.expandedLogIds)
    if (newExpandedLogIds.has(logId)) {
      newExpandedLogIds.delete(logId)
    } else {
      newExpandedLogIds.add(logId)
    }
    this.expandedLogIds = newExpandedLogIds
  }

  private clearLogs(): void {
    this.logs = []
    this.expandedLogIds.clear()
    this.noContentMessage = "Logs cleared"
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    this.setupDynamicEventListeners()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
    this.removeAllEventListeners()
  }

  private setupDynamicEventListeners(): void {
    Object.entries(this.eventsEnabled).forEach(([eventType, enabled]) => {
      if (enabled) {
        this.addForesightEventListener(eventType as ForesightEvent)
      }
    })
  }

  private addForesightEventListener(eventType: ForesightEvent): void {
    if (this._eventListeners.has(eventType)) return
    const handler = (event: ForesightEventMap[typeof eventType]) => {
      this.handleEvent(eventType, event)
    }
    this._eventListeners.set(eventType, handler)
    ForesightManager.instance.addEventListener(eventType, handler, {
      signal: this._abortController?.signal,
    })
  }

  private removeForesightEventListener(eventType: ForesightEvent): void {
    const handler = this._eventListeners.get(eventType)
    if (handler) {
      ForesightManager.instance.removeEventListener(eventType, handler)
      this._eventListeners.delete(eventType)
    }
  }

  private removeAllEventListeners(): void {
    this._eventListeners.forEach((handler, eventType) => {
      ForesightManager.instance.removeEventListener(eventType, handler)
    })
    this._eventListeners.clear()
  }

  //TODO fix these events and in single-log
  private getEventColor(eventType: ForesightEvent): string {
    const colorMap: Record<ForesightEvent, string> = {
      elementRegistered: "#2196f3",
      elementReactivated: "#ff9800",
      callbackInvoked: "#00bcd4",
      callbackCompleted: "#4caf50",
      elementDataUpdated: "#ffc107",
      elementUnregistered: "#ff9800",
      managerSettingsChanged: "#f44336",
      mouseTrajectoryUpdate: "#78909c",
      scrollTrajectoryUpdate: "#607d8b",
      deviceStrategyChanged: "#9c27b0",
    }
    return colorMap[eventType] || "#ffffff"
  }

  private handleEvent<K extends ForesightEvent>(eventType: K, event: ForesightEventMap[K]): void {
    if (this.logLocation === "none") {
      return
    }
    if (this.logLocation === "console" || this.logLocation === "both") {
      const color = this.getEventColor(eventType)
      console.log(`%c[ForesightJS] ${eventType}`, `color: ${color}; font-weight: bold;`, event)
    }
    if (this.logLocation === "controlPanel" || this.logLocation === "both") {
      this.addEventLog(event)
    }
  }

  private addLog(log: SerializedEventData) {
    this.logs.unshift(log)
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop()
    }
    this.requestUpdate()
  }

  private logManagerData(): void {
    if (this.logLocation === "none") {
      return
    }
    if (this.logLocation === "console" || this.logLocation === "both") {
      console.log(ForesightManager.instance.getManagerData)
    }
    if (this.logLocation === "controlPanel" || this.logLocation === "both") {
      this.addManagerLog()
    }
  }

  private addManagerLog(): void {
    const log = safeSerializeManagerData(
      ForesightManager.instance.getManagerData,
      (++this.logIdCounter).toString()
    )
    this.addLog(log)
  }

  private addEventLog<K extends ForesightEvent>(event: ForesightEventMap[K]): void {
    const log = safeSerializeEventData(event, (++this.logIdCounter).toString())
    if (log.type === "serializationError") {
      console.error(log.error, log.errorMessage)
      return
    }
    this.addLog(log)
  }

  render() {
    return html`
      <tab-header>
        <div slot="chips" class="chips-container">
          <chip-element title="Number of logged events (Max ${this.MAX_LOGS})">
            ${this.logs.length} events
          </chip-element>
        </div>
        <div slot="actions">
          ${this.shouldShowPerformanceWarning()
            ? html`
                <div
                  class="warning-container"
                  title="Console logging can be slow with frequent trajectory events.
Consider using 'Control Panel' only for better performance."
                >
                  ${WARNING_SVG}
                </div>
              `
            : ""}
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
            class="single-button"
            title="Log the state from the manager"
            @click="${this.logManagerData}"
          >
            ${STATE_SVG}
          </button>
          <button
            class="single-button"
            title="Clear all logs"
            ?disabled="${this.logs.length === 0}"
            @click="${this.clearLogs}"
          >
            ${CLEAR_SVG}
          </button>
        </div>
      </tab-header>
      <tab-content .noContentMessage=${this.noContentMessage} .hasContent=${!!this.logs.length}>
        ${this.logs.length === 0
          ? html`<div class="no-items">${this.getNoLogsMessage()}</div>`
          : map(this.logs, log => {
              return html`
                <single-log
                  .log=${log}
                  .isExpanded=${this.expandedLogIds.has(log.logId)}
                  .onToggle=${this.handleLogToggle}
                ></single-log>
              `
            })}
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "log-tab": LogTab
  }
}
