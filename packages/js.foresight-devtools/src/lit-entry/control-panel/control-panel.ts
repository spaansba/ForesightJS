import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { ForesightManager } from "js.foresight"

import "./element-tab/element-tab"
import "./base-tab/tab-selector"
import "./log-tab/log-tab"
import "./settings-tab/settings-tab"
import { getEventLogStore } from "./log-tab/log-store"
import type { ControllerTabs, Corner } from "../../types/types"
import { ForesightDevtools } from "../foresight-devtools"
import { CLOSE_SVG, MINUS_SVG, PLUS_SVG } from "../../svg/svg-icons"
import { iconButtonStyles } from "./shared-styles"

@customElement("control-panel")
export class ControlPanel extends LitElement {
  static styles = [
    iconButtonStyles,
    css`
      :host {
        --fs-bg: rgba(18, 18, 20, 0.94);
        --fs-surface: rgba(255, 255, 255, 0.04);
        --fs-hover: rgba(255, 255, 255, 0.07);
        --fs-border: rgba(255, 255, 255, 0.08);
        --fs-text: #e6e6e6;
        --fs-muted: #8b8b90;
        --fs-accent: #8ab4f8;
        --fs-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }

      .panel {
        --panel-offset: 10px;
        position: fixed;
        z-index: 10001;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        width: 380px;
        height: 400px;
        max-width: calc(100vw - 2 * var(--panel-offset));
        max-height: calc(100vh - 2 * var(--panel-offset));
        box-sizing: border-box;
        overflow: hidden;
        background: var(--fs-bg);
        backdrop-filter: blur(8px);
        color: var(--fs-text);
        border: 1px solid var(--fs-border);
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        font-family:
          system-ui,
          -apple-system,
          "Segoe UI",
          Roboto,
          sans-serif;
        font-size: 12px;
      }

      .panel.top-left {
        top: var(--panel-offset);
        left: var(--panel-offset);
      }
      .panel.top-right {
        top: var(--panel-offset);
        right: var(--panel-offset);
      }
      .panel.bottom-left {
        bottom: var(--panel-offset);
        left: var(--panel-offset);
      }
      .panel.bottom-right {
        bottom: var(--panel-offset);
        right: var(--panel-offset);
      }

      .panel.minimized {
        width: auto;
        height: auto;
        border-radius: 8px;
      }

      .bar {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 32px;
        padding: 0 4px 0 10px;
        flex-shrink: 0;
        border-bottom: 1px solid var(--fs-border);
      }

      .minimized .bar {
        border-bottom: none;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        letter-spacing: 0.01em;
        white-space: nowrap;
      }

      .brand::before {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--fs-accent);
        box-shadow: 0 0 6px var(--fs-accent);
      }

      tab-selector {
        flex: 1;
      }

      .minimized .spacer {
        flex: 1;
      }

      .tab-content {
        flex: 1;
        position: relative;
        min-height: 0;
      }

      .tab-content > * {
        position: absolute;
        inset: 0;
      }

      .touch-warning {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 6px 4px 10px;
        background: rgba(255, 193, 7, 0.12);
        color: #ffd54f;
        font-size: 11px;
        border-bottom: 1px solid var(--fs-border);
      }

      .touch-warning span {
        flex: 1;
      }
    `,
  ]
  @state() private activeTab: ControllerTabs
  @state() private isMinimized: boolean =
    ForesightDevtools.instance.devtoolsSettings.isControlPanelDefaultMinimized
  @state() private isTouchDevice: boolean = false
  @state() private isWarningDismissed: boolean = false
  @state() private corner: "top-left" | "top-right" | "bottom-left" | "bottom-right" =
    "bottom-right"

  private localStorageSelectedTabKey = "foresight-devtools-control-panel-tab"
  private localStorageCornerKey = "foresight-devtools-control-panel-corner"
  private _abortController: AbortController | null = null

