import type { ForesightElementData, DeviceStrategyChangedEvent } from "js.foresight"
import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import "../base-tab/expandable-item"
import "./reactivate-countdown"
import { ForesightManager } from "js.foresight"
import { UNREGISTER_SVG } from "../../../svg/svg-icons"
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

      .status-indicator.touch-device {
        background-color: #ba68c8;
        box-shadow: 0 0 0 2px rgba(186, 104, 200, 0.4);
      }

      .unregister-button {
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

      .unregister-button:hover {
        background-color: rgba(255, 107, 107, 0.1);
        color: #ff6b6b;
      }

      .element-name {
        flex-grow: 1;
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

  @property({ hasChanged: () => true }) elementData!: ForesightElementData
  @property() isActive: boolean = false
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

  private getBorderColor(): string {
    if (this.isActive) {
      return "#ffeb3b"
    }
    if (!this.elementData.callbackInfo.isCallbackActive) {
      return "#999"
    }

    // Use purple for touch devices when active (no opacity variation)
    if (this.currentDeviceStrategy === "touch") {
      return "#ba68c8"
    }

    // Use green for desktop devices when active
    return this.elementData.isIntersectingWithViewport ? "#4caf50" : "#666"
  }

  private getStatusIndicatorClass(): string {
    if (this.isActive) {
      return "prefetching"
    }
    if (!this.elementData.callbackInfo.isCallbackActive) {
      return "inactive"
    }

    // Use purple indicator for touch devices (no visibility distinction)
    if (this.currentDeviceStrategy === "touch") {
      return "touch-device"
    }

    return this.elementData.isIntersectingWithViewport ? "visible" : "hidden"
  }

  private getStatusText(): string {
    if (this.isActive) {
      return "callback active"
    }
    if (!this.elementData.callbackInfo.isCallbackActive) {
      return "callback inactive"
    }

    const baseStatus = this.elementData.isIntersectingWithViewport
      ? "in viewport"
      : "not in viewport"
    const deviceStatus = this.currentDeviceStrategy === "touch" ? " (touch device)" : ""

    return baseStatus + deviceStatus
  }

  private formatElementDetails(): string {
    const elementData = this.elementData
    const details = {
      status: this.getStatusText(),
      isIntersecting: elementData.isIntersectingWithViewport,
      registerCount: elementData.registerCount,
      hitSlop: {
        top: elementData.elementBounds.hitSlop.top,
        right: elementData.elementBounds.hitSlop.right,
        bottom: elementData.elementBounds.hitSlop.bottom,
        left: elementData.elementBounds.hitSlop.left,
      },
      callbackInfo: elementData.callbackInfo,
      meta: this.elementData.meta,
    }

    return JSON.stringify(details, null, 2)
  }

  private handleUnregister = (e: MouseEvent) => {
    e.stopPropagation()
    ForesightManager.instance.unregister(this.elementData.element, "devtools")
  }

  render() {
    // Don't apply opacity reduction for touch devices since visibility detection isn't reliable
    const isNotVisible =
      !this.elementData.isIntersectingWithViewport && this.currentDeviceStrategy !== "touch"

    return html`
      <div class="element-wrapper ${isNotVisible ? "not-visible" : ""}">
        <expandable-item
          .borderColor=${this.getBorderColor()}
          .showCopyButton=${true}
          .itemId=${this.elementData.id}
          .isExpanded=${this.isExpanded}
          .onToggle=${this.onToggle}
        >
          <div slot="content" class="element-content" title="Status: ${this.getStatusText()}">
            <div class="status-indicator ${this.getStatusIndicatorClass()}"></div>
            <span
              class="element-name ${this.isActive
                ? "callback-active"
                : !this.elementData.callbackInfo.isCallbackActive
                  ? "callback-inactive"
                  : ""}"
            >
              ${this.elementData.name || "unnamed"}
            </span>
            <reactivate-countdown .elementData=${this.elementData}> </reactivate-countdown>
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
