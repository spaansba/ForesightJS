import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import "../copy-button"
import { CHEVRON_SVG } from "../../../svg/svg-icons"

@customElement("expandable-item")
export class ExpandableItem extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .item.expanded {
        background: var(--fs-raised);
      }

      .header {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 22px;
        padding: 0 4px 0 10px;
        cursor: pointer;
      }

      .header:hover {
        background: var(--fs-hover);
      }

      .content {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .chevron {
        display: flex;
        color: var(--fs-dim);
        transition: transform 0.12s ease;
      }

      .header:hover .chevron {
        color: var(--fs-muted);
      }

      .chevron svg {
        width: 11px;
        height: 11px;
      }

      .expanded .chevron {
        transform: rotate(90deg);
      }

      .details {
        position: relative;
        margin: 0 4px 0 10px;
        padding: 6px 0 8px;
        border-top: 1px dashed var(--fs-line);
      }

      copy-button {
        position: absolute;
        top: 4px;
        right: 0;
      }

      pre {
        margin: 0;
        color: var(--fs-muted);
        font: inherit;
        font-size: 10.5px;
        line-height: 1.5;
        white-space: pre;
        overflow-x: auto;
        scrollbar-width: thin;
      }
    `,
  ]

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
                  <copy-button
                    title="Copy as JSON"
                    .onCopy=${(event: MouseEvent) => this.handleCopy(event)}
                  ></copy-button>
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
