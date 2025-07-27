import { LitElement, html, css, PropertyValues } from "lit"
import { customElement, property } from "lit/decorators.js"
import type { SerializedEventData } from "../../../helpers/safeSerializeEventData"
import "../base-tab/expandable-item"

@customElement("single-log")
export class SingleLog extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        /*
         * The background color is now driven by a CSS variable.
         * This allows us to set it from TypeScript without touching the class.
         */
        background-color: var(--log-background-color, transparent);
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
        /* The color is driven by a CSS variable set in updated() */
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

      /*
       * The :host(.error-status) selector is no longer needed,
       * as all styling is now handled by setting CSS variables below.
       * This makes the component's styling more self-contained.
       */
    `,
  ]

  @property({ attribute: false })
  log: SerializedEventData

  constructor(log: SerializedEventData) {
    super()
    this.log = log
  }

  @property({ type: Boolean })
  isExpanded: boolean = false

  @property()
  onToggle: ((logId: string) => void) | undefined

  protected updated(changedProperties: PropertyValues<this>) {
    // Only run this logic if the `log` property has changed.
    if (changedProperties.has("log") && this.log) {
      const log = this.log
      const isError = log.type === "callbackCompleted" && "status" in log && log.status === "error"

      // Instead of toggling a class, we now set CSS custom properties
      // directly on the host element's style. This is an encapsulated
      // pattern that does not interfere with external classes.
      const color = isError ? "#f44336" : this.getLogTypeColor(log.type)
      const bgColor = isError ? "rgba(244, 67, 54, 0.1)" : "transparent"

      this.style.setProperty("--log-color", color)
      this.style.setProperty("--log-background-color", bgColor)
    }
  }

  private serializeLogDataWithoutSummary(log: SerializedEventData): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { summary: _, ...rest } = log
    return JSON.stringify(rest, null, 2)
  }

  private getLogTypeColor(logType: string): string {
    const colorMap: Record<string, string> = {
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
    return colorMap[logType] || "#555"
  }

  private getEventDisplayName(eventType: string): string {
    const eventNames: Record<string, string> = {
      elementRegistered: "Registered",
      elementReactivated: "Reactivated",
      elementUnregistered: "Unregistered",
      elementDataUpdated: "Data Updated",
      callbackInvoked: "Invoked",
      callbackCompleted: "Completed",
      mouseTrajectoryUpdate: "Mouse",
      scrollTrajectoryUpdate: "Scroll",
      managerSettingsChanged: "Settings",
      managerDataPayload: "ManagerData",
      deviceStrategyChanged: "Strategy",
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
    const isError = log.type === "callbackCompleted" && "status" in log && log.status === "error"

    // The border color for the child component is still fine to calculate here.
    const borderColor = isError ? "#f44336" : this.getLogTypeColor(log.type)

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
