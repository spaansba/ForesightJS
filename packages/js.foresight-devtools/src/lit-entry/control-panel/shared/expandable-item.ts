import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import "../copy-icon/copy-icon"

@customElement("expandable-item")
export class ExpandableItem extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .item-entry {
        margin-bottom: 2px;
        font-size: 11px;
        line-height: 1.3;
        overflow: hidden;
        transition: all 0.2s ease;
        border-left: 2px solid var(--border-color, #555);
        padding-left: 6px;
      }

      .item-entry:hover:not(.expanded) {
        background-color: rgba(255, 255, 255, 0.02);
      }

      .item-entry.expanded {
        background-color: rgba(255, 255, 255, 0.03);
      }

      .item-header {
        display: flex;
        align-items: center;
        padding: 3px 4px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        gap: 8px;
        min-height: 20px;
      }

      .item-header:hover:not(.expanded) {
        background-color: rgba(255, 255, 255, 0.03);
      }

      .item-details {
        position: relative;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .item-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        margin-left: 4px;
        user-select: none;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 2px;
      }

      .item-toggle:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .item-toggle svg {
        width: 12px;
        height: 12px;
        fill: none;
        stroke: #b0c4de;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        transition: all 0.2s ease;
      }

      .item-toggle:hover svg {
        stroke: #d4e4f4;
      }

      .item-toggle.expanded svg {
        transform: rotate(90deg);
      }

      .item-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .item-data {
        color: #e0e0e0;
        white-space: pre;
        font-size: 11px;
        margin: 0;
        padding: 0;
        font-family: "Courier New", monospace;
        line-height: 1.3;
        display: block;
        overflow-x: auto;
      }
    `,
  ]

  @property() borderColor: string = "#555"
  @property() showCopyButton: boolean = false
  @property() itemId: string = ""
  @property() isExpanded: boolean = false
  @property() onToggle: ((itemId: string) => void) | undefined

  private toggleExpand(): void {
    if (this.onToggle) {
      this.onToggle(this.itemId)
    }
  }

  private async handleCopy(event: MouseEvent): Promise<void> {
    event.stopPropagation()
    const detailsSlot = this.shadowRoot?.querySelector('slot[name="details"]') as HTMLSlotElement
    if (detailsSlot) {
      const assignedNodes = detailsSlot.assignedNodes()
      const textContent = assignedNodes.map(node => node.textContent).join("")

      try {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textContent)
        } else {
          // Fallback for older browsers or non-HTTPS
          this.fallbackCopyToClipboard(textContent)
        }
      } catch (err) {
        console.error("Failed to copy to clipboard:", err)
        // Try fallback method on error
        try {
          this.fallbackCopyToClipboard(textContent)
        } catch (fallbackErr) {
          console.error("Fallback copy also failed:", fallbackErr)
        }
      }
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.opacity = "0"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand("copy")
    } finally {
      document.body.removeChild(textArea)
    }
  }

  render() {
    this.style.setProperty("--border-color", this.borderColor)

    return html`
      <div class="item-entry ${this.isExpanded ? "expanded" : ""}">
        <div class="item-header ${this.isExpanded ? "expanded" : ""}" @click="${this.toggleExpand}">
          <div class="item-content">
            <slot name="content"></slot>
          </div>
          <span class="item-toggle ${this.isExpanded ? "expanded" : ""}">
            <svg viewBox="0 0 24 24">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </span>
        </div>
        ${this.isExpanded
          ? html`
              <div class="item-details">
                <copy-icon
                  positioned
                  title="Copy Details"
                  .onCopy=${(event: MouseEvent) => this.handleCopy(event)}
                ></copy-icon>
                <pre class="item-data">
                  <slot name="details"></slot>
                </pre>
              </div>
            `
          : ""}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "expandable-item": ExpandableItem
  }
}
