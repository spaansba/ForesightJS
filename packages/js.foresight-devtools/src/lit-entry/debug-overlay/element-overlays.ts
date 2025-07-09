import { LitElement, html, css } from "lit"
import { customElement, state } from "lit/decorators.js"
import type { ForesightElementData, ForesightElement, CallbackHitType } from "js.foresight"
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
  private containerElement!: HTMLElement

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
        top: 0;
        left: 0;
        will-change: transform;
        border: 1px dashed rgba(100, 116, 139, 0.4);
        background-color: rgba(100, 116, 139, 0.05);
        box-sizing: border-box;
        border-radius: 8px;
        transition: border-color 0.2s ease, background-color 0.2s ease;
      }

      .expanded-overlay.invoked-by-scroll {
        --glow-color-rgb: 34, 197, 94;
        border-color: #22c55e;
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
        border-radius: 4px;
        z-index: 10001;
        white-space: nowrap;
        pointer-events: none;
      }
    `,
  ]

  firstUpdated() {
    this.containerElement = this.shadowRoot!.querySelector("#overlays-container")! as HTMLElement
  }

  private createElementOverlays(elementData: ForesightElementData): ElementOverlay {
    const expandedOverlay = document.createElement("div")
    expandedOverlay.className = "expanded-overlay"
    expandedOverlay.setAttribute("data-element-name", elementData.name || "")

    const nameLabel = document.createElement("div")
    nameLabel.className = "name-label"

    this.containerElement.appendChild(expandedOverlay)
    this.containerElement.appendChild(nameLabel)

    const overlays = { expandedOverlay, nameLabel }
    this.overlayMap.set(elementData.element, overlays)
    return overlays
  }

  private updateElementOverlays(
    overlays: ElementOverlay,
    elementData: ForesightElementData,
    showNameTags: boolean
  ) {
    const { expandedOverlay, nameLabel } = overlays
    const { expandedRect } = elementData.elementBounds

    const expandedWidth = expandedRect.right - expandedRect.left
    const expandedHeight = expandedRect.bottom - expandedRect.top
    expandedOverlay.style.width = `${expandedWidth}px`
    expandedOverlay.style.height = `${expandedHeight}px`
    expandedOverlay.style.transform = `translate3d(${expandedRect.left}px, ${expandedRect.top}px, 0)`
    expandedOverlay.style.display = "block"

    nameLabel.textContent = elementData.name
    if (elementData.name === "" || !showNameTags) {
      nameLabel.style.display = "none"
    } else {
      nameLabel.style.display = "block"
      nameLabel.style.transform = `translate3d(${expandedRect.left}px, ${
        expandedRect.top - 25
      }px, 0)`
    }
  }

  public createOrUpdateElementOverlay(
    elementData: ForesightElementData,
    showNameTags: boolean = true
  ) {
    if (!this.containerElement) return

    let overlays = this.overlayMap.get(elementData.element)
    if (!overlays) {
      overlays = this.createElementOverlays(elementData)
    }
    this.updateElementOverlays(overlays, elementData, showNameTags)
  }

  public removeElementOverlay(elementData: ForesightElementData) {
    const overlays = this.overlayMap.get(elementData.element)
    if (overlays) {
      overlays.expandedOverlay.remove()
      overlays.nameLabel.remove()
      this.overlayMap.delete(elementData.element)
    }

    // Clean up any pending animation
    const existingAnimation = this.callbackAnimations.get(elementData.element)
    if (existingAnimation) {
      clearTimeout(existingAnimation.timeoutId)
      this.callbackAnimations.delete(elementData.element)
    }
  }

  public highlightElementCallback(elementData: ForesightElementData, hitType: CallbackHitType) {
    const overlays = this.overlayMap.get(elementData.element)
    if (overlays) {
      // Clear any existing animation timeout
      const existingAnimation = this.callbackAnimations.get(elementData.element)
      if (existingAnimation) {
        clearTimeout(existingAnimation.timeoutId)
        this.callbackAnimations.delete(elementData.element)
      }

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
  }

  public unhighlightElementCallback(elementData: ForesightElementData) {
    const overlays = this.overlayMap.get(elementData.element)
    if (overlays) {
      // Ensure minimum animation duration of 400ms
      const animationDelay = setTimeout(() => {
        overlays.expandedOverlay.classList.remove("callback-invoked")
        this.callbackAnimations.delete(elementData.element)
      }, 400)

      this.callbackAnimations.set(elementData.element, {
        element: elementData.element,
        timeoutId: animationDelay,
      })
    }
  }

  public updateNameTagVisibility(showNameTags: boolean) {
    // Update all existing overlays with new name tag visibility
    this.overlayMap.forEach((overlays, element) => {
      const elementData = {
        element,
        name: overlays.nameLabel.textContent || "",
      } as ForesightElementData
      // We need the element bounds, but since this is just for name tag visibility,
      // we can skip the full update and just handle the name label
      const nameLabel = overlays.nameLabel
      if (elementData.name === "" || !showNameTags) {
        nameLabel.style.display = "none"
      } else {
        nameLabel.style.display = "block"
      }
    })
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
