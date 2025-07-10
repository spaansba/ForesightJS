import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import type { SerializedEventData } from "../../../helpers/safeSerializeEventData"
import "../base-tab/expandable-item"

@customElement("single-log")
export class SingleLog extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .log-time {
        color: #b8b8b8;
        font-weight: 500;
        font-size: 10px;
        font-family: "SF Mono", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace;
        min-width: 70px;
        max-width: 70px;
        text-align: left;
        letter-spacing: 0.02em;
        flex-shrink: 0;
      }

      .log-type-badge {
        display: inline-flex;
        align-items: center;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: var(--log-color, #b0c4de);
        min-width: 90px;
        max-width: 90px;
        white-space: nowrap;
        text-align: left;
        margin-left: 10px;
        flex-shrink: 0;
      }

      .log-summary {
        flex: 1;
        color: #ccc;
        font-size: 11px;
        opacity: 0.9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-left: 6px;
        font-weight: 400;
        min-width: 0;
      }

      .log-content {
        display: flex;
        align-items: center;
        width: 100%;
        min-width: 0;
      }

      :host(.log-elementRegistered) {
        --log-color: #2196f3;
      }
      :host(.log-callbackInvoked) {
        --log-color: #00bcd4;
      }
      :host(.log-callbackCompleted) {
        --log-color: #4caf50;
      }
      :host(.log-elementDataUpdated) {
        --log-color: #ffc107;
      }
      :host(.log-elementUnregistered) {
        --log-color: #ff9800;
      }
      :host(.log-managerSettingsChanged) {
        --log-color: #f44336;
      }
      :host(.log-mouseTrajectoryUpdate) {
        --log-color: #78909c;
      }
      :host(.log-scrollTrajectoryUpdate) {
        --log-color: #607d8b;
      }

      :host(.log-callbackCompleted.error-status) {
        --log-color: #f44336;
        background-color: rgba(244, 67, 54, 0.1);
      }
    `,
  ]
  @property() private log: SerializedEventData & { logId: string }
  @property() isExpanded: boolean = false
  @property() onToggle: ((logId: string) => void) | undefined

  constructor(log: SerializedEventData & { logId: string }) {
    super()
    this.log = log
  }

  private serializeLogDataWithoutSummary(log: SerializedEventData): string {
    const { summary, ...rest } = log
    return JSON.stringify(rest, null, 2)
  }

  private getLogTypeColor(logType: string): string {
    const colorMap: Record<string, string> = {
      elementRegistered: "#2196f3",
      callbackInvoked: "#00bcd4",
      callbackCompleted: "#4caf50",
      elementDataUpdated: "#ffc107",
      elementUnregistered: "#ff9800",
      managerSettingsChanged: "#f44336",
      mouseTrajectoryUpdate: "#78909c",
      scrollTrajectoryUpdate: "#607d8b",
    }
    return colorMap[logType] || "#555"
  }

  private getEventDisplayName(eventType: string): string {
    const eventNames: Record<string, string> = {
      elementRegistered: "Registered",
      elementUnregistered: "Unregistered",
      elementDataUpdated: "Data Updated",
      callbackInvoked: "Invoked",
      callbackCompleted: "Completed",
      mouseTrajectoryUpdate: "Mouse",
      scrollTrajectoryUpdate: "Scroll",
      managerSettingsChanged: "Settings",
    }
    return eventNames[eventType] || eventType
  }

  private truncateLogSummary(summary: string, maxLength: number = 50): string {
    if (summary.length <= maxLength) {
      return summary
    }
    return summary.substring(0, maxLength) + "..."
  }

  render() {
    const log = this.log
    let className = `log-${log.type}`

    if (log.type === "callbackCompleted" && "status" in log && log.status === "error") {
      className += " error-status"
    }

    this.className = className

    const borderColor =
      log.type === "callbackCompleted" && "status" in log && log.status === "error"
        ? "#f44336"
        : this.getLogTypeColor(log.type)

    return html`
      <expandable-item
        .borderColor=${borderColor}
        .itemId=${log.logId}
        .isExpanded=${this.isExpanded}
        .onToggle=${this.onToggle}
      >
        <div slot="content">
          <div class="log-content">
            <span class="log-time">${log.localizedTimestamp}</span>
            <span class="log-type-badge">${this.getEventDisplayName(log.type)}</span>
            <span class="log-summary">${this.truncateLogSummary(log.summary)}</span>
          </div>
        </div>
        <div slot="details">${this.serializeLogDataWithoutSummary(log)}</div>
      </expandable-item>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "single-log": SingleLog
  }
}
