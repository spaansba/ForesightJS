import { LitElement, html, css } from "lit"
import { customElement, state } from "lit/decorators.js"
import { styleMap } from "lit/directives/style-map.js"
import { map } from "lit/directives/map.js"
import {
  type ForesightElementData,
  type ForesightElement,
  type CallbackHitType,
  ForesightManager,
  type ElementUnregisteredEvent,
} from "js.foresight"
import type {
  CallbackCompletedEvent,
  CallbackInvokedEvent,
  ElementDataUpdatedEvent,
  ElementRegisteredEvent,
} from "js.foresight"

interface ElementOverlayData {
  elementData: ForesightElementData
  expandedStyles: { [key: string]: string }
  nameLabelStyles: { [key: string]: string }
  callbackClasses: string[]
  showNameTag: boolean
}

interface CallbackAnimation {
  element: ForesightElement
  timeoutId: ReturnType<typeof setTimeout>
}

@customElement("element-overlays")
export class ElementOverlays extends LitElement {
  @state() private overlayDataMap: Map<ForesightElement, ElementOverlayData> = new Map()
  @state() private callbackAnimations: Map<ForesightElement, CallbackAnimation> = new Map()
  @state() private showNameTags: boolean = false

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
      "elementDataUpdated",
      (e: ElementDataUpdatedEvent) => {
        if (e.updatedProps.includes("bounds")) {
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

  private createOrUpdateElementOverlay(elementData: ForesightElementData) {
    const { expandedRect } = elementData.elementBounds
    const expandedWidth = expandedRect.right - expandedRect.left
    const expandedHeight = expandedRect.bottom - expandedRect.top

    const overlayData: ElementOverlayData = {
      elementData,
      expandedStyles: {
        width: `${expandedWidth}px`,
        height: `${expandedHeight}px`,
        transform: `translate3d(${expandedRect.left}px, ${expandedRect.top}px, 0)`,
      },
      nameLabelStyles: {
        transform: `translate3d(${expandedRect.left}px, ${expandedRect.top - 25}px, 0)`,
        display: this.showNameTags ? "block" : "none",
      },
      callbackClasses: [],
      showNameTag: this.showNameTags,
    }

    this.overlayDataMap.set(elementData.element, overlayData)
    this.requestUpdate()
  }

  private removeElementOverlay(elementData: ForesightElementData) {
    this.overlayDataMap.delete(elementData.element)
    this.clearCallbackAnimationTimeout(elementData.element)
    this.requestUpdate()
  }

  private clearCallbackAnimationTimeout(element: ForesightElement) {
    const existingAnimation = this.callbackAnimations.get(element)
    if (existingAnimation) {
      clearTimeout(existingAnimation.timeoutId)
      this.callbackAnimations.delete(element)
    }
  }

  private highlightElementCallback(elementData: ForesightElementData, hitType: CallbackHitType) {
    const overlayData = this.overlayDataMap.get(elementData.element)
    if (overlayData) {
      this.clearCallbackAnimationTimeout(elementData.element)

      const callbackClass = `invoked-by-${hitType.kind}`
      if (!overlayData.callbackClasses.includes(callbackClass)) {
        overlayData.callbackClasses.push(callbackClass)
      }
      this.requestUpdate()
    }
  }

  private unhighlightElementCallback(elementData: ForesightElementData) {
    const overlayData = this.overlayDataMap.get(elementData.element)
    if (overlayData) {
      const animationDelay = setTimeout(() => {
        overlayData.callbackClasses = []
        this.callbackAnimations.delete(elementData.element)
        this.requestUpdate()
      }, 400)

      this.callbackAnimations.set(elementData.element, {
        element: elementData.element,
        timeoutId: animationDelay,
      })
    }
  }

  public updateNameTagVisibility(showNameTags: boolean) {
    this.showNameTags = showNameTags
    this.overlayDataMap.forEach(overlayData => {
      overlayData.showNameTag = showNameTags
      overlayData.nameLabelStyles.display = showNameTags ? "block" : "none"
    })
    this.requestUpdate()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
    this.overlayDataMap.clear()
    this.callbackAnimations.forEach(animation => clearTimeout(animation.timeoutId))
    this.callbackAnimations.clear()
  }

  render() {
    return html`
      ${map(this.overlayDataMap.values(), overlayData => {
        const { elementData, expandedStyles, nameLabelStyles, callbackClasses, showNameTag } =
          overlayData
        const overlayClasses = ["expanded-overlay", ...callbackClasses].join(" ")

        return html`
          <div class="${overlayClasses}" style=${styleMap(expandedStyles)}></div>
          ${showNameTag
            ? html`
                <div class="name-label" style=${styleMap(nameLabelStyles)}>${elementData.name}</div>
              `
            : ""}
        `
      })}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-overlays": ElementOverlays
  }
}
