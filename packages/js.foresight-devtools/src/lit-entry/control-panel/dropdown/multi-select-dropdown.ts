import { html, type TemplateResult } from "lit"
import { customElement, property } from "lit/decorators.js"
import { BaseDropdown, type DropdownOption } from "./base-dropdown"
import { FILTER_SVG } from "../../../svg/svg-icons"

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

  protected _getTriggerIcon(): TemplateResult {
    return html`${FILTER_SVG}<span class="trigger-label">${this.selectedValues.length}</span>`
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
}

declare global {
  interface HTMLElementTagNameMap {
    "multi-select-dropdown": MultiSelectDropdown
  }
}
