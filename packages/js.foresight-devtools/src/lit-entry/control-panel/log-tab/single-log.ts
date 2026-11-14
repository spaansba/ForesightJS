import { LitElement, html, css, PropertyValues } from "lit"
import { customElement, property } from "lit/decorators.js"
import type { SerializedEventData } from "../../../helpers/safeSerializeEventData"
import { EVENT_COLORS } from "./log-store"
import "../base-tab/expandable-item"

@customElement("single-log")
export class SingleLog extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        background-color: var(--log-background-color, transparent);
      }

      .row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        width: 100%;
        font-size: 11px;
      }

      .time {
        flex-shrink: 0;
        color: var(--fs-muted);
        font-family: var(--fs-mono);
        font-size: 10px;
      }

      .type {
        flex-shrink: 0;
        width: 72px;
        color: var(--log-color, var(--fs-accent));
        font-weight: 600;
        white-space: nowrap;
      }

      .summary {
        flex: 1;
        min-width: 0;
        color: #bdbdc2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
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
    return (EVENT_COLORS as Record<string, string>)[logType] || "#555"
  }

  private getEventDisplayName(eventType: string): string {
    const eventNames: Record<string, string> = {
      elementRegistered: "Registered",
      elementUnregistered: "Unregistered",
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
        <div slot="content" class="row">
          <span class="time">${log.localizedTimestamp}</span>
          <span class="type">${this.getEventDisplayName(log.type)}</span>
          <span class="summary" data-tip="${log.summary}">${log.summary}</span>
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
