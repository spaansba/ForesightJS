import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import type { ControllerTabs } from "../../../types/types"

@customElement("tab-selector")
export class TabSelector extends LitElement {
  static styles = css`
    .tabs {
      display: flex;
      gap: 2px;
    }

    .tab {
      all: unset;
      padding: 3px 8px;
      border-radius: 5px;
      color: var(--fs-muted);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition:
        background-color 0.12s ease,
        color 0.12s ease;
    }

    .tab:hover {
      color: var(--fs-text);
    }

    .tab.active {
      color: var(--fs-text);
      background: var(--fs-hover);
    }

    .tab:focus-visible {
      outline: 1px solid var(--fs-accent);
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
              ${tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          `
        )}
      </div>
    `
  }
}
