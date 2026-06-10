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
@customElement("single-element")
export class SingleElement extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .element-wrapper {
        display: block;
      }

      .element-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
      }

      .status-indicator {
        margin-left: 2px;
        width: 8px;
        height: 8px;
        flex-shrink: 0;
        transition: all 0.3s ease;
      }

      .status-indicator.visible {
        background-color: #4caf50;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
      }

      .status-indicator.hidden {
        background-color: #666;
        box-shadow: 0 0 0 2px rgba(102, 102, 102, 0.2);
      }

      .status-indicator.prefetching {
        background-color: #ffeb3b;
        box-shadow: 0 0 0 2px rgba(255, 235, 59, 0.4);
      }

      .status-indicator.inactive {
        background-color: #999;
        box-shadow: 0 0 0 2px rgba(153, 153, 153, 0.3);
      }

      .reason-tags {
        display: inline-flex;
        align-items: baseline;
        gap: 7px;
        flex-shrink: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 10px;
      }

      .reason-tag {
        white-space: nowrap;
        color: color-mix(in srgb, var(--reason-color) 80%, #fff);
      }

      .reason-tag::before {
        content: "/";
        margin-right: 3px;
        color: #555;
      }

      .status-indicator.touch-device {
        background-color: #ba68c8;
        box-shadow: 0 0 0 2px rgba(186, 104, 200, 0.4);
      }

      .unregister-button,
      .toggle-enabled-button,
      .enable-button {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        padding: 1px;
        cursor: pointer;
        color: #999;
      }

      .unregister-button svg,
      .toggle-enabled-button svg,
      .enable-button svg {
        width: 12px;
        height: 12px;
      }

      .unregister-button:hover {
        background-color: rgba(255, 107, 107, 0.1);
        color: #ff6b6b;
      }

      .toggle-enabled-button:hover {
        background-color: rgba(255, 165, 0, 0.1);
        color: #ffa726;
      }

      .enable-button:hover {
        background-color: rgba(76, 175, 80, 0.1);
        color: #4caf50;
      }

      .element-name {
        flex-grow: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11px;
        font-weight: 500;
        color: #e8e8e8;
      }

      .element-name.callback-active {
        color: #fff;
        font-weight: 600;
      }

      .element-name.callback-inactive {
        color: #999;
        font-weight: 500;
      }

      .reactivate-countdown {
        font-size: 14px;
        color: #ffa726;
        font-weight: 500;
        min-width: 0;
        white-space: nowrap;
      }

      .reactivate-countdown:empty {
        display: none;
      }

      :host(.not-visible) {
        opacity: 0.5;
      }

      .element-wrapper.not-visible {
        opacity: 0.5;
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

  private getBorderColor(): string {
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

  private getStatusIndicatorClass(): string {
    if (this.state.isCallbackRunning) {
      return "prefetching"
    }

    if (!this.state.isActive) {
      return "inactive"
    }

    // Use purple indicator for touch devices (no visibility distinction)
    if (this.currentDeviceStrategy === "touch") {
      return "touch-device"
    }

    return this.state.isIntersectingWithViewport ? "visible" : "hidden"
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
    // Don't apply opacity reduction for touch devices since visibility detection isn't reliable
    const isNotVisible =
      !this.state.isIntersectingWithViewport && this.currentDeviceStrategy !== "touch"
    const inactiveReasons = this.getInactiveReasons()

    return html`
      <div class="element-wrapper ${isNotVisible ? "not-visible" : ""}">
        <expandable-item
          .borderColor=${this.getBorderColor()}
          .showCopyButton=${true}
          .itemId=${this.state.id}
          .isExpanded=${this.isExpanded}
          .onToggle=${this.onToggle}
        >
          <div slot="content" class="element-content" title="Status: ${this.getStatusText()}">
            <div class="status-indicator ${this.getStatusIndicatorClass()}"></div>
            <span
              class="element-name ${this.state.isCallbackRunning
                ? "callback-active"
                : !this.state.isActive
                  ? "callback-inactive"
                  : ""}"
            >
              ${this.state.name || "unnamed"}
            </span>
            ${inactiveReasons.length
              ? html`
                  <span class="reason-tags">
                    ${inactiveReasons.map(
                      reason =>
                        html`<span
                          class="reason-tag"
                          style="--reason-color: ${reason.color}"
                          title="${reason.label}: ${reason.description}"
                          >${reason.label}</span
                        >`
                    )}
                  </span>
                `
              : ""}
            ${this.state.isEnabled
              ? html`
                  <reactivate-countdown .element=${this.element} .state=${this.state}>
                  </reactivate-countdown>
                  <button
                    class="toggle-enabled-button"
                    @click="${this.handleToggleEnabled}"
                    title="Disable element"
                  >
                    ${DISABLED_SVG}
                  </button>
                `
              : html`
                  <button
                    class="enable-button"
                    @click="${this.handleToggleEnabled}"
                    title="Enable element"
                  >
                    ${ENABLE_SVG}
                  </button>
                `}
            <button
              class="unregister-button"
              @click="${this.handleUnregister}"
              title="Unregister element"
            >
              ${UNREGISTER_SVG}
            </button>
          </div>
          <div slot="details">${this.formatElementDetails()}</div>
        </expandable-item>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "single-element": SingleElement
  }
}
