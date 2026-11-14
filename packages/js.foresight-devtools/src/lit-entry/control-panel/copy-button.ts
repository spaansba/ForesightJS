import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { buttonStyles } from "./shared-styles"

@customElement("copy-button")
export class CopyButton extends LitElement {
  static styles = [
    buttonStyles,
    css`
      :host {
        display: inline-flex;
      }

      .copied,
      .copied:hover {
        color: var(--fs-ok);
      }
    `,
  ]

  @property() label: string = "copy"
  @property({ type: Function }) onCopy?: (event: MouseEvent) => Promise<void> | void

  @state() private isCopied: boolean = false
  private copyTimeout: ReturnType<typeof setTimeout> | undefined

  private async handleClick(event: MouseEvent): Promise<void> {
    if (this.isCopied) {
      return
    }

    try {
      await this.onCopy?.(event)
    } catch (error) {
      console.error("Error in onCopy function:", error)
    }

    this.isCopied = true
    clearTimeout(this.copyTimeout)
    this.copyTimeout = setTimeout(() => {
      this.isCopied = false
    }, 1500)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    clearTimeout(this.copyTimeout)
  }

  render() {
    return html`
      <button class="btn ${this.isCopied ? "copied" : ""}" @click=${this.handleClick}>
        ${this.isCopied ? "copied" : this.label}
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "copy-button": CopyButton
  }
}
