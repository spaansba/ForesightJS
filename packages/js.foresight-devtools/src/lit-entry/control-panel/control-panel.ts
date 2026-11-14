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
import { CLOSE_SVG, MINIMIZE_SVG } from "../../svg/svg-icons"
import { buttonStyles } from "./shared-styles"

@customElement("control-panel")
export class ControlPanel extends LitElement {
  static styles = [
    buttonStyles,
    css`
      :host {
        --fs-bg: #121211;
        --fs-raised: #1a1a18;
        --fs-hover: #232320;
        --fs-line: #2e2d2a;
        --fs-text: #c9c5bc;
        --fs-muted: #858179;
        --fs-dim: #55534e;
        --fs-mouse: #3b82f6;
        --fs-scroll: #eab308;
        --fs-tab: #f97316;
        --fs-ok: #4ade80;
        --fs-error: #f87171;
        --fs-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
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
        color: var(--fs-text);
        border: 1px solid var(--fs-line);
        border-radius: 2px;
        box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.7);
        font-family: var(--fs-mono);
        font-size: 11px;
        line-height: 1.4;
        font-variant-numeric: tabular-nums;
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
      }

      .bar {
        display: flex;
        align-items: stretch;
        height: 30px;
        padding-right: 4px;
        flex-shrink: 0;
        border-bottom: 1px solid var(--fs-line);
      }

      .brand,
      .pill {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 0 10px;
        font-weight: 600;
        letter-spacing: -0.01em;
        white-space: nowrap;
      }

      .brand {
        border-right: 1px dashed var(--fs-line);
      }

      .pill {
        all: unset;
        display: flex;
        align-items: center;
        gap: 7px;
        height: 28px;
        padding: 0 10px;
        font-weight: 600;
        cursor: pointer;
      }

      .pill:hover {
        background: var(--fs-hover);
      }

      tab-selector {
        flex: 1;
      }

      .bar > .btn {
        align-self: center;
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
        padding: 3px 4px 3px 10px;
        color: var(--fs-muted);
        border-bottom: 1px dashed var(--fs-line);
      }

      .touch-warning span {
        flex: 1;
      }

      .touch-warning b {
        color: var(--fs-scroll);
        font-weight: 500;
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
        ${
          this.isMinimized
            ? html`<button class="pill" @click="${this.handleMinimizeClick}" title="Open devtools">
                foresight
              </button>`
            : html`<div class="bar">
                <span class="brand">foresight</span>
                <tab-selector
                  .activeTab="${this.activeTab}"
                  @tab-change="${this._handleTabChange}"
                ></tab-selector>
                <button class="btn" @click="${this.handleMinimizeClick}" title="Minimize">
                  ${MINIMIZE_SVG}
                </button>
              </div>`
        }
        ${
          showWarning
            ? html`
                <div class="touch-warning">
                  <span><b>touch device</b>, no trajectories or visibility sort</span>
                  <button class="btn" @click="${this.dismissWarning}" title="Dismiss">
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
