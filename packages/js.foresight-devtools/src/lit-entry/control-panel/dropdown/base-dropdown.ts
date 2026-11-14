import { LitElement, html, css, type PropertyValues, type TemplateResult } from "lit"
import { property, query, state } from "lit/decorators.js"
import { buttonStyles } from "../shared-styles"

export type DropdownOption = {
  value: string
  label?: string
  title: string
}

export const optionLabel = (option: DropdownOption) => option.label ?? option.value

const GAP = 4

export abstract class BaseDropdown extends LitElement {
  private static currentlyOpen: BaseDropdown | null = null

  static styles = [
    buttonStyles,
    css`
      :host {
        display: inline-flex;
      }

      .btn {
        color: var(--fs-text);
      }

      .caret {
        color: var(--fs-dim);
        font-size: 8px;
      }

      .btn:hover .caret,
      .btn.active .caret {
        color: var(--fs-muted);
      }

      .dropdown-menu {
        position: fixed;
        z-index: 10002;
        display: none;
        flex-direction: column;
        min-width: 150px;
        padding: 3px 0;
        background: var(--fs-raised);
        border: 1px solid var(--fs-line);
        border-radius: 2px;
        box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.7);
        font-family: var(--fs-mono);
        font-size: 11px;
      }

      .dropdown-menu.active {
        display: flex;
      }

      .dropdown-menu button {
        all: unset;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 3px 10px 3px 8px;
        color: var(--fs-muted);
        cursor: pointer;
      }

      .dropdown-menu button::before {
        content: "";
        width: 5px;
        height: 5px;
        border: 1px solid var(--fs-dim);
      }

      .dropdown-menu button:hover {
        background: var(--fs-hover);
        color: var(--fs-text);
      }

      .dropdown-menu button.active {
        color: var(--fs-text);
      }

      .dropdown-menu button.active::before {
        background: var(--fs-text);
        border-color: var(--fs-text);
      }
    `,
  ]

  @state() protected isDropdownOpen: boolean = false
  @query(".btn") private trigger!: HTMLElement
  @query(".dropdown-menu") private menu!: HTMLElement
  @property({ type: Array }) dropdownOptions: DropdownOption[] = []

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener("click", this._handleOutsideClick)
    document.addEventListener("scroll", this._closeOnScroll, true)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener("click", this._handleOutsideClick)
    document.removeEventListener("scroll", this._closeOnScroll, true)
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
    }
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("isDropdownOpen") && this.isDropdownOpen) {
      this._positionDropdown()
    }
  }

  private _closeOnScroll = (event: Event) => {
    if (this.isDropdownOpen && !event.composedPath().includes(this.menu)) {
      this._closeDropdown()
    }
  }

  protected _closeDropdown(): void {
    this.isDropdownOpen = false
    if (BaseDropdown.currentlyOpen === this) {
      BaseDropdown.currentlyOpen = null
    }
  }

  private _positionDropdown() {
    const trigger = this.trigger.getBoundingClientRect()
    const { height } = this.menu.getBoundingClientRect()
    const fitsBelow = trigger.bottom + GAP + height <= window.innerHeight - GAP

    this.menu.style.top = `${fitsBelow ? trigger.bottom + GAP : trigger.top - GAP - height}px`
    this.menu.style.right = `${window.innerWidth - trigger.right}px`
  }

  protected _handleOutsideClick = (event: MouseEvent) => {
    if (this.isDropdownOpen) {
      if (!event.composedPath().includes(this)) {
        this._closeDropdown()
      }
    }
  }

  protected abstract _handleOptionClick(option: DropdownOption): void
  protected abstract _getTriggerContent(): TemplateResult | string
  protected abstract _isOptionSelected(option: DropdownOption): boolean
  protected abstract _getTriggerTitle(): string
  protected abstract _getTriggerLabel(): string

  render() {
    const buttonClass = `btn ${this.isDropdownOpen ? "active" : ""}`
    const menuClass = `dropdown-menu ${this.isDropdownOpen ? "active" : ""}`

    return html`
      <div class="dropdown-container">
        <button
          class="${buttonClass}"
          part="trigger"
          title="${this._getTriggerTitle()}"
          @click="${this._toggleDropdown}"
          aria-haspopup="true"
          aria-expanded="${this.isDropdownOpen}"
          aria-controls="dropdown-menu"
          aria-label="${this._getTriggerLabel()}"
        >
          ${this._getTriggerContent()}
          <span class="caret">▼</span>
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
                ${optionLabel(option)}
              </button>
            `
          )}
        </div>
      </div>
    `
  }
}