  constructor() {
    super()
    this.activeTab = this.getStoredTab()
    this.corner = this.getStoredCorner()
    this.isTouchDevice = ForesightManager.instance.getManagerData.currentDeviceStrategy === "touch"
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController

    getEventLogStore().attach()

    ForesightManager.instance.addEventListener(
      "deviceStrategyChanged",
      e => {
        this.isTouchDevice = e.newStrategy === "touch"
        if (e.newStrategy === "touch") {
          this.isWarningDismissed = false
        }
      },
      { signal }
    )

    // Listen for corner change events
    this.addEventListener(
      "corner-change",
      ((e: CustomEvent) => {
        this.setCorner(e.detail.corner)
      }) as EventListener,
      { signal }
    )
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
    getEventLogStore().detach()
  }

  private getStoredTab(): ControllerTabs {
    try {
      const tab = localStorage.getItem(this.localStorageSelectedTabKey)

      return (tab as ControllerTabs) || "logs"
    } catch (error) {
      console.error(error)

      return "logs"
    }
  }

  private getStoredCorner(): Corner {
    try {
      const stored = localStorage.getItem(this.localStorageCornerKey)
      if (stored) {
        return stored as Corner
      }
    } catch (error) {
      console.error("ForesightDevtools: Failed to load corner from localStorage:", error)
    }

    return "bottom-right"
  }

  private _handleTabChange(event: CustomEvent) {
    this.activeTab = event.detail.tab
    this.setStoredTab(this.activeTab)
  }

  private setStoredTab(tab: ControllerTabs): void {
    try {
      localStorage.setItem(this.localStorageSelectedTabKey, tab)
    } catch (error) {
      console.warn("ForesightDevtools: Failed to save tab preference to localStorage:", error)
    }
  }

  private setStoredCorner(corner: Corner): void {
    try {
      localStorage.setItem(this.localStorageCornerKey, corner)
    } catch (error) {
      console.warn("ForesightDevtools: Failed to save corner to localStorage:", error)
    }
  }

  private dismissWarning(): void {
    this.isWarningDismissed = true
  }

  public setCorner(corner: Corner): void {
    this.corner = corner
    this.setStoredCorner(this.corner)
    this.requestUpdate()
  }

  private handleMinimizeClick(event: Event): void {
    event.stopPropagation()
    this.isMinimized = !this.isMinimized
  }

  /**
   * Only the active tab is mounted; hidden tabs would otherwise keep their
   * manager listeners and element subscriptions running invisibly.
   */
  private renderActiveTab() {
    switch (this.activeTab) {
      case "elements":
        return html`<element-tab></element-tab>`
      case "settings":
        return html`<settings-tab></settings-tab>`
      case "logs":
      default:
        return html`<log-tab></log-tab>`
    }
  }

  protected render() {
    const showWarning = !this.isMinimized && this.isTouchDevice && !this.isWarningDismissed

    return html`
      <div class="panel ${this.corner} ${this.isMinimized ? "minimized" : ""}">
        <div class="bar">
          <span class="brand">Foresight</span>
          ${
            this.isMinimized
              ? html`<span class="spacer"></span>`
              : html`<tab-selector
                  .activeTab="${this.activeTab}"
                  @tab-change="${this._handleTabChange}"
                ></tab-selector>`
          }
          <button
            class="icon-button"
            @click="${this.handleMinimizeClick}"
            title="${this.isMinimized ? "Expand" : "Minimize"}"
          >
            ${this.isMinimized ? PLUS_SVG : MINUS_SVG}
          </button>
        </div>

        ${
          showWarning
            ? html`
                <div class="touch-warning">
                  <span>Touch mode: overlays and visibility sorting unavailable</span>
                  <button class="icon-button" @click="${this.dismissWarning}" title="Dismiss">
                    ${CLOSE_SVG}
                  </button>
                </div>
              `
            : ""
        }
        ${this.isMinimized ? "" : html`<div class="tab-content">${this.renderActiveTab()}</div>`}
      </div>
    `
  }
}
