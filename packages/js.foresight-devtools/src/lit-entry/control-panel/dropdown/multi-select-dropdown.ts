import { html, css, type TemplateResult } from "lit"
import { customElement, property } from "lit/decorators.js"
import { BaseDropdown, type DropdownOption } from "./base-dropdown"
import { FILTER_SVG } from "../../../svg/svg-icons"

@customElement("multi-select-dropdown")
export class MultiSelectDropdown extends BaseDropdown {
  static styles = [
    ...BaseDropdown.styles,
    css`
      .dropdown-menu button.active::after {
        content: "✓";
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        color: #b0c4de;
        font-weight: bold;
      }

      .selected-count {
        font-size: 10px;
        color: #b0c4de;
        margin-left: 2px;
      }
    `,
  ]

  @property({ type: Array }) selectedValues: string[] = []
  @property() onSelectionChange?: (changedValue: string, isSelected: boolean) => void

  protected _handleOptionClick(option: DropdownOption): void {
    const isCurrentlySelected = this.selectedValues.includes(option.value)

    if (isCurrentlySelected) {
      this.selectedValues = this.selectedValues.filter(value => value !== option.value)
    } else {
      this.selectedValues = [...this.selectedValues, option.value]
    }
    const newSelectionState = !isCurrentlySelected
    this.onSelectionChange?.(option.value, newSelectionState)
  }

  protected _getTriggerIcon(): TemplateResult {
    return FILTER_SVG
  }

  protected _isOptionSelected(option: DropdownOption): boolean {
    return this.selectedValues.includes(option.value)
  }

  protected _getTriggerTitle(): string {
    const count = this.selectedValues.length
    if (count === 0) {
      return "No items selected"
    } else if (count === 1) {
      return "1 item selected"
    } else {
      return `${count} items selected`
    }
  }

  protected _getTriggerLabel(): string {
    return `Filter options: ${this.selectedValues.length} selected`
  }

  render() {
    const buttonClass = `trigger-button ${this.isDropdownOpen ? "active" : ""}`
    const menuClass = `dropdown-menu ${this.isDropdownOpen ? "active" : ""}`

    return html`
      <div class="dropdown-container">
        <button
          class="${buttonClass}"
          title="${this._getTriggerTitle()}"
          @click="${this._toggleDropdown}"
          aria-haspopup="true"
          aria-expanded="${this.isDropdownOpen}"
          aria-controls="dropdown-menu"
          aria-label="${this._getTriggerLabel()}"
        >
          ${this._getTriggerIcon()}
          <span class="selected-count">${this.selectedValues.length}</span>
          <svg
            class="arrow-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div class="${menuClass}" id="dropdown-menu" role="menu">
          ${this.dropdownOptions.map(
            option => html`
              <button
                value="${option.value}"
                title="${option.title}"
                class="${this._isOptionSelected(option) ? "active" : ""}"
                @click="${() => this._handleOptionClick(option)}"
                role="menuitem"
              >
                ${option.label}
              </button>
            `
          )}
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "multi-select-dropdown": MultiSelectDropdown
  }
}
