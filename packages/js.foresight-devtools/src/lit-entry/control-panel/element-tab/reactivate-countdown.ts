import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"

@customElement("reactivate-countdown")
export class ReactivateCountdown extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .countdown-time {
        color: #ffa500;
        font-weight: bold;
      }

      .countdown-time.infinity {
        font-size: 1.2em;
        font-weight: bold;
      }
    `,
  ]

  @property({ type: Number })
  reactivateAfter: number = 0

  @state()
  private remainingTime: number = 0

  @state()
  private isActive: boolean = false

  private intervalId: number | null = null
  private startTime: number = 0

  connectedCallback() {
    super.connectedCallback()
    this.startCountdown()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.clearCountdown()
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has("reactivateAfter")) {
      this.clearCountdown()
      this.startCountdown()
    }
  }

  private startCountdown() {
    this.isActive = true
    if (this.reactivateAfter === Infinity) {
      this.remainingTime = Infinity
      return
    }

    this.startTime = Date.now()
    this.remainingTime = this.reactivateAfter

    this.intervalId = window.setInterval(() => {
      const elapsed = Date.now() - this.startTime
      const remaining = Math.max(0, this.reactivateAfter - elapsed)

      this.remainingTime = remaining

      if (remaining <= 0) {
        this.clearCountdown()
        this.isActive = false
      }
    }, 100)
  }

  private clearCountdown() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private formatTime(ms: number): string {
    if (ms === Infinity) {
      return "∞"
    }
    
    const totalSeconds = Math.ceil(ms / 1000)
    
    if (totalSeconds < 60) {
      return `${totalSeconds}s`
    }
    
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    if (minutes < 60) {
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    
    return `${hours}h`
  }

  render() {
    if (!this.isActive || this.remainingTime === Infinity) {
      return html``
    }

    return html` <span class="countdown-time">${this.formatTime(this.remainingTime)}</span> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reactivate-countdown": ReactivateCountdown
  }
}
