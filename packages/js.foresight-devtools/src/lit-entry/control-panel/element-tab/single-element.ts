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
import { buttonStyles } from "../shared-styles"

@customElement("single-element")
export class SingleElement extends LitElement {
  static styles = [
    buttonStyles,
    css`
      :host {
        display: block;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
      }

      .marker {
        flex-shrink: 0;
        box-sizing: border-box;
        width: 7px;
        height: 7px;
        border: 1px solid var(--fs-muted);
      }

      .marker.live {
        border-color: var(--fs-text);
        background: var(--fs-text);
      }

      .marker.inactive {
        border-style: dashed;
        border-color: var(--fs-dim);
      }

      .marker.running {
        border-color: var(--fs-ok);
        background: var(--fs-ok);
        animation: blink 0.4s steps(2, jump-none) infinite;
      }

      @keyframes blink {
        to {
          opacity: 0.2;
        }
      }

      .name {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--fs-text);
      }

      .name.offscreen {
        color: var(--fs-muted);
      }

      .name.inactive {
        color: var(--fs-dim);
      }

      .reason {
        flex-shrink: 0;
        color: var(--fs-muted);
      }

      .reason::before {
        content: "#";
        color: var(--fs-dim);
      }

      .actions {
        display: flex;
        opacity: 0;
      }

      :host(:hover) .actions,
      .actions:focus-within {
        opacity: 1;
      }

      .btn {
        height: 18px;
        min-width: 18px;
        padding: 0 2px;
      }

      .btn svg {
        width: 12px;
        height: 12px;
      }

      .btn.danger:hover {
        color: var(--fs-error);
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

  private getInactiveReasons(): { label: string; description: string }[] {
    const { isEnabled, isParked, isLimitedConnection, isActive, isPredicted } = this.state
    const reasons: { label: string; description: string }[] = []

    if (!isEnabled) {
      reasons.push({
        label: "disabled",
        description: "Disabled. Its callback won't run until you enable it",
      })
    }

    if (isParked) {
      reasons.push({
        label: "parked",
        description: "Detached from the DOM. Stays registered and wakes up when it reconnects",
      })
    }

    if (isLimitedConnection) {
      reasons.push({
        label: "slow-net",
        description: "Save-Data is on or the connection is below minimumConnectionType",
      })
    }

    if (isEnabled && !isParked && !isLimitedConnection && !isActive && isPredicted) {
      reasons.push({
        label: "fired",
        description: "Callback already ran. Comes back after reactivateAfter (never by default)",
      })
    }

    return reasons
  }

  private getStatus(): "running" | "live" | "offscreen" | "inactive" {
    if (this.state.isCallbackRunning) {
      return "running"
    }

    if (!this.state.isActive) {
      return "inactive"
    }

    return this.state.isIntersectingWithViewport || this.currentDeviceStrategy === "touch"
      ? "live"
      : "offscreen"
  }

  private getStatusText(): string {
    const labels = {
      running: "callback running",
      live: this.currentDeviceStrategy === "touch" ? "active" : "active, on screen",
      offscreen: "active, off screen",
      inactive: "inactive",
    }

    return labels[this.getStatus()]
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
    const status = this.getStatus()

    return html`
      <expandable-item
        .itemId=${this.state.id}
        .isExpanded=${this.isExpanded}
        .onToggle=${this.onToggle}
      >
        <div slot="content" class="row">
          <span class="marker ${status}" data-tip=${this.getStatusText()}></span>
          <span class="name ${status}">${this.state.name || "unnamed"}</span>
          ${this.getInactiveReasons().map(
            reason =>
              html`<span class="reason" data-tip=${reason.description}>${reason.label}</span>`
          )}
          ${
            this.state.isEnabled
              ? html`<reactivate-countdown
                  .element=${this.element}
                  .state=${this.state}
                ></reactivate-countdown>`
              : ""
          }
          <span class="actions">
            <button
              class="btn"
              @click="${this.handleToggleEnabled}"
              data-tip="${this.state.isEnabled ? "Disable" : "Enable"}"
            >
              ${this.state.isEnabled ? DISABLED_SVG : ENABLE_SVG}
            </button>
            <button class="btn danger" @click="${this.handleUnregister}" data-tip="Unregister">
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
