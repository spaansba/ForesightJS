import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import "../copy-icon/copy-icon"
import { CHEVRON_SVG } from "../../../svg/svg-icons"

@customElement("expandable-item")
export class ExpandableItem extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .item {
        border-radius: 5px;
      }

      .item.expanded {
        background: var(--fs-surface);
      }

      .header {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 24px;
        padding: 0 4px 0 6px;
        border-radius: 5px;
        cursor: pointer;
      }

      .header:hover {
        background: var(--fs-hover);
      }

      .header::before {
        content: "";
        width: 2px;
        height: 12px;
        border-radius: 1px;
        background: var(--border-color, #555);
        flex-shrink: 0;
      }

      .content {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .chevron {
        display: flex;
        color: var(--fs-muted);
        transition: transform 0.15s ease;
      }

      .chevron svg {
        width: 12px;
        height: 12px;
      }

      .expanded .chevron {
        transform: rotate(90deg);
      }

      .details {
        position: relative;
        padding: 4px 6px 6px 14px;
      }

      copy-icon {
        position: absolute;
        top: 4px;
        right: 4px;
      }

      pre {
        margin: 0;
        color: #cfcfd4;
        font-family: var(--fs-mono);
        font-size: 10.5px;
        line-height: 1.45;
        white-space: pre;
        overflow-x: auto;
        scrollbar-width: thin;
      }
    `,
  ]

  @property() borderColor: string = "#555"
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
        await navigator.clipboard.writeText(textContent)
      } catch (err) {
        console.error("Failed to copy text: ", err)
      }
    }
  }

  render() {
    this.style.setProperty("--border-color", this.borderColor)

    return html`
      <div class="item ${this.isExpanded ? "expanded" : ""}">
        <div class="header" @click="${this.toggleExpand}">
          <div class="content"><slot name="content"></slot></div>
          <span class="chevron">${CHEVRON_SVG}</span>
        </div>
        ${
          this.isExpanded
            ? html`
                <div class="details">
                  <copy-icon
                    title="Copy details"
                    .onCopy=${(event: MouseEvent) => this.handleCopy(event)}
                  ></copy-icon>
                  <pre><slot name="details"></slot></pre>
                </div>
              `
            : ""
        }
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "expandable-item": ExpandableItem
  }
}
