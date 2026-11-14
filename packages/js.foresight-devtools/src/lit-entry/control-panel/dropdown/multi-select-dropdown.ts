import { customElement, property } from "lit/decorators.js"
import { BaseDropdown, type DropdownOption } from "./base-dropdown"

@customElement("multi-select-dropdown")
export class MultiSelectDropdown extends BaseDropdown {
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

  protected _getTriggerContent(): string {
    return `types ${this.selectedValues.length}/${this.dropdownOptions.length}`
  }

  protected _isOptionSelected(option: DropdownOption): boolean {
    return this.selectedValues.includes(option.value)
  }

  protected _getTriggerTitle(): string {
    return "Which event types get logged"
  }

  protected _getTriggerLabel(): string {
    return `Filter options: ${this.selectedValues.length} selected`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "multi-select-dropdown": MultiSelectDropdown
  }
}
