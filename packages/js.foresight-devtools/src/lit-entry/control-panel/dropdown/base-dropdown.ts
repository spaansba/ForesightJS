import { LitElement, html, css, type TemplateResult } from "lit"
import { property, state } from "lit/decorators.js"
import { iconButtonStyles } from "../shared-styles"

export type DropdownOption = {
  value: string
  label: string
  title: string
  icon: TemplateResult
}

export abstract class BaseDropdown extends LitElement {
  private static currentlyOpen: BaseDropdown | null = null

  static styles = [
    iconButtonStyles,
    css`
      :host {
        display: inline-flex;
      }

      .icon-button .arrow-icon {
        width: 9px;
        height: 9px;
        opacity: 0.7;
        transition: transform 0.15s ease;
      }

      .active .arrow-icon {
        transform: rotate(180deg);
      }

      .trigger-label {
        font-size: 11px;
      }

      .dropdown-menu {
        position: fixed;
        z-index: 10002;
        display: none;
        flex-direction: column;
        min-width: 170px;
        padding: 4px;
        background: #1e1e21;
        border: 1px solid var(--fs-border);
        border-radius: 4px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      }

      .dropdown-menu.active {
        display: flex;
      }

      .dropdown-menu button {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 5px 8px;
        border-radius: 2px;
        color: #c8c8cc;
        font-size: 12px;
        cursor: pointer;
      }

      .dropdown-menu button:hover {
        background: var(--fs-hover);
        color: var(--fs-text);
      }

      .dropdown-menu button.active {
        color: var(--fs-accent);
      }

      .dropdown-menu button.active::after {
        content: "✓";
        font-size: 11px;
      }
    `,
  ]

  @state() protected isDropdownOpen: boolean = false
  @property({ type: Array }) dropdownOptions: DropdownOption[] = []

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener("click", this._handleOutsideClick)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener("click", this._handleOutsideClick)
    if (BaseDropdown.currentlyOpen === this) {
      BaseDropdown.currentlyOpen = null
    }
  }

  protected _toggleDropdown = (event: MouseEvent) => {
    event.stopPropagation()

    if (this.isDropdownOpen) {
      this._closeDropdown()
    } else {
      if (BaseDropdown.currentlyOpen && BaseDropdown.currentlyOpen !== this) {
        BaseDropdown.currentlyOpen._closeDropdown()
      }

      this.isDropdownOpen = true
      BaseDropdown.currentlyOpen = this

      this._positionDropdown()
    }
  }

  protected _closeDropdown(): void {
    this.isDropdownOpen = false
    if (BaseDropdown.currentlyOpen === this) {
      BaseDropdown.currentlyOpen = null
    }
  }

  protected _positionDropdown() {
    if (typeof window === "undefined") {
      return
    }

    const triggerButton = this.shadowRoot?.querySelector(".icon-button") as HTMLElement
    const dropdownMenu = this.shadowRoot?.querySelector(".dropdown-menu") as HTMLElement

    if (triggerButton && dropdownMenu) {
      const rect = triggerButton.getBoundingClientRect()
      const dropdownHeight = dropdownMenu.offsetHeight || 200

      const top = rect.bottom + 5
      const right = window.innerWidth - rect.right

      const availableSpaceBelow = window.innerHeight - rect.bottom
      const shouldPositionAbove = availableSpaceBelow < dropdownHeight && rect.top > dropdownHeight

      if (shouldPositionAbove) {
        dropdownMenu.style.top = `${rect.top - dropdownHeight - 5}px`
      } else {
        dropdownMenu.style.top = `${top}px`
      }

      dropdownMenu.style.right = `${right}px`
    }
  }

  protected _handleOutsideClick = (event: MouseEvent) => {
    if (this.isDropdownOpen) {
      if (!event.composedPath().includes(this)) {
        this._closeDropdown()
      }
    }
  }

  protected abstract _handleOptionClick(option: DropdownOption): void
  protected abstract _getTriggerIcon(): TemplateResult
  protected abstract _isOptionSelected(option: DropdownOption): boolean
  protected abstract _getTriggerTitle(): string
  protected abstract _getTriggerLabel(): string

  render() {
    const buttonClass = `icon-button ${this.isDropdownOpen ? "active" : ""}`
    const menuClass = `dropdown-menu ${this.isDropdownOpen ? "active" : ""}`

    return html`
      <div class="dropdown-container">
        <button
          class="${buttonClass}"
          part="trigger"
          data-tip="${this._getTriggerTitle()}"
          @click="${this._toggleDropdown}"
          aria-haspopup="true"
          aria-expanded="${this.isDropdownOpen}"
          aria-controls="dropdown-menu"
          aria-label="${this._getTriggerLabel()}"
        >
          ${this._getTriggerIcon()}
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
                data-tip="${option.title}"
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
