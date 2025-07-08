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
        margin-bottom: 6px;
        background-color: rgba(40, 40, 40, 0.7);
        /* Use the CSS variable for the border, with a fallback color */
        border-left: 3px solid var(--log-color, #555);
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
        position: relative; /* Positioning context for the copy button */
        padding: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        max-height: 200px;
        overflow-y: auto;
      }

      .log-summary {
        flex: 1;
        color: #ccc;
        font-size: 11px;
        opacity: 0.8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .log-toggle {
        color: #b0c4de;
        font-size: 11px;
        transition: transform 0.2s ease;
        width: 12px;
        text-align: center;
        user-select: none;
      }

      /* --- Define the --log-color variable for each log type --- */
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

      .log-time {
        color: #9e9e9e;
        margin-right: 8px;
        font-weight: bold;
        font-size: 11px;
      }

      .log-type {
        /* Use the CSS variable for the text color, with a fallback */
        color: var(--log-color, #b0c4de);
        margin-right: 8px;
        font-weight: bold;
        font-size: 11px;
      }

      .log-data {
        color: #e0e0e0;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-size: 11px;
        margin: 0;
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

  render() {
    const log = this.log
    return html` <div class="log-entry log-${log.type}">
      <div class="log-header" @click="${() => this.toggleLogEntry()}">
        <span class="log-time">${log.localizedTimestamp}</span>
        <span class="log-type">${log.type}</span>
        <span class="log-summary">${log.summary}</span>
        <span class="log-toggle">${this.isExpanded ? "▼" : "▶"}</span>
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
