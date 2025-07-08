import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"
import { map } from "lit/directives/map.js"

import "../base-tab/tab-header"
import "../base-tab/tab-content"
import "../dropdown/single-select-dropdown"
import "../base-tab/chip"
import "../element-tab/single-element"
import type { SortElementList } from "packages/js.foresight-devtools/src/types/types"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import { ForesightManager, type ForesightElement, type ForesightElementData } from "js.foresight"
import type {
  CallbackCompletedEvent,
  CallbackInvokedEvent,
  ElementDataUpdatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
} from "packages/js.foresight/dist"
import type { CallbackHits, CallbackHitType } from "js.foresight/types/types"

import { DOCUMENT_SVG, INSERTION_SVG, VISIBILITY_SVG } from "../../../svg/svg-icons"

@customElement("element-tab")
export class ElementTab extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .element-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px;
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
  `

  @state()
  private hitCount: CallbackHits = {
    mouse: { hover: 0, trajectory: 0 },
    scroll: { down: 0, left: 0, right: 0, up: 0 },
    tab: { forwards: 0, reverse: 0 },
    total: 0,
  }

  @state()
  private visibleElementsCount: number = 0

  @state()
  private totalElementsCount: number = 0

  @state() private sortDropdown: DropdownOption[]
  @state() private sortOrder: SortElementList = "visibility"
  @state() private elementListItems: Map<ForesightElement, ForesightElementData> = new Map()
  @state() private noContentMessage: string = "No Elements Registered To The Foresight Manager"
  @state() private activeCallbacks: Set<ForesightElement> = new Set()

  private _abortController: AbortController | null = null

  constructor() {
    super()
    this.sortDropdown = [
      {
        value: "visibility",
        label: "Visibility",
        title: "Sort by Visibility",
        icon: VISIBILITY_SVG,
      },
      {
        value: "documentOrder",
        label: "Document Order",
        title: "Sort by Document Order",
        icon: DOCUMENT_SVG,
      },
      {
        value: "insertionOrder",
        label: "Insertion Order",
        title: "Sort by Insertion Order",
        icon: INSERTION_SVG,
      },
    ]
  }

  private handleSortChange = (value: string): void => {
    this.sortOrder = value as SortElementList
  }

  // Updates the individual state properties for visibility
  private updateVisibilityCounts() {
    let visibleCount = 0
    let totalCount = 0
    this.elementListItems.forEach(data => {
      totalCount++
      if (data.isIntersectingWithViewport) {
        visibleCount++
      }
    })
    this.visibleElementsCount = visibleCount
    this.totalElementsCount = totalCount

    // Dispatch event to update control panel title
    this.dispatchEvent(
      new CustomEvent("visibility-count-updated", {
        detail: { visibleCount, totalCount },
        bubbles: true,
        composed: true,
      })
    )
  }

  /**
   * Generates a nicely formatted title string for the "hits" chip, always showing all categories.
   * @param hitCounts The current CallbackHits object.
   * @returns A multi-line string for the chip's title.
   */
  private _generateHitsChipTitle(hitCounts: CallbackHits): string {
    const lines: string[] = []

    lines.push(`Total Hits: ${hitCounts.total}`)
    lines.push("") // Add a blank line for separation

    lines.push(`Mouse: Trajectory: ${hitCounts.mouse.trajectory}, Hover: ${hitCounts.mouse.hover}`)
    lines.push(
      `Scroll: Up: ${hitCounts.scroll.up}, Down: ${hitCounts.scroll.down}, Left: ${hitCounts.scroll.left}, Right: ${hitCounts.scroll.right}`
    )
    lines.push(`Tab: Forwards: ${hitCounts.tab.forwards}, Reverse: ${hitCounts.tab.reverse}`)

    return lines.join("\n")
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController

    this.updateElementListFromManager() // Populate initial list
    this.updateVisibilityCounts() // Initial update for visibility counts

    ForesightManager.instance.addEventListener(
      "elementRegistered",
      (e: ElementRegisteredEvent) => {
        this.elementListItems.set(e.elementData.element, e.elementData)
        this.updateVisibilityCounts() // Update counts
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementDataUpdated",
      (e: ElementDataUpdatedEvent) => {
        this.elementListItems = new Map(
          this.elementListItems.set(e.elementData.element, e.elementData)
        )
        this.updateVisibilityCounts()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      (e: ElementUnregisteredEvent) => {
        this.elementListItems.delete(e.elementData.element)
        // Create a new map to trigger Lit update for the map itself
        this.elementListItems = new Map(this.elementListItems)
        this.updateVisibilityCounts() // Update counts
        if (!this.elementListItems.size) {
          this.noContentMessage = "No Elements Registered To The Foresight Manager"
        }
        this.activeCallbacks.delete(e.elementData.element)
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "callbackInvoked",
      (e: CallbackInvokedEvent) => {
        this.activeCallbacks.add(e.elementData.element)
        this.requestUpdate()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "callbackCompleted",
      (e: CallbackCompletedEvent) => {
        this.handleCallbackCompleted(e.hitType)
        this.activeCallbacks.delete(e.elementData.element)
      },
      { signal }
    )
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
  }

  private updateElementListFromManager() {
    this.elementListItems = new Map(ForesightManager.instance.registeredElements)
  }

  private handleCallbackCompleted(hitType: CallbackHitType) {
    const newHitCount = {
      ...this.hitCount,
      mouse: { ...this.hitCount.mouse },
      scroll: { ...this.hitCount.scroll },
      tab: { ...this.hitCount.tab },
    }

    switch (hitType.kind) {
      case "mouse":
        newHitCount.mouse[hitType.subType]++
        break
      case "tab":
        newHitCount.tab[hitType.subType]++
        break
      case "scroll":
        newHitCount.scroll[hitType.subType]++
        break
      default:
        hitType satisfies never
    }

    newHitCount.total++

    this.hitCount = newHitCount // Lit will detect this change and re-render
  }

  private getSortedElements(): ForesightElementData[] {
    const elementsData = Array.from(this.elementListItems.values())

    switch (this.sortOrder) {
      case "insertionOrder":
        return elementsData
      case "documentOrder":
        return elementsData.sort(this.sortByDocumentPosition)
      case "visibility":
        return elementsData.sort((a: ForesightElementData, b: ForesightElementData) => {
          if (a.isIntersectingWithViewport !== b.isIntersectingWithViewport) {
            return a.isIntersectingWithViewport ? -1 : 1
          }
          return this.sortByDocumentPosition(a, b)
        })
      default:
        this.sortOrder satisfies never
        return elementsData
    }
  }

  private sortByDocumentPosition = (a: ForesightElementData, b: ForesightElementData) => {
    const position = a.element.compareDocumentPosition(b.element)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
  }

  render() {
    return html`
      <tab-header>
        <div slot="chips">
          <chip-element title="Number of visible registered elements / total registered elements">
            ${this.visibleElementsCount}/${this.totalElementsCount} visible
          </chip-element>
          <chip-element title="${this._generateHitsChipTitle(this.hitCount)}">
            ${this.hitCount.total} hits
          </chip-element>
        </div>
        <div slot="actions">
          <single-select-dropdown
            .dropdownOptions="${this.sortDropdown}"
            .selectedOptionValue="${this.sortOrder}"
            .onSelectionChange="${this.handleSortChange}"
          ></single-select-dropdown>
        </div>
      </tab-header>
      <tab-content
        .noContentMessage=${this.noContentMessage}
        .hasContent=${!!this.elementListItems.size}
      >
        <div class="element-list">
          ${map(
            this.getSortedElements(),
            elementData => html`
              <single-element 
                .elementData=${elementData}
                .isActive=${this.activeCallbacks.has(elementData.element)}
              ></single-element>
            `
          )}
        </div>
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-tab": ElementTab
  }
}
