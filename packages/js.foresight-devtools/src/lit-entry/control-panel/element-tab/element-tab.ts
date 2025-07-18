import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"
import { map } from "lit/directives/map.js"

import type {
  CallbackCompletedEvent,
  CallbackHits,
  CallbackHitType,
  CallbackInvokedEvent,
  ElementDataUpdatedEvent,
  ElementReactivatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
} from "js.foresight"
import { ForesightManager, type ForesightElement, type ForesightElementData } from "js.foresight"
import { DOCUMENT_SVG, INSERTION_SVG, VISIBILITY_SVG } from "../../../svg/svg-icons"
import type { SortElementList } from "../../../types/types"
import { ForesightDevtools } from "../../foresight-devtools"
import "../base-tab/chip"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../dropdown/single-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import "../element-tab/single-element"

@customElement("element-tab")
export class ElementTab extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chips-container {
      display: flex;
      gap: 8px;
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
  private activeElementCallbacksCount: number = 0
  @state()
  private totalElementsCount: number = 0

  @state() private sortDropdown: DropdownOption[]
  @state() private sortOrder: SortElementList
  @state() private elementListItems: Map<
    ForesightElement,
    ForesightElementData & { elementId: string }
  > = new Map()
  @state() private noContentMessage: string = "No Elements Registered To The Foresight Manager"
  @state() private runningCallbacks: Set<ForesightElement> = new Set()
  @state() private expandedElementIds: Set<string> = new Set()
  private elementIdCounter: number = 0
  private _abortController: AbortController | null = null

