import { LitElement, html, css, type PropertyValues } from "lit"
import { customElement, state, query, property } from "lit/decorators.js"
import {
  type ForesightElement,
  type ForesightElementState,
  type CallbackHitType,
  ForesightManager,
} from "js.foresight"
import type {
  CallbackCompletedEvent,
  CallbackInvokedEvent,
  ElementDataUpdatedEvent,
  ElementReactivatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
} from "js.foresight"
interface ElementOverlay {
  expandedOverlay: HTMLElement
  nameLabel: HTMLElement
}

interface CallbackAnimation {
  element: ForesightElement
  timeoutId: ReturnType<typeof setTimeout>
}

@customElement("element-overlays")
export class ElementOverlays extends LitElement {
  @state() private overlayMap: Map<ForesightElement, ElementOverlay> = new Map()
  @state() private callbackAnimations: Map<ForesightElement, CallbackAnimation> = new Map()
  @query("#overlays-container") private containerElement!: HTMLElement

  @property({ type: Boolean }) showNameTags = true

  static styles = [
    css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      }

      :host([hidden]) {
        display: none;
      }

      .expanded-overlay {
        position: absolute;
        will-change: transform, box-shadow;
        border: 1px dashed rgba(100, 116, 139, 0.4);
        background-color: rgba(100, 116, 139, 0.05);
        transition:
          border-color 0.2s ease,
          background-color 0.2s ease;
      }

      .expanded-overlay.invoked-by-scroll {
        --glow-color-rgb: 234, 179, 8;
        border-color: #eab308;
        background-color: rgba(var(--glow-color-rgb), 0.1);
        animation: callback-glow 2s ease-in-out infinite;
      }

      .expanded-overlay.invoked-by-mouse {
        --glow-color-rgb: 59, 130, 246;
        border-color: #3b82f6;
        background-color: rgba(var(--glow-color-rgb), 0.1);
        animation: callback-glow 2s ease-in-out infinite;
      }

      .expanded-overlay.invoked-by-tab {
        --glow-color-rgb: 249, 115, 22;
        border-color: #f97316;
        background-color: rgba(var(--glow-color-rgb), 0.1);
        animation: callback-glow 2s ease-in-out infinite;
      }
      @keyframes callback-glow {
        0% {
          box-shadow: 0 0 5px 2px rgba(var(--glow-color-rgb), 0.3);
        }
        50% {
          box-shadow: 0 0 15px 4px rgba(var(--glow-color-rgb), 0.6);
        }
        100% {
          box-shadow: 0 0 5px 2px rgba(var(--glow-color-rgb), 0.3);
        }
      }

