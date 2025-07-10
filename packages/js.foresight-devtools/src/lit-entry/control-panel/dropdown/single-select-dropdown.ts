import { html, type TemplateResult } from "lit"
import { customElement, property } from "lit/decorators.js"
import { BaseDropdown, type DropdownOption } from "./base-dropdown"

export type { DropdownOption } from "./base-dropdown"

@customElement("single-select-dropdown")
export class SingleSelectDropdown extends BaseDropdown {
  @property({ type: String }) selectedOptionValue: string = ""
  @property({ type: Function }) onSelectionChange?: (value: string) => void

  connectedCallback() {
    super.connectedCallback()
    if (this.dropdownOptions.length > 0 && !this.selectedOptionValue) {
      this.selectedOptionValue = this.dropdownOptions[0].value
    }
  }

  willUpdate(changedProperties: Map<PropertyKey, unknown>) {
    if (
      changedProperties.has("dropdownOptions") &&
      this.dropdownOptions.length > 0 &&
      !this.selectedOptionValue
    ) {
      this.selectedOptionValue = this.dropdownOptions[0].value
    }
  }

  protected _handleOptionClick(option: DropdownOption): void {
    if (option.value !== this.selectedOptionValue) {
      this.selectedOptionValue = option.value
      this.onSelectionChange?.(option.value)
    }
    this._closeDropdown()
  }

  protected _getTriggerIcon(): TemplateResult {
    const selectedOption = this._getSelectedOption()
    return selectedOption ? selectedOption.icon : html``
  }

  protected _isOptionSelected(option: DropdownOption): boolean {
    return option.value === this.selectedOptionValue
  }

  protected _getTriggerTitle(): string {
    const selected = this._getSelectedOption()
    return selected ? selected.title : "Change selection"
  }

  protected _getTriggerLabel(): string {
    const selected = this._getSelectedOption()
    return selected ? `Current selection: ${selected.label}` : "No selection"
  }

  private _getSelectedOption(): DropdownOption | undefined {
    return this.dropdownOptions.find(option => option.value === this.selectedOptionValue)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "single-select-dropdown": SingleSelectDropdown
  }
}