  constructor() {
    super()
    this.sortOrder = ForesightDevtools.instance.devtoolsSettings.sortElementList
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

  private generateElementId(): string {
    return (++this.elementIdCounter).toString()
  }

  private handleElementToggle = (elementId: string): void => {
    const newExpandedElementIds = new Set(this.expandedElementIds)
    if (newExpandedElementIds.has(elementId)) {
      newExpandedElementIds.delete(elementId)
    } else {
      newExpandedElementIds.add(elementId)
    }
    this.expandedElementIds = newExpandedElementIds
  }

  private updateActiveCallbackCount() {
    let activeCount = 0
    this.elementListItems.forEach(data => {
      if (data.callbackInfo.isCallbackActive) {
        activeCount++
      }
    })
    this.activeElementCallbacksCount = activeCount
  }
  private updateVisibilityCounts() {
    let visibleCount = 0
    this.elementListItems.forEach(data => {
      if (data.isIntersectingWithViewport) {
        visibleCount++
      }
    })
    const totalCount = this.elementListItems.size
    this.visibleElementsCount = visibleCount
    this.totalElementsCount = totalCount

    this.dispatchEvent(
      new CustomEvent("visibility-count-updated", {
        detail: { visibleCount, totalCount },
        bubbles: true,
        composed: true,
      })
    )
  }

  private _generateHitsChipTitle(hitCounts: CallbackHits): string {
    const lines: string[] = []

    lines.push(`Total Hits: ${hitCounts.total}`)
    lines.push("")

    lines.push(`Mouse: Trajectory: ${hitCounts.mouse.trajectory}, Hover: ${hitCounts.mouse.hover}`)
    lines.push(
      `Scroll: Up: ${hitCounts.scroll.up}, Down: ${hitCounts.scroll.down}, Left: ${hitCounts.scroll.left}, Right: ${hitCounts.scroll.right}`
    )
    lines.push(`Tab: Forwards: ${hitCounts.tab.forwards}, Reverse: ${hitCounts.tab.reverse}`)

    return lines.join("\n")
  }

  connectedCallback() {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController
    this.updateElementListFromManager()
    this.updateVisibilityCounts()

    ForesightManager.instance.addEventListener(
      "elementRegistered",
      (e: ElementRegisteredEvent) => {
        const elementWithId = {
          ...e.elementData,
          elementId: this.generateElementId(),
        }

        this.elementListItems.set(e.elementData.element, elementWithId)
        this.updateVisibilityCounts()
        this.updateActiveCallbackCount()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementDataUpdated",
      (e: ElementDataUpdatedEvent) => {
        const existingElementData = this.elementListItems.get(e.elementData.element)
        if (existingElementData) {
          const updatedElementWithId = {
            ...e.elementData,
            elementId: existingElementData.elementId,
          }
          this.elementListItems.set(e.elementData.element, updatedElementWithId)
          this.updateVisibilityCounts()
          this.requestUpdate()
        }
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementReactivated",
      (e: ElementReactivatedEvent) => {
        const existingElementData = this.elementListItems.get(e.elementData.element)
        if (existingElementData) {
          const updatedElementWithId = {
            ...e.elementData,
            elementId: existingElementData.elementId,
          }
          this.elementListItems.set(e.elementData.element, updatedElementWithId)
          this.requestUpdate()
          this.updateActiveCallbackCount()
        }
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      (e: ElementUnregisteredEvent) => {
        this.elementListItems.delete(e.elementData.element)
        this.updateVisibilityCounts()
        this.updateActiveCallbackCount()
        if (!this.elementListItems.size) {
          this.noContentMessage = "No Elements Registered To The Foresight Manager"
        }
        this.requestUpdate()
        this.runningCallbacks.delete(e.elementData.element)
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "callbackInvoked",
      (e: CallbackInvokedEvent) => {
        this.runningCallbacks.add(e.elementData.element)

        this.requestUpdate()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "callbackCompleted",
      (e: CallbackCompletedEvent) => {
        this.updateActiveCallbackCount()
        this.handleCallbackCompleted(e.hitType)
        this.runningCallbacks.delete(e.elementData.element)
      },
      { signal }
    )
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
  }

  private updateElementListFromManager() {
    const elementsWithIds = new Map<
      ForesightElement,
      ForesightElementData & { elementId: string }
    >()
    ForesightManager.instance.registeredElements.forEach((elementData, element) => {
      elementsWithIds.set(element, {
        ...elementData,
        elementId: this.generateElementId(),
      })
    })
    this.elementListItems = elementsWithIds
  }

  private handleCallbackCompleted(hitType: CallbackHitType) {
    // Direct mutation is more efficient than object spreading
    switch (hitType.kind) {
      case "mouse":
        this.hitCount.mouse[hitType.subType]++
        break
      case "tab":
        this.hitCount.tab[hitType.subType]++
        break
      case "scroll":
        this.hitCount.scroll[hitType.subType]++
        break
      default:
        hitType satisfies never
    }

    this.hitCount.total++

    // Trigger LIT's reactive update
    this.requestUpdate()
  }

  private getSortedElements(): (ForesightElementData & { elementId: string })[] {
    const elementsData = Array.from(this.elementListItems.values())

    switch (this.sortOrder) {
      case "insertionOrder":
        return elementsData
      case "documentOrder":
        return elementsData.sort(this.sortByDocumentPosition)
      case "visibility":
        return elementsData.sort(
          (
            a: ForesightElementData & { elementId: string },
            b: ForesightElementData & { elementId: string }
          ) => {
            if (a.isIntersectingWithViewport !== b.isIntersectingWithViewport) {
              return a.isIntersectingWithViewport ? -1 : 1
            }
            return this.sortByDocumentPosition(a, b)
          }
        )
      default:
        this.sortOrder satisfies never
        return elementsData
    }
  }

  private sortByDocumentPosition = (
    a: ForesightElementData & { elementId: string },
    b: ForesightElementData & { elementId: string }
  ) => {
    const position = a.element.compareDocumentPosition(b.element)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
  }

  render() {
    return html`
      <tab-header>
        <div slot="chips" class="chips-container">
          <chip-element title="Number of visible registered elements / total registered elements">
            ${this.visibleElementsCount}/${this.totalElementsCount} visible
          </chip-element>
          <chip-element title="Number of elements with running callbacks / total elements">
            ${this.runningCallbacks.size}/${this.totalElementsCount} running
          </chip-element>
          <chip-element title="Number of elements with active callbacks / total elements">
            ${this.activeElementCallbacksCount}/${this.totalElementsCount} active
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
        ${map(this.getSortedElements(), elementData => {
          return html`
            <single-element
              .elementData=${elementData}
              .isActive=${this.runningCallbacks.has(elementData.element)}
              .isExpanded=${this.expandedElementIds.has(elementData.elementId)}
              .onToggle=${this.handleElementToggle}
            ></single-element>
          `
        })}
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-tab": ElementTab
  }
}
