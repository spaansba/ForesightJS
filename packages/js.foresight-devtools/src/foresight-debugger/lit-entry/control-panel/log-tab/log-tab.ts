import { ForesightManager } from "js.foresight"
import type { ForesightEvent, ForesightEventMap } from "js.foresight/types/types"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { map } from "lit/directives/map.js"
import {
  safeSerializeEventData,
  type SerializedEventData,
} from "packages/js.foresight-devtools/src/foresight-debugger/helpers/safeSerializeEventData"
import type { LogEvents, LoggingLocations } from "packages/js.foresight-devtools/src/types/types"
import {
  BOTH_SVG,
  CLEAR_SVG,
  CONSOLE_SVG,
  CONTROL_PANEL_SVG,
  FILTER_SVG,
  NONE_SVG,
} from "../../../svg/svg-icons"
import "../base-tab/chip"
import "../dropdown/multi-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../copy-icon/copy-icon"
import "./single-log"
import { ForesightDebuggerLit } from "../../../ForesightDebuggerLit"

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
        padding: 4px;
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
    `,
  ]

  @state() private logDropdown: DropdownOption[]
  @state() private filterDropdown: DropdownOption[]
  @state() private logLocation: LoggingLocations = "controlPanel"
  @state() private logs: Array<SerializedEventData> = []
  @state() private expandedLogs: Set<string> = new Set()
  private MAX_LOGS: number = 100

  // This state property is essential to track WHICH log item was copied.
  @state() private copiedLogId: string | null = null

  @state() private eventsEnabled: LogEvents = {
    elementRegistered: false,
    elementUnregistered: false,
    elementDataUpdated: false,
    callbackInvoked: false,
    callbackCompleted: false,
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
      .filter(([_, enabled]) => enabled)
      .map(([eventType, _]) => eventType)
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

  private clearLogs(): void {
    this.logs = []
    this.expandedLogs.clear()
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

  private getEventColor(eventType: ForesightEvent): string {
    const colorMap: Record<ForesightEvent, string> = {
      elementRegistered: "#2196f3",
      callbackInvoked: "#4caf50",
      callbackCompleted: "#00bcd4",
      elementDataUpdated: "#ffc107",
      elementUnregistered: "#ff9800",
      managerSettingsChanged: "#f44336",
      mouseTrajectoryUpdate: "#78909c",
      scrollTrajectoryUpdate: "#607d8b",
    }
    return colorMap[eventType] || "#ffffff"
  }

  private handleEvent<K extends ForesightEvent>(eventType: K, event: ForesightEventMap[K]): void {
    if (this.logLocation === "none") {
      return
    }
    if (this.logLocation === "console" || this.logLocation === "both") {
      const color = this.getEventColor(eventType)
      console.log(`%c[ForesightJS] ${eventType}:`, `color: ${color}; font-weight: bold;`, event)
    }
    if (this.logLocation === "controlPanel" || this.logLocation === "both") {
      this.addEventLog(event)
    }
  }

  private addEventLog<K extends ForesightEvent>(event: ForesightEventMap[K]): void {
    const logData = safeSerializeEventData(event)
    if (logData.type === "serializationError") {
      console.error(logData.error, logData.errorMessage)
      return
    }
    const newLogs = [logData, ...this.logs]
    if (newLogs.length > this.MAX_LOGS) {
      newLogs.pop()
    }
    this.logs = newLogs
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
            : map(this.logs, log => {
                return html` <single-log .log=${log}></single-log> `
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
