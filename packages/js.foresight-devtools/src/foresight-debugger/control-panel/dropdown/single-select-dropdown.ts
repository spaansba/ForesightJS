import { html, type TemplateResult } from "lit"
import { customElement, property } from "lit/decorators.js"
import { BaseDropdown, type DropdownOption } from "./base-dropdown"

// Re-export the type for backwards compatibility
export type { DropdownOption } from "./base-dropdown"

@customElement("single-select-dropdown")
export class SingleSelectDropdown extends BaseDropdown {
  @property({ type: String }) selectedOptionValue: string = ""
  @property({ type: Function }) onSelectionChange?: (value: string) => void

  // Set the initial selectedOptionValue based on dropdownOptions once they are set
  connectedCallback() {
    super.connectedCallback()
    // If dropdownOptions are available when component connects, set default selected option
    if (this.dropdownOptions.length > 0 && !this.selectedOptionValue) {
      this.selectedOptionValue = this.dropdownOptions[0].value
    }
  }

  // Handle case where dropdownOptions might be set asynchronously after connectedCallback
  // or change during component lifecycle
  willUpdate(changedProperties: Map<PropertyKey, unknown>) {
    if (
      changedProperties.has("dropdownOptions") &&
      this.dropdownOptions.length > 0 &&
      !this.selectedOptionValue
    ) {
      this.selectedOptionValue = this.dropdownOptions[0].value
    }
  }

  // Implementation of abstract methods from BaseDropdown
  protected _handleOptionClick(option: DropdownOption): void {
    if (option.value !== this.selectedOptionValue) {
      this.selectedOptionValue = option.value // Update the internal selected state
      this.onSelectionChange?.(option.value) // Call the external callback with the new value
    }
    this._closeDropdown() // Close the dropdown using the base method
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

  // Finds the currently selected option object
  private _getSelectedOption(): DropdownOption | undefined {
    return this.dropdownOptions.find(option => option.value === this.selectedOptionValue)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "single-select-dropdown": SingleSelectDropdown
  }
}
