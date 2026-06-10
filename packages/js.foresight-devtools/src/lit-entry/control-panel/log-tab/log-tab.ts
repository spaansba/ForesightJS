import type { ForesightEvent } from "js.foresight"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { repeat } from "lit/directives/repeat.js"
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
import type { LoggingLocations } from "../../../types/types"
import "../base-tab/chip"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../copy-icon/copy-icon"
import "../dropdown/multi-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import { getEventLogStore, MAX_LOGS } from "./log-store"
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

  private store = getEventLogStore()
  @state() private logDropdown: DropdownOption[]
  @state() private filterDropdown: DropdownOption[]
  @state() private expandedLogIds: Set<string> = new Set()

  @property() noContentMessage: string = "No logs available"
  private _unsubscribeStore: (() => void) | null = null

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
    this.store.setLogLocation(value as LoggingLocations)
  }

  private handleFilterChange = (changedEventType: string, isEnabled: boolean): void => {
    this.store.setEventEnabled(changedEventType as ForesightEvent, isEnabled)
  }

  private getSelectedEventFilters(): string[] {
    return Object.entries(this.store.eventsEnabled)
      .filter(([, enabled]) => enabled)
      .map(([eventType]) => eventType)
  }

  //TODO check if devtools is open, but is harder than I thought. Look into later
  private shouldShowPerformanceWarning(): boolean {
    const { logLocation, eventsEnabled } = this.store
    const hasConsoleOutput = logLocation === "console" || logLocation === "both"
    const hasFrequentEvents =
      eventsEnabled.mouseTrajectoryUpdate || eventsEnabled.scrollTrajectoryUpdate

    return hasConsoleOutput && hasFrequentEvents
  }

  private getNoLogsMessage(): string {
    const enabledCount = Object.values(this.store.eventsEnabled).filter(Boolean).length
    if (enabledCount === 0) {
      return "Logging for all events is turned off"
    }

    if (this.store.logLocation === "console") {
      return "No logs to display. Logging location is set to console - check browser console for events."
    }

    if (this.store.logLocation === "none") {
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
    this.store.clear()
    this.expandedLogIds.clear()
    this.noContentMessage = "Logs cleared"
  }

  private logManagerData = (): void => {
    this.store.logManagerData()
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._unsubscribeStore = this.store.subscribe(() => this.requestUpdate())
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._unsubscribeStore?.()
    this._unsubscribeStore = null
  }

  render() {
    const logs = this.store.logs

    return html`
      <tab-header>
        <div slot="chips" class="chips-container">
          <chip-element title="Number of logged events (Max ${MAX_LOGS})">
            ${logs.length} events
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
            .selectedOptionValue="${this.store.logLocation}"
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
            ?disabled="${logs.length === 0}"
            @click="${this.clearLogs}"
          >
            ${CLEAR_SVG}
          </button>
        </div>
      </tab-header>
      <tab-content .noContentMessage=${this.noContentMessage} .hasContent=${!!logs.length}>
        ${logs.length === 0
          ? html`<div class="no-items">${this.getNoLogsMessage()}</div>`
          : repeat(
              logs,
              log => log.logId,
              log => html`
                <single-log
                  .log=${log}
                  .isExpanded=${this.expandedLogIds.has(log.logId)}
                  .onToggle=${this.handleLogToggle}
                ></single-log>
              `
            )}
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "log-tab": LogTab
  }
}
