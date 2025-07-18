import { LitElement, html, css } from "lit"
import { customElement, state, query } from "lit/decorators.js"
import {
  type ForesightElementData,
  type ForesightElement,
  type CallbackHitType,
  ForesightManager,
} from "js.foresight"
import type {
  CallbackCompletedEvent,
  CallbackInvokedEvent,
  ElementDataUpdatedEvent,
  ElementRegisteredEvent,
} from "js.foresight"
import { ForesightDevtools } from "../foresight-devtools"
import type { ElementReactivatedEvent, ElementUnregisteredEvent } from "packages/js.foresight/dist"
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

      .expanded-overlay {
        position: absolute;
        will-change: transform, box-shadow;
        border: 1px dashed rgba(100, 116, 139, 0.4);
        background-color: rgba(100, 116, 139, 0.05);
        transition: border-color 0.2s ease, background-color 0.2s ease;
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
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
          sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
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
        if (e.elementData.isIntersectingWithViewport) {
          this.createOrUpdateElementOverlay(e.elementData)
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      (e: ElementUnregisteredEvent) => {
        this.removeElementOverlay(e.elementData)
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementReactivated",
      (e: ElementReactivatedEvent) => {
        if (e.elementData.isIntersectingWithViewport) {
          this.createOrUpdateElementOverlay(e.elementData)
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementDataUpdated",
      (e: ElementDataUpdatedEvent) => {
        if (e.updatedProps.includes("bounds") && e.elementData.callbackInfo.isCallbackActive) {
          this.createOrUpdateElementOverlay(e.elementData)
        }
        if (e.updatedProps.includes("visibility")) {
          if (!e.elementData.isIntersectingWithViewport) {
            this.removeElementOverlay(e.elementData)
          }
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "callbackInvoked",
      (e: CallbackInvokedEvent) => {
        this.highlightElementCallback(e.elementData, e.hitType)
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "callbackCompleted",
      (e: CallbackCompletedEvent) => {
        this.unhighlightElementCallback(e.elementData)
        this.removeElementOverlay(e.elementData)
      },
      { signal }
    )

    document.addEventListener(
      "showNameTagsChanged",
      (e: Event) => {
        const customEvent = e as CustomEvent<{ showNameTags: boolean }>
        this.updateNameTagVisibility(customEvent.detail.showNameTags)
      },
      { signal }
    )
  }

  private createElementOverlays(elementData: ForesightElementData): ElementOverlay {
    const expandedOverlay = document.createElement("div")
    expandedOverlay.className = "expanded-overlay"
    const nameLabel = document.createElement("div")
    nameLabel.className = "name-label"
    this.containerElement.appendChild(expandedOverlay)
    this.containerElement.appendChild(nameLabel)
    const overlays = { expandedOverlay, nameLabel }
    this.overlayMap.set(elementData.element, overlays)
    return overlays
  }

  private updateElementOverlays(overlays: ElementOverlay, elementData: ForesightElementData) {
    const { expandedOverlay, nameLabel } = overlays
    const { expandedRect } = elementData.elementBounds

    const expandedWidth = expandedRect.right - expandedRect.left
    const expandedHeight = expandedRect.bottom - expandedRect.top
    expandedOverlay.style.width = `${expandedWidth}px`
    expandedOverlay.style.height = `${expandedHeight}px`
    expandedOverlay.style.transform = `translate3d(${expandedRect.left}px, ${expandedRect.top}px, 0)`

    if (!ForesightDevtools.instance.devtoolsSettings.showNameTags) {
      nameLabel.style.display = "none"
    } else {
      nameLabel.textContent = elementData.name
      nameLabel.style.display = "block"
      nameLabel.style.transform = `translate3d(${expandedRect.left}px, ${
        expandedRect.top - 25
      }px, 0)`
    }
  }

  private createOrUpdateElementOverlay(elementData: ForesightElementData) {
    let overlays = this.overlayMap.get(elementData.element)
    if (!overlays) {
      overlays = this.createElementOverlays(elementData)
    }
    this.updateElementOverlays(overlays, elementData)
  }

  private removeElementOverlay(elementData: ForesightElementData) {
    const overlays = this.overlayMap.get(elementData.element)
    if (overlays) {
      overlays.expandedOverlay.remove()
      overlays.nameLabel.remove()
      this.overlayMap.delete(elementData.element)
    }

    this.clearCallbackAnimationTimeout(elementData.element)
  }

  private clearCallbackAnimationTimeout(element: ForesightElement) {
    const existingAnimation = this.callbackAnimations.get(element)
    if (existingAnimation) {
      clearTimeout(existingAnimation.timeoutId)
      this.callbackAnimations.delete(element)
    }
  }

  private highlightElementCallback(elementData: ForesightElementData, hitType: CallbackHitType) {
    const overlays = this.overlayMap.get(elementData.element)
    if (!overlays) {
      return
    }
    this.clearCallbackAnimationTimeout(elementData.element)

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
      default:
        hitType satisfies never
    }
  }

  private unhighlightElementCallback(elementData: ForesightElementData) {
    const overlays = this.overlayMap.get(elementData.element)
    if (!overlays) {
      return
    }
    const animationDelay = setTimeout(() => {
      overlays.expandedOverlay.classList.remove("callback-invoked")
      this.callbackAnimations.delete(elementData.element)
    }, 400)

    this.callbackAnimations.set(elementData.element, {
      element: elementData.element,
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
