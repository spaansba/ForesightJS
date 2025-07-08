import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import type { SerializedEventData } from "../../../helpers/safeSerializeEventData"

@customElement("single-log")
export class SingleLog extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .log-entry {
        margin-bottom: 2px;
        font-size: 11px;
        line-height: 1.3;
        overflow: hidden;
        transition: all 0.2s ease;
        border-left: 2px solid var(--log-color, #555);
        padding-left: 6px;
      }

      .log-entry:hover {
        background-color: rgba(255, 255, 255, 0.02);
      }

      .log-header {
        display: flex;
        align-items: center;
        padding: 3px 4px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        gap: 8px;
        min-height: 20px;
      }

      .log-header:hover {
        background-color: rgba(255, 255, 255, 0.03);
      }

      .log-details {
        position: relative;
        padding: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        max-height: 200px;
        overflow-y: auto;
        background-color: rgba(30, 30, 30, 0.8);
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
        min-width: 80px;
        text-align: left;
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

      .log-toggle {
        color: #b0c4de;
        font-size: 11px;
        transition: all 0.2s ease;
        width: 11px;
        height: 11px;
        text-align: center;
        user-select: none;
        opacity: 0.6;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 2px;
        margin-left: 4px;
      }

      .log-toggle:hover {
        opacity: 1;
        background-color: rgba(176, 196, 222, 0.1);
        color: #d4e4f4;
      }

      .log-toggle.expanded {
        transform: rotate(90deg);
      }

      /* Color definitions for each log type */
      .log-entry.log-elementRegistered {
        --log-color: #2196f3;
      }
      .log-entry.log-callbackInvoked {
        --log-color: #4caf50;
      }
      .log-entry.log-callbackCompleted {
        --log-color: #00bcd4;
      }
      .log-entry.log-elementDataUpdated {
        --log-color: #ffc107;
      }
      .log-entry.log-elementUnregistered {
        --log-color: #ff9800;
      }
      .log-entry.log-managerSettingsChanged {
        --log-color: #f44336;
      }
      .log-entry.log-mouseTrajectoryUpdate {
        --log-color: #78909c;
      }
      .log-entry.log-scrollTrajectoryUpdate {
        --log-color: #607d8b;
      }

      .log-data {
        color: #e0e0e0;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-size: 11px;
        margin: 0;
        font-family: "Courier New", monospace;
      }
    `,
  ]
  @property() private log: SerializedEventData
  @state() private isExpanded: boolean = false
  constructor(log: SerializedEventData) {
    super()
    this.log = log
  }

  private serializeLogDataWithoutSummary(log: SerializedEventData): string {
    const { summary, ...rest } = log
    return JSON.stringify(rest, null, 2)
  }

  private async handleCopy(event: MouseEvent, log: SerializedEventData): Promise<void> {
    event.stopPropagation()
    const jsonString = this.serializeLogDataWithoutSummary(log)
    try {
      await navigator.clipboard.writeText(jsonString)
      setTimeout(() => {}, 500)
    } catch (err) {
      console.error("Failed to copy JSON to clipboard:", err)
    }
  }

  private toggleLogEntry(): void {
    this.isExpanded = !this.isExpanded
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
    return html` <div class="log-entry log-${log.type}">
      <div class="log-header" @click="${() => this.toggleLogEntry()}">
        <span class="log-time">${log.localizedTimestamp}</span>
        <span class="log-type-badge">${this.getEventDisplayName(log.type)}</span>
        <span class="log-summary">${log.summary}</span>
        <span class="log-toggle ${this.isExpanded ? "expanded" : ""}">▶</span>
      </div>
      ${this.isExpanded
        ? html`
            <div class="log-details">
              <copy-icon
                positioned
                title="Copy JSON"
                .onCopy=${(e: MouseEvent) => this.handleCopy(e, log)}
              ></copy-icon>
              <pre class="log-data">${this.serializeLogDataWithoutSummary(log)}</pre>
            </div>
          `
        : ""}
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "single-log": SingleLog
  }
}
