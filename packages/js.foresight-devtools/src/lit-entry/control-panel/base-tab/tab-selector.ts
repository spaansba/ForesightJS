import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import type { ControllerTabs } from "../../../types/types"

@customElement("tab-selector")
export class TabSelector extends LitElement {
  static styles = css`
    :host {
      display: flex;
    }

    .tabs {
      display: flex;
    }

    .tab {
      all: unset;
      display: flex;
      align-items: center;
      padding: 0 10px;
      color: var(--fs-muted);
      cursor: pointer;
    }

    .tab:hover {
      color: var(--fs-text);
    }

    .tab.active {
      color: var(--fs-text);
      box-shadow: inset 0 -1px 0 var(--fs-text);
    }

    .tab:focus-visible {
      outline: 1px dashed var(--fs-text);
      outline-offset: -3px;
    }
  `

  @property({ type: String })
  activeTab: ControllerTabs = "settings"

  private tabs: ControllerTabs[] = ["settings", "elements", "logs"]

  private _handleTabClick(selectedTab: ControllerTabs) {
    this.dispatchEvent(
      new CustomEvent("tab-change", {
        detail: { tab: selectedTab },
        bubbles: true,
        composed: true,
      })
    )
  }

  protected render() {
    return html`
      <div class="tabs" role="tablist">
        ${this.tabs.map(
          tab => html`
            <button
              class="tab ${this.activeTab === tab ? "active" : ""}"
              role="tab"
              aria-selected="${this.activeTab === tab}"
              @click="${() => this._handleTabClick(tab)}"
              data-tab="${tab}"
            >
              ${tab}
            </button>
          `
        )}
      </div>
    `
  }
}
