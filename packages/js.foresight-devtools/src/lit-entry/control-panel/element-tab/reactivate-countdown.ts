import { ForesightManager, type ForesightElementData } from "js.foresight"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"

@customElement("reactivate-countdown")
export class ReactivateCountdown extends LitElement {
  static styles = [
    css`
      :host {
        display: inline-block;
      }

      .reactivate-button {
        all: unset;
        cursor: pointer;
        padding: 2px 4px;
        transition: background-color 0.2s ease;
      }

      .reactivate-button:hover {
        background-color: rgba(255, 165, 0, 0.1);
      }

      .countdown-time {
        color: #ffa726;
        font-weight: 500;
        font-size: 10px;
      }

      .countdown-time.infinity {
        font-size: 12px;
        font-weight: 600;
      }

      .countdown-time.clickable {
        cursor: pointer;
      }
    `,
  ]

  @property({ hasChanged: () => true }) elementData!: ForesightElementData
  @state()
  private remainingTime: number = 0

  @state()
  private isCountdownActive: boolean = false

  private intervalId: number | null = null
  private startTime: number = 0

  connectedCallback() {
    super.connectedCallback()
    this.checkAndStartCountdown()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.clearCountdown()
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties)
    if (changedProperties.has("elementData")) {
      this.checkAndStartCountdown()
    }
  }

  private checkAndStartCountdown() {
    const callbackInfo = this.elementData?.callbackInfo

    if (!callbackInfo) {
      this.clearCountdown()
      return
    }

    // Show countdown when:
    // 1. Callback is inactive (not currently active)
    // 2. Callback has completed at least once (has lastCallbackCompletedAt OR lastCallbackInvokedAt)
    // 3. reactivateAfter is not 0 (otherwise instant reactivation)
    const hasCallbackHistory =
      callbackInfo.lastCallbackCompletedAt || callbackInfo.lastCallbackInvokedAt
    const shouldShowCountdown =
      !callbackInfo.isCallbackActive && hasCallbackHistory && callbackInfo.reactivateAfter > 0

    if (shouldShowCountdown) {
      this.startCountdown()
    } else {
      this.clearCountdown()
    }
  }

  private startCountdown() {
    this.clearCountdown()

    const callbackInfo = this.elementData?.callbackInfo
    if (!callbackInfo) {
      return
    }

    this.isCountdownActive = true

    if (callbackInfo.reactivateAfter === Infinity) {
      this.remainingTime = Infinity
      return
    }

    const reactivateAfter = callbackInfo.reactivateAfter
    const startTime = callbackInfo.lastCallbackCompletedAt || callbackInfo.lastCallbackInvokedAt

    if (!startTime) {
      // No callback has been invoked yet, don't show countdown
      this.clearCountdown()
      return
    }

    this.startTime = startTime

    const updateCountdown = () => {
      const elapsed = Date.now() - this.startTime
      const remaining = Math.max(0, reactivateAfter - elapsed)

      this.remainingTime = remaining
      this.requestUpdate()

      if (remaining <= 0 || this.elementData.callbackInfo.isCallbackActive) {
        this.clearCountdown()
      }
    }

    updateCountdown()

    if (this.remainingTime > 0) {
      this.intervalId = window.setInterval(updateCountdown, 100)
    }
  }

  private clearCountdown() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isCountdownActive = false
    this.remainingTime = 0
  }

  private handleTimerClick = (e: MouseEvent) => {
    e.stopPropagation()
    ForesightManager.instance.reactivate(this.elementData.element)
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
    if (!this.isCountdownActive) {
      return html``
    }

    if (this.remainingTime === Infinity) {
      return html`
        <button
          class="reactivate-button"
          @click="${this.handleTimerClick}"
          title="Click to reactivate manually"
        >
          <span class="countdown-time infinity">∞</span>
        </button>
      `
    }

    if (this.remainingTime <= 0) {
      return html``
    }

    return html`
      <button
        class="reactivate-button"
        @click="${this.handleTimerClick}"
        title="Click to reactivate immediately"
      >
        <span class="countdown-time clickable">${this.formatTime(this.remainingTime)}</span>
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reactivate-countdown": ReactivateCountdown
  }
}
