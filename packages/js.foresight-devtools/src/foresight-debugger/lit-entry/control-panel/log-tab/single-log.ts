import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import type { SerializedEventData } from "../../../helpers/safeSerializeEventData"
import "../shared/expandable-item"

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
        text-align: left;
        letter-spacing: 0.02em;
      }

      .log-type-badge {
        display: inline-flex;
        align-items: center;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: var(--log-color, #b0c4de);
        min-width: fit-content;
        white-space: nowrap;
        min-width: 90px;
        text-align: left;
        margin-left: 10px;
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
      }

      /* Color definitions for each log type */
      :host(.log-elementRegistered) {
        --log-color: #2196f3;
      }
      :host(.log-callbackInvoked) {
        --log-color: #4caf50;
      }
      :host(.log-callbackCompleted) {
        --log-color: #00bcd4;
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
    `,
  ]
  @property() private log: SerializedEventData

  constructor(log: SerializedEventData) {
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
      callbackInvoked: "#4caf50",
      callbackCompleted: "#00bcd4",
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

  render() {
    const log = this.log
    this.className = `log-${log.type}`

    return html`
      <expandable-item .borderColor=${this.getLogTypeColor(log.type)}>
        <div slot="content">
          <span class="log-time">${log.localizedTimestamp}</span>
          <span class="log-type-badge">${this.getEventDisplayName(log.type)}</span>
          <span class="log-summary">${log.summary}</span>
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
