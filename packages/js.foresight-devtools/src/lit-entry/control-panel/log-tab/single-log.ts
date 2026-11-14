import { LitElement, html, css, PropertyValues } from "lit"
import { customElement, property } from "lit/decorators.js"
import type { SerializedEventData } from "../../../helpers/safeSerializeEventData"
import { EVENT_LOOK } from "./log-store"
import "../base-tab/expandable-item"

@customElement("single-log")
export class SingleLog extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      :host([error]) {
        background: color-mix(in srgb, var(--fs-error) 10%, transparent);
      }

      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        width: 100%;
      }

      .time {
        flex-shrink: 0;
        color: var(--fs-dim);
      }

      .type {
        flex-shrink: 0;
        width: 8ch;
        white-space: nowrap;
      }

      .summary {
        flex: 1;
        min-width: 0;
        color: var(--fs-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ]

  @property({ attribute: false }) log!: SerializedEventData
  @property({ type: Boolean }) isExpanded: boolean = false
  @property() onToggle: ((logId: string) => void) | undefined
  @property({ type: Boolean, reflect: true }) error: boolean = false

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has("log")) {
      this.error = this.log.type === "callbackCompleted" && this.log.status === "error"
    }
  }

  private serializeLogDataWithoutSummary(log: SerializedEventData): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { summary: _, ...rest } = log

    return JSON.stringify(rest, null, 2)
  }

  render() {
    const log = this.log
    const look = this.error ? EVENT_LOOK.serializationError : EVENT_LOOK[log.type]

    return html`
      <expandable-item
        .itemId=${log.logId}
        .isExpanded=${this.isExpanded}
        .onToggle=${this.onToggle}
      >
        <div slot="content" class="row">
          <span class="time">${log.localizedTimestamp}</span>
          <span class="type" style="color: ${look.color}" title=${log.type}>${look.label}</span>
          <span class="summary" title="${log.summary}">${log.summary}</span>
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
