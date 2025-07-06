import { css, html, LitElement } from "lit"
import { customElement } from "lit/decorators.js"

@customElement("tab-selector")
export class TabSelector extends LitElement {
  static styles = css`
    .tab-selector-wrapper {
      border-bottom: 2px solid #444;
      margin-top: 12px;
      display: flex;
      justify-content: space-evenly; /* Or space-around, or flex-start, etc. */
      width: 100%; /* Ensure the wrapper takes up the full width of its host */
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
      text-align: center; /* Center the text within each button */
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

  protected render() {
    return html`
      <div class="tab-selector-wrapper">
        <button class="tab-button active" data-tab="settings">Settings</button>
        <button class="tab-button" data-tab="elements">Elements</button>
        <button class="tab-button" data-tab="logs">Logs</button>
      </div>
    `
  }
}
