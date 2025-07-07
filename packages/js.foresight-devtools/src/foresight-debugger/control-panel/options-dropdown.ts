import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("options-dropdown")
export class OptionsDropdown extends LitElement {
  static styles = css`
    .dropdown-container {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 5px);
      right: 0;
      z-index: 10;
      display: none;
      flex-direction: column;
      background-color: #3a3a3a;
      border: 1px solid #555;
      min-width: 200px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .dropdown-menu.active {
      display: flex;
    }

    .dropdown-menu button {
      background: none;
      border: none;
      color: #ccc;
      font-size: 12px;
      text-align: left;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      position: relative;
    }

    .dropdown-menu button:hover {
      background-color: #555;
      color: white;
    }

    .dropdown-menu button.active {
      color: #b0c4de;
      font-weight: bold;
      background-color: rgba(176, 196, 222, 0.1);
    }

    .dropdown-menu button.active::after {
      content: "✓";
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: #b0c4de;
      font-weight: bold;
    }
  `

  @property({})
  render() {
    return html` <div class="dropdown-container">
      <button
        class="tab-bar-extra-button"
        id="sort-elements-button"
        title="Change element list sort order"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
        </svg>
      </button>
      <div class="dropdown-menu" id="sort-options-dropdown">
        <button data-sort="visibility" title="Sort by Visibility">Visibility</button>
        <button data-sort="documentOrder" title="Sort by Document Order">Document Order</button>
        <button data-sort="insertionOrder" title="Sort by Insertion Order">Insertion Order</button>
      </div>
    </div>`
  }
}
