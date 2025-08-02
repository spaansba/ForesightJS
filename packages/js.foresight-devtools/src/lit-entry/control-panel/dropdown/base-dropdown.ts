import { LitElement, html, css, type TemplateResult } from "lit"
import { property, state } from "lit/decorators.js"

export type DropdownOption = {
  value: string
  label: string
  title: string
  icon: TemplateResult
}

export abstract class BaseDropdown extends LitElement {
  private static currentlyOpen: BaseDropdown | null = null

  static styles = [
    css`
      :host {
        display: inline-block;
      }

      .dropdown-container {
        position: relative;
        display: inline-block;
      }

      .trigger-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: all 0.2s ease;
      }

      .trigger-button svg {
        width: 16px;
        height: 16px;
        stroke: white;
        transition: stroke 0.2s;
      }

      .trigger-button .arrow-icon {
        width: 10px;
        height: 10px;
        stroke: white;
        fill: none;
        stroke-width: 2;
        transition:
          transform 0.2s ease,
          stroke 0.2s;
      }

      .trigger-button:hover {
        background-color: rgba(176, 196, 222, 0.1);
      }

      .trigger-button:hover svg,
      .trigger-button:hover .arrow-icon {
        stroke: #b0c4de;
      }

      .trigger-button.active {
        background-color: rgba(176, 196, 222, 0.2);
      }

      .trigger-button.active svg {
        stroke: #b0c4de;
      }

      .trigger-button.active .arrow-icon {
        transform: rotate(180deg);
        stroke: #b0c4de;
      }

      .dropdown-menu {
        position: fixed;
        z-index: 9999;
        display: none;
        flex-direction: column;
        background-color: #3a3a3a;
        border: 1px solid #555;
        min-width: 200px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        overflow: hidden;
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
        width: 100%;
        box-sizing: border-box;
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

      requestAnimationFrame(() => {
        this._positionDropdown()
      })
    }
  }

  protected _closeDropdown(): void {
    this.isDropdownOpen = false
    if (BaseDropdown.currentlyOpen === this) {
      BaseDropdown.currentlyOpen = null
    }
  }

  protected _positionDropdown() {
    if (typeof window === 'undefined') {
      return
    }

    const triggerButton = this.shadowRoot?.querySelector(".trigger-button") as HTMLElement
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
