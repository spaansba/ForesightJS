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
import "./reactivate-countdown"

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

    .element-section {
      margin-bottom: 16px;
    }

    .element-section:last-child {
      margin-bottom: 0;
    }

    .section-header {
      margin: 4px 0 4px 0;
      font-size: 12px;
      font-weight: 600;
    }

    .section-header.active {
      color: #e8e8e8;
    }

    .section-header.inactive {
      color: #999;
    }
  `

  @state()
  private hitCount: CallbackHits = {
    mouse: { hover: 0, trajectory: 0 },
    scroll: { down: 0, left: 0, right: 0, up: 0 },
    tab: { forwards: 0, reverse: 0 },
    touch: 0,
    viewport: 0,
    total: 0,
  }

  @state() private sortDropdown: DropdownOption[]
  @state() private sortOrder: SortElementList
  @state() private elementListItems: Map<ForesightElement, ForesightElementData> = new Map()
  @state() private noContentMessage: string = "No Elements Registered To The Foresight Manager"
  @state() private runningCallbacks: Set<ForesightElement> = new Set()
  @state() private expandedElementIds: Set<string> = new Set()
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

  private handleElementToggle = (elementId: string): void => {
    const newExpandedElementIds = new Set(this.expandedElementIds)
    if (newExpandedElementIds.has(elementId)) {
      newExpandedElementIds.delete(elementId)
    } else {
      newExpandedElementIds.add(elementId)
    }
    this.expandedElementIds = newExpandedElementIds
  }

  private _generateHitsChipTitle(hitCounts: CallbackHits): string {
    const lines: string[] = []

    // Header with total
    lines.push(`Total Callback Hits: ${hitCounts.total}`)
    lines.push("")

    // Desktop Strategy Section
    const mouseTotal = hitCounts.mouse.trajectory + hitCounts.mouse.hover
    const scrollTotal =
      hitCounts.scroll.up + hitCounts.scroll.down + hitCounts.scroll.left + hitCounts.scroll.right
    const tabTotal = hitCounts.tab.forwards + hitCounts.tab.reverse

    lines.push("Desktop Strategy")
    if (mouseTotal > 0) {
      lines.push(
        `   Mouse (${mouseTotal}): ${hitCounts.mouse.trajectory} trajectory, ${hitCounts.mouse.hover} hover`
      )
    } else {
      lines.push("   Mouse: No hits")
    }

    if (scrollTotal > 0) {
      lines.push(
        `   Scroll (${scrollTotal}): Up ${hitCounts.scroll.up}, Down ${hitCounts.scroll.down}, Left ${hitCounts.scroll.left}, Right ${hitCounts.scroll.right}`
      )
    } else {
      lines.push("   Scroll: No hits")
    }

    if (tabTotal > 0) {
      lines.push(
        `   Tab (${tabTotal}): ${hitCounts.tab.forwards} forward, ${hitCounts.tab.reverse} reverse`
      )
    } else {
      lines.push("   Tab: No hits")
    }

    lines.push("")

    // Touch Strategy Section
    const touchStrategyTotal = hitCounts.touch + hitCounts.viewport
    lines.push("Touch Strategy")
    if (hitCounts.touch > 0) {
      lines.push(`   Touch Start: ${hitCounts.touch}`)
    } else {
      lines.push("   Touch Start: No hits")
    }

    if (hitCounts.viewport > 0) {
      lines.push(`   Viewport Enter: ${hitCounts.viewport}`)
    } else {
      lines.push("   Viewport Enter: No hits")
    }

    if (touchStrategyTotal === 0 && mouseTotal + scrollTotal + tabTotal === 0) {
      lines.push("")
      lines.push("Interact with registered elements to see callback statistics")
    }

    return lines.join("\n")
  }

  connectedCallback() {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController
    this.updateElementListFromManager()

    ForesightManager.instance.addEventListener(
      "elementRegistered",
      (e: ElementRegisteredEvent) => {
        this.elementListItems.set(e.elementData.element, e.elementData)
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementDataUpdated",
      (e: ElementDataUpdatedEvent) => {
        const existingElementData = this.elementListItems.get(e.elementData.element)
        if (existingElementData) {
          this.elementListItems.set(e.elementData.element, e.elementData)
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
          this.elementListItems.set(e.elementData.element, e.elementData)
          this.requestUpdate()
        }
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      (e: ElementUnregisteredEvent) => {
        this.elementListItems.delete(e.elementData.element)
        if (!this.elementListItems.size) {
          this.noContentMessage = "No Elements Registered To The Foresight Manager"
        }
        this.runningCallbacks.delete(e.elementData.element)
        this.requestUpdate()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "callbackInvoked",
      (e: CallbackInvokedEvent) => {
        const existingElementData = this.elementListItems.get(e.elementData.element)
        if (existingElementData) {
          this.elementListItems.set(e.elementData.element, e.elementData)
        }
        this.runningCallbacks.add(e.elementData.element)
        this.requestUpdate()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "callbackCompleted",
      (e: CallbackCompletedEvent) => {
        const existingElementData = this.elementListItems.get(e.elementData.element)
        if (existingElementData) {
          this.elementListItems.set(e.elementData.element, e.elementData)
        }
        this.handleCallbackCompleted(e.hitType)
        this.runningCallbacks.delete(e.elementData.element)
        this.requestUpdate()
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
    this.elementListItems = new Map(ForesightManager.instance.registeredElements)
  }

  private handleCallbackCompleted(hitType: CallbackHitType) {
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
      case "touch":
        this.hitCount.touch++
        break
      case "viewport":
        this.hitCount.viewport++
        break
      default:
        hitType satisfies never
    }

    this.hitCount.total++
    this.requestUpdate()
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

  private getActiveElements(): ForesightElementData[] {
    return this.getSortedElements().filter(data => data.callbackInfo.isCallbackActive)
  }

  private getInactiveElements(): ForesightElementData[] {
    return this.getSortedElements().filter(data => !data.callbackInfo.isCallbackActive)
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
        <div slot="chips" class="chips-container">
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
        ${this.getActiveElements().length > 0
          ? html`
              <div class="element-section">
                <h3 class="section-header active">
                  Active Elements (${this.getActiveElements().length})
                </h3>
                ${map(this.getActiveElements(), elementData => {
                  return html`
                    <single-element
                      .elementData=${elementData}
                      .isActive=${this.runningCallbacks.has(elementData.element)}
                      .isExpanded=${this.expandedElementIds.has(elementData.id)}
                      .onToggle=${this.handleElementToggle}
                    >
                    </single-element>
                  `
                })}
              </div>
            `
          : ""}
        ${this.getInactiveElements().length > 0
          ? html`
              <div class="element-section">
                <h3 class="section-header inactive">
                  Inactive Elements (${this.getInactiveElements().length})
                </h3>
                ${map(this.getInactiveElements(), elementData => {
                  return html`
                    <single-element
                      .elementData=${elementData}
                      .isActive=${this.runningCallbacks.has(elementData.element)}
                      .isExpanded=${this.expandedElementIds.has(elementData.id)}
                      .onToggle=${this.handleElementToggle}
                    >
                    </single-element>
                  `
                })}
              </div>
            `
          : ""}
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-tab": ElementTab
  }
}
