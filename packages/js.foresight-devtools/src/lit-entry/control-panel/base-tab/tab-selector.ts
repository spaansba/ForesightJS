import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import type { ControllerTabs } from "../../../types/types"

@customElement("tab-selector")
export class TabSelector extends LitElement {
  static styles = css`
    .tab-selector-wrapper {
      border-bottom: 2px solid #444;
      margin-top: 12px;
      display: flex;
      justify-content: space-evenly;
      width: 100%;
    }

    .tab-button {
      background: none;
      border: none;
      color: #9e9e9e;
      flex: 1;
      padding: 8px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
    }
    .tab-button:hover {
      color: #b0c4de;
      background-color: rgba(176, 196, 222, 0.1);
    }

    .tab-button.active {
      color: #b0c4de;
      border-bottom-color: #b0c4de;
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
      <div class="tab-selector-wrapper">
        ${this.tabs.map(
          tab => html`
            <button
              class="tab-button ${this.activeTab === tab ? "active" : ""}"
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
