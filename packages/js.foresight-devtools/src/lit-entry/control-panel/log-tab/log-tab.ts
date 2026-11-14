import type { ForesightEvent } from "js.foresight"
import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { repeat } from "lit/directives/repeat.js"
import type { LoggingLocations } from "../../../types/types"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../dropdown/multi-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import { getEventLogStore, MAX_LOGS } from "./log-store"
import { buttonStyles } from "../shared-styles"
import "./single-log"

@customElement("log-tab")
export class LogTab extends LitElement {
  static styles = [
    buttonStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .divider {
        width: 1px;
        height: 12px;
        margin: 0 4px;
        background: var(--fs-line);
      }

      .warning {
        padding: 0 4px;
        color: var(--fs-scroll);
        font-weight: 700;
        cursor: help;
      }
    `,
  ]

  private store = getEventLogStore()
  @state() private logDropdown: DropdownOption[]
  @state() private filterDropdown: DropdownOption[]
  @state() private expandedLogIds: Set<string> = new Set()

  private _unsubscribeStore: (() => void) | null = null

  constructor() {
    super()
    this.logDropdown = [
      { value: "controlPanel", label: "to panel", title: "Log to this panel only" },
      { value: "console", label: "to console", title: "Log to the browser console only" },
      { value: "both", label: "to both", title: "Log to this panel and the console" },
      { value: "none", label: "nowhere", title: "Don't log at all" },
    ]

    this.filterDropdown = Object.keys(this.store.eventsEnabled).map(value => ({
      value,
      title: `Log ${value} events`,
    }))
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
      return "Every event type is filtered out"
    }

    if (this.store.logLocation === "console") {
      return "Logging to the console. Open your browser devtools"
    }

    if (this.store.logLocation === "none") {
      return "Logging is set to nowhere"
    }

    return "Quiet so far. Move the mouse toward a registered element"
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
        <span slot="chips" data-tip="Keeps the last ${MAX_LOGS}">${logs.length} logged</span>
        <div slot="actions">
          ${
            this.shouldShowPerformanceWarning()
              ? html`<span
                  class="warning"
                  data-tip="Trajectory events fire on every frame. Logging them to the console gets slow"
                  >!</span
                >`
              : ""
          }
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
          <span class="divider"></span>
          <button
            class="btn"
            data-tip="Log a snapshot of the manager state"
            @click="${this.logManagerData}"
          >
            snapshot
          </button>
          <button class="btn" ?disabled="${logs.length === 0}" @click="${this.clearLogs}">
            clear
          </button>
        </div>
      </tab-header>
      <tab-content .noContentMessage=${this.getNoLogsMessage()} .hasContent=${!!logs.length}>
        ${repeat(
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
