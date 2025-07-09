import type { ForesightElementData } from "js.foresight"
import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import "../base-tab/expandable-item"

@customElement("single-element")
export class SingleElement extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .element-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        flex-shrink: 0;
        transition: all 0.3s ease;
      }

      .status-indicator.visible {
        background-color: #4caf50;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
      }

      .status-indicator.hidden {
        background-color: #666;
        box-shadow: 0 0 0 2px rgba(102, 102, 102, 0.2);
      }

      .status-indicator.prefetching {
        background-color: #ffeb3b;
        box-shadow: 0 0 0 2px rgba(255, 235, 59, 0.4);
      }

      .element-name {
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11px;
        font-weight: 500;
        color: #e8e8e8;
      }

      .element-name.callback-active {
        color: #fff;
        font-weight: 600;
      }
    `,
  ]

  @property() elementData!: ForesightElementData & { elementId: string }
  @property() isActive: boolean = false
  @property() isExpanded: boolean = false
  @property() onToggle: ((elementId: string) => void) | undefined

  private getBorderColor(): string {
    if (this.isActive) {
      return "#ffeb3b"
    }
    return this.elementData.isIntersectingWithViewport ? "#4caf50" : "#666"
  }

  private getStatusIndicatorClass(): string {
    if (this.isActive) {
      return "prefetching"
    }
    return this.elementData.isIntersectingWithViewport ? "visible" : "hidden"
  }

  private formatElementDetails(): string {
    const details = {
      tagName: this.elementData.element.tagName.toLowerCase(),
      isIntersecting: this.elementData.isIntersectingWithViewport,
      registerCount: this.elementData.registerCount,
      hitSlop: {
        top: this.elementData.elementBounds.hitSlop.top,
        right: this.elementData.elementBounds.hitSlop.right,
        bottom: this.elementData.elementBounds.hitSlop.bottom,
        left: this.elementData.elementBounds.hitSlop.left,
      },
    }

    return JSON.stringify(details, null, 2)
  }

  render() {
    return html`
      <expandable-item
        .borderColor=${this.getBorderColor()}
        .showCopyButton=${true}
        .itemId=${this.elementData.elementId}
        .isExpanded=${this.isExpanded}
        .onToggle=${this.onToggle}
      >
        <div slot="content" class="element-content">
          <div class="status-indicator ${this.getStatusIndicatorClass()}"></div>
          <span class="element-name ${this.isActive ? "callback-active" : ""}">
            ${this.elementData.name || "unnamed"}
          </span>
        </div>
        <div slot="details">${this.formatElementDetails()}</div>
      </expandable-item>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "single-element": SingleElement
  }
}