      .name-label {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform;
        background-color: rgba(27, 31, 35, 0.85);
        backdrop-filter: blur(4px);
        color: white;
        padding: 4px 8px;
        font-size: 11px;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif,
          "Apple Color Emoji", "Segoe UI Emoji";
        z-index: 10001;
        white-space: nowrap;
        pointer-events: none;
      }
    `,
  ]

  private _abortController: AbortController | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController
    ForesightManager.instance.addEventListener(
      "elementRegistered",
      (e: ElementRegisteredEvent) => {
        if (e.state.isIntersectingWithViewport) {
          this.createOrUpdateElementOverlay(e.element, e.state)
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      (e: ElementUnregisteredEvent) => {
        this.removeElementOverlay(e.element)
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementReactivated",
      (e: ElementReactivatedEvent) => {
        if (e.state.isIntersectingWithViewport) {
          this.createOrUpdateElementOverlay(e.element, e.state)
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementDataUpdated",
      (e: ElementDataUpdatedEvent) => {
        if (e.updatedProps.includes("bounds") && e.state.isActive) {
          this.createOrUpdateElementOverlay(e.element, e.state)
        }
        if (e.updatedProps.includes("visibility")) {
          if (!e.state.isIntersectingWithViewport) {
            this.removeElementOverlay(e.element)
          }
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "callbackInvoked",
      (e: CallbackInvokedEvent) => {
        this.highlightElementCallback(e.element, e.hitType)
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "callbackCompleted",
      (e: CallbackCompletedEvent) => {
        this.unhighlightElementCallback(e.element)
        this.removeElementOverlay(e.element)
      },
      { signal }
    )
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("showNameTags")) {
      this.updateNameTagVisibility(this.showNameTags)
    }
  }

  private createElementOverlays(element: ForesightElement): ElementOverlay {
    const expandedOverlay = document.createElement("div")
    expandedOverlay.className = "expanded-overlay"
    const nameLabel = document.createElement("div")
    nameLabel.className = "name-label"
    this.containerElement.appendChild(expandedOverlay)
    this.containerElement.appendChild(nameLabel)
    const overlays = { expandedOverlay, nameLabel }
    this.overlayMap.set(element, overlays)
    return overlays
  }

  private updateElementOverlays(overlays: ElementOverlay, state: ForesightElementState) {
    const { expandedOverlay, nameLabel } = overlays
    const { expandedRect } = state.elementBounds

    const expandedWidth = expandedRect.right - expandedRect.left
    const expandedHeight = expandedRect.bottom - expandedRect.top
    expandedOverlay.style.width = `${expandedWidth}px`
    expandedOverlay.style.height = `${expandedHeight}px`
    expandedOverlay.style.transform = `translate3d(${expandedRect.left}px, ${expandedRect.top}px, 0)`

    if (!this.showNameTags) {
      nameLabel.style.display = "none"
    } else {
      nameLabel.textContent = state.name
      nameLabel.style.display = "block"
      nameLabel.style.transform = `translate3d(${expandedRect.left}px, ${
        expandedRect.top - 25
      }px, 0)`
    }
  }

  private createOrUpdateElementOverlay(element: ForesightElement, state: ForesightElementState) {
    let overlays = this.overlayMap.get(element)
    if (!overlays) {
      overlays = this.createElementOverlays(element)
    }
    this.updateElementOverlays(overlays, state)
  }

  private removeElementOverlay(element: ForesightElement) {
    const overlays = this.overlayMap.get(element)
    if (overlays) {
      overlays.expandedOverlay.remove()
      overlays.nameLabel.remove()
      this.overlayMap.delete(element)
    }

    this.clearCallbackAnimationTimeout(element)
  }

  private clearCallbackAnimationTimeout(element: ForesightElement) {
    const existingAnimation = this.callbackAnimations.get(element)
    if (existingAnimation) {
      clearTimeout(existingAnimation.timeoutId)
      this.callbackAnimations.delete(element)
    }
  }

  private highlightElementCallback(element: ForesightElement, hitType: CallbackHitType) {
    const overlays = this.overlayMap.get(element)
    if (!overlays) {
      return
    }
    this.clearCallbackAnimationTimeout(element)

    switch (hitType.kind) {
      case "mouse":
        overlays.expandedOverlay.classList.add("invoked-by-mouse")
        break
      case "scroll":
        overlays.expandedOverlay.classList.add("invoked-by-scroll")
        break
      case "tab":
        overlays.expandedOverlay.classList.add("invoked-by-tab")
        break
      case "touch":
        break
      case "viewport":
        break
      default:
        hitType satisfies never
    }
  }

  private unhighlightElementCallback(element: ForesightElement) {
    const overlays = this.overlayMap.get(element)
    if (!overlays) {
      return
    }
    const animationDelay = setTimeout(() => {
      overlays.expandedOverlay.classList.remove("callback-invoked")
      this.callbackAnimations.delete(element)
    }, 400)

    this.callbackAnimations.set(element, {
      element,
      timeoutId: animationDelay,
    })
  }

  public updateNameTagVisibility(showNameTags: boolean) {
    this.overlayMap.forEach(overlays => {
      const nameLabel = overlays.nameLabel
      if (!showNameTags) {
        nameLabel.style.display = "none"
      } else {
        nameLabel.style.display = "block"
      }
    })
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.callbackAnimations.forEach(animation => {
      clearTimeout(animation.timeoutId)
    })
    this.callbackAnimations.clear()
    this.overlayMap.clear()
    this._abortController?.abort()
    this._abortController = null
  }

  render() {
    return html` <div id="overlays-container"></div> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-overlays": ElementOverlays
  }
}
