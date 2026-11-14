import type {
  DeviceStrategyChangedEvent,
  ForesightElement,
  ForesightElementState,
} from "js.foresight"
import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import "../base-tab/expandable-item"
import "./reactivate-countdown"
import { ForesightManager } from "js.foresight"
import { DISABLED_SVG, ENABLE_SVG, UNREGISTER_SVG } from "../../../svg/svg-icons"
import { iconButtonStyles } from "../shared-styles"

@customElement("single-element")
export class SingleElement extends LitElement {
  static styles = [
    iconButtonStyles,
    css`
      :host {
        display: block;
      }

      .not-visible {
        opacity: 0.5;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
        min-width: 0;
      }

      .name {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11.5px;
        color: var(--fs-text);
      }

      .name.running {
        color: #fff;
        font-weight: 600;
      }

      .name.inactive {
        color: var(--fs-muted);
      }

      .reason-tags {
        display: inline-flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .reason-tag {
        padding: 0 4px;
        font-family: var(--fs-mono);
        font-size: 9.5px;
        line-height: 15px;
        color: var(--reason-color);
        background: color-mix(in srgb, var(--reason-color) 14%, transparent);
      }

      .actions {
        display: flex;
        opacity: 0;
        transition: opacity 0.12s ease;
      }

      :host(:hover) .actions,
      .actions:focus-within {
        opacity: 1;
      }

      .icon-button {
        height: 18px;
        min-width: 18px;
        padding: 0 2px;
      }

      .icon-button svg {
        width: 12px;
        height: 12px;
      }

      .icon-button.danger:hover {
        color: #ff6b6b;
      }

      .icon-button.warn:hover {
        color: #ffa726;
      }

      .icon-button.ok:hover {
        color: #66bb6a;
      }
    `,
  ]

  @property({ attribute: false }) element!: ForesightElement
  @property({ attribute: false }) state!: ForesightElementState
  @property() isExpanded: boolean = false
  @property() onToggle: ((elementId: string) => void) | undefined

  @state() private currentDeviceStrategy: string = "mouse"
  private _abortController: AbortController | null = null
  connectedCallback() {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController

    // Initialize current device strategy
    this.currentDeviceStrategy = ForesightManager.instance.getManagerData.currentDeviceStrategy

    // Listen for device strategy changes
    ForesightManager.instance.addEventListener(
      "deviceStrategyChanged",
      (e: DeviceStrategyChangedEvent) => {
        this.currentDeviceStrategy = e.newStrategy
      },
      { signal }
    )
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
  }

  private getInactiveReasons(): { label: string; color: string; description: string }[] {
    const reasons: { label: string; color: string; description: string }[] = []

    if (!this.state.isEnabled) {
      reasons.push({
        label: "disabled",
        color: "#9e9e9e",
        description: "Element is disabled, so its callback won't run until you re-enable it.",
      })
    }

    if (this.state.isParked) {
      reasons.push({
        label: "parked",
        color: "#7986cb",
        description:
          "Element is detached from the DOM and parked: kept registered but inactive until it reconnects.",
      })
    }

    if (this.state.isLimitedConnection) {
      reasons.push({
        label: "limited",
        color: "#ffb74d",
        description:
          "Element is on a limited connection (e.g. Save-Data or slow network), so prediction is paused.",
      })
    }

    // Already fired its callback; stays inactive until reactivated, which by
    // default (`reactivateAfter: Infinity`) never happens.
    if (
      this.state.isEnabled &&
      !this.state.isParked &&
      !this.state.isLimitedConnection &&
      !this.state.isActive &&
      this.state.isPredicted
    ) {
      reasons.push({
        label: "fired",
        color: "#4dd0e1",
        description:
          "Callback already fired. Stays inactive until reactivated (never, unless reactivateAfter is set).",
      })
    }

    return reasons
  }

  private getStatusColor(): string {
    if (this.state.isCallbackRunning) {
      return "#ffeb3b"
    }

    if (!this.state.isActive) {
      return "#999"
    }

    // Use purple for touch devices when active (no opacity variation)
    if (this.currentDeviceStrategy === "touch") {
      return "#ba68c8"
    }

    // Use green for desktop devices when active
    return this.state.isIntersectingWithViewport ? "#4caf50" : "#666"
  }

  private getStatusText(): string {
    if (this.state.isCallbackRunning) {
      return "callback active"
    }

    if (!this.state.isActive) {
      const reasons = this.getInactiveReasons()

      return reasons.length ? `inactive: ${reasons.map(r => r.label).join(", ")}` : "inactive"
    }

    const baseStatus = this.state.isIntersectingWithViewport ? "in viewport" : "not in viewport"
    const deviceStatus = this.currentDeviceStrategy === "touch" ? " (touch device)" : ""

    return baseStatus + deviceStatus
  }

  private formatElementDetails(): string {
    if (!this.isExpanded) {
      return ""
    }

    return JSON.stringify({ ...this.state, status: this.getStatusText() }, null, 2)
  }

  private handleUnregister = (e: MouseEvent) => {
    e.stopPropagation()
    ForesightManager.instance.unregister(this.element, "devtools")
  }

  private handleToggleEnabled = (e: MouseEvent) => {
    e.stopPropagation()
    ForesightManager.instance.updateElementOptions(this.element, {
      enabled: !this.state.isEnabled,
    })
  }

  render() {
    const isNotVisible =
      !this.state.isIntersectingWithViewport && this.currentDeviceStrategy !== "touch"
    const inactiveReasons = this.getInactiveReasons()
    const nameClass = this.state.isCallbackRunning
      ? "running"
      : !this.state.isActive
        ? "inactive"
        : ""

    return html`
      <expandable-item
        class="${isNotVisible ? "not-visible" : ""}"
        .borderColor=${this.getStatusColor()}
        .itemId=${this.state.id}
        .isExpanded=${this.isExpanded}
        .onToggle=${this.onToggle}
      >
        <div slot="content" class="row" data-tip="Status: ${this.getStatusText()}">
          <span class="name ${nameClass}">${this.state.name || "unnamed"}</span>
          ${
            inactiveReasons.length
              ? html`
                  <span class="reason-tags">
                    ${inactiveReasons.map(
                      reason =>
                        html`<span
                          class="reason-tag"
                          style="--reason-color: ${reason.color}"
                          data-tip="${reason.label}: ${reason.description}"
                          >${reason.label}</span
                        >`
                    )}
                  </span>
                `
              : ""
          }
          ${
            this.state.isEnabled
              ? html`<reactivate-countdown
                  .element=${this.element}
                  .state=${this.state}
                ></reactivate-countdown>`
              : ""
          }
          <span class="actions">
            ${
              this.state.isEnabled
                ? html`<button
                    class="icon-button warn"
                    @click="${this.handleToggleEnabled}"
                    data-tip="Disable element"
                  >
                    ${DISABLED_SVG}
                  </button>`
                : html`<button
                    class="icon-button ok"
                    @click="${this.handleToggleEnabled}"
                    data-tip="Enable element"
                  >
                    ${ENABLE_SVG}
                  </button>`
            }
            <button
              class="icon-button danger"
              @click="${this.handleUnregister}"
              data-tip="Unregister element"
            >
              ${UNREGISTER_SVG}
            </button>
          </span>
        </div>
        <div slot="details">${this.formatElementDetails()}</div>
      </expandable-item>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "single-element": SingleElement
  }
}
