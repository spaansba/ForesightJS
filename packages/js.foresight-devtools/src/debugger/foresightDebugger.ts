import PositionObserver from "@thednp/position-observer"
import type {
  callbackAnimation,
  DebuggerSettings,
  ElementOverlays,
  ForesightDebuggerData,
} from "../types/types"
import { createAndAppendElement, createAndAppendStyle } from "./helpers/createAndAppend"
import { updateElementOverlays } from "./helpers/updateElementOverlays"
import type {
  CallbackFiredEvent,
  CallbackHitType,
  ElementDataUpdatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
  ForesightElement,
  ForesightElementData,
  ForesightManager,
  ManagerSettingsChangedEvent,
  MouseTrajectoryUpdateEvent,
  ScrollTrajectoryUpdateEvent,
} from "js.foresight"
import {
  DEFAULT_IS_DEBUGGER_MINIMIZED,
  DEFAULT_SHOW_DEBUGGER,
  DEFAULT_SHOW_NAME_TAGS,
  DEFAULT_SORT_ELEMENT_LIST,
} from "../constants"
import { evaluateRegistrationConditions } from "./helpers/evaluateRegistrationConditions"
import { shouldUpdateSetting } from "./helpers/shouldUpdateSetting"
import { DebuggerControlPanel } from "../control_panel/DebuggerControlPanel"
import type { ForesightEvent } from "packages/js.foresight/dist"
import { type ForesightEventMap } from "js.foresight/types/types"

export type ElementCount = {
  total: number
  isIntersecting: number
}

export class ForesightDebugger {
  private static debuggerInstance: ForesightDebugger
  private callbackAnimations: Map<Element, callbackAnimation> = new Map()
  private foresightManagerInstance: ForesightManager
  private shadowHost!: HTMLElement
  private shadowRoot!: ShadowRoot
  private debugContainer!: HTMLElement
  private controlPanel!: DebuggerControlPanel

  private _debuggerSettings: Required<DebuggerSettings> = {
    showDebugger: DEFAULT_SHOW_DEBUGGER,
    isControlPanelDefaultMinimized: DEFAULT_IS_DEBUGGER_MINIMIZED,
    showNameTags: DEFAULT_SHOW_NAME_TAGS,
    sortElementList: DEFAULT_SORT_ELEMENT_LIST,
    logging: {
      logLocation: "controlPanel",
      callbackFired: true,
      elementDataUpdated: false,
      elementRegistered: true,
      elementUnregistered: true,
      managerSettingsChanged: false,
      mouseTrajectoryUpdate: false,
      scrollTrajectoryUpdate: false,
    },
  }

  private debugElementOverlays: Map<ForesightElement, ElementOverlays> = new Map()
  private predictedMouseIndicator: HTMLElement | null = null
  private mouseTrajectoryLine: HTMLElement | null = null
  private scrollTrajectoryLine: HTMLElement | null = null
  private managerSubscriptionsController: AbortController | null = null
  private constructor(foresightManager: ForesightManager) {
    this.foresightManagerInstance = foresightManager
  }
  private animationPositionObserver: PositionObserver | null = null

  private logEvent<K extends ForesightEvent>(event: ForesightEventMap[K], color: string): void {
    switch (this._debuggerSettings.logging.logLocation) {
      case "console":
        console.log(`%c ${event.type}`, `color: ${color}`, event)
        break
      case "controlPanel":
        if (this.controlPanel) {
          this.controlPanel.addEventLog(event.type, event)
        }
        break
      case "both": // dont add fall-through
        console.log(`%c ${event.type}`, `color: ${color}`, event)
        if (this.controlPanel) {
          this.controlPanel.addEventLog(event.type, event)
        }
        break
    }
  }

  public get getDebuggerData(): Readonly<ForesightDebuggerData> {
    return {
      settings: this._debuggerSettings,
    }
  }

  public static initialize(
    foresightManager: ForesightManager,
    props?: Partial<DebuggerSettings>
  ): ForesightDebugger | null {
    if (typeof window === "undefined" || !evaluateRegistrationConditions().shouldRegister) {
      return null
    }
    if (!ForesightDebugger.isInitiated) {
      ForesightDebugger.debuggerInstance = new ForesightDebugger(foresightManager)
    }

    const instance = ForesightDebugger.debuggerInstance
    instance.subscribeToManagerEvents()
    instance.alterDebuggerSettings(props)

    // Always call at the end of the initialize function
    if (!instance.shadowHost) {
      instance._setupDOM()
    }
    return instance
  }

  public static get instance(): ForesightDebugger {
    if (!ForesightDebugger.debuggerInstance) {
      throw new Error(
        "ForesightDebugger has not been initialized. Call ForesightDebugger.initialize() first."
      )
    }
    return ForesightDebugger.debuggerInstance
  }

  private _setupDOM() {
    // If for some reason we call this on an already-setup instance, do nothing.
    if (this.shadowHost) {
      return
    }

    this.shadowHost = createAndAppendElement("div", document.body, {
      id: "jsforesight-debugger-shadow-host",
    })
    this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" })
    this.debugContainer = createAndAppendElement("div", this.shadowRoot, {
      id: "jsforesight-debug-container",
    })
    this.predictedMouseIndicator = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-mouse-predicted",
    })
    this.mouseTrajectoryLine = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-trajectory-line",
    })
    this.scrollTrajectoryLine = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-scroll-trajectory-line",
    })
    this.controlPanel = DebuggerControlPanel.initialize(
      this.foresightManagerInstance,
      ForesightDebugger.debuggerInstance,
      this.shadowRoot,
      this._debuggerSettings
    )
    createAndAppendStyle(debuggerCSS, this.shadowRoot, "screen-visuals")

    this.animationPositionObserver = new PositionObserver(this.handleAnimationPositionChange)
  }

  private handleAnimationPositionChange = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      const animationData = this.callbackAnimations.get(entry.target)
      if (animationData) {
        const rect = entry.boundingClientRect
        const { hitSlop, overlay } = animationData

        const newLeft = rect.left - hitSlop.left
        const newTop = rect.top - hitSlop.top
        const newWidth = rect.width + hitSlop.left + hitSlop.right
        const newHeight = rect.height + hitSlop.top + hitSlop.bottom

        overlay.style.transform = `translate3d(${newLeft}px, ${newTop}px, 0)`
        overlay.style.width = `${newWidth}px`
        overlay.style.height = `${newHeight}px`
      }
    }
  }

  public static get isInitiated(): boolean {
    return !!ForesightDebugger.debuggerInstance
  }

  public alterDebuggerSettings(props?: Partial<DebuggerSettings>) {
    if (!props) return

    // Handle special cases with side effects
    if (shouldUpdateSetting(props.showNameTags, this._debuggerSettings.showNameTags)) {
      this._debuggerSettings.showNameTags = props.showNameTags!
      this.toggleNameTagVisibility()
    }

    if (shouldUpdateSetting(props.showDebugger, this._debuggerSettings.showDebugger)) {
      this._debuggerSettings.showDebugger = props.showDebugger!
      if (this._debuggerSettings.showDebugger) {
        ForesightDebugger.initialize(this.foresightManagerInstance)
      } else {
        this.cleanup()
      }
    }

    // Handle simple property updates
    if (
      shouldUpdateSetting(
        props.isControlPanelDefaultMinimized,
        this._debuggerSettings.isControlPanelDefaultMinimized
      )
    ) {
      this._debuggerSettings.isControlPanelDefaultMinimized = props.isControlPanelDefaultMinimized!
    }
    if (shouldUpdateSetting(props.sortElementList, this._debuggerSettings.sortElementList)) {
      this._debuggerSettings.sortElementList = props.sortElementList!
    }

    // Handle logging settings
    if (props.logging) {
      if (
        shouldUpdateSetting(props.logging.logLocation, this._debuggerSettings.logging.logLocation)
      ) {
        this._debuggerSettings.logging.logLocation = props.logging.logLocation
      }
      if (
        shouldUpdateSetting(
          props.logging.callbackFired,
          this._debuggerSettings.logging.callbackFired
        )
      ) {
        this._debuggerSettings.logging.callbackFired = props.logging.callbackFired
      }
      if (
        shouldUpdateSetting(
          props.logging.elementDataUpdated,
          this._debuggerSettings.logging.elementDataUpdated
        )
      ) {
        this._debuggerSettings.logging.elementDataUpdated = props.logging.elementDataUpdated
      }
      if (
        shouldUpdateSetting(
          props.logging.elementRegistered,
          this._debuggerSettings.logging.elementRegistered
        )
      ) {
        this._debuggerSettings.logging.elementRegistered = props.logging.elementRegistered
      }
      if (
        shouldUpdateSetting(
          props.logging.elementUnregistered,
          this._debuggerSettings.logging.elementUnregistered
        )
      ) {
        this._debuggerSettings.logging.elementUnregistered = props.logging.elementUnregistered
      }
      if (
        shouldUpdateSetting(
          props.logging.managerSettingsChanged,
          this._debuggerSettings.logging.managerSettingsChanged
        )
      ) {
        this._debuggerSettings.logging.managerSettingsChanged = props.logging.managerSettingsChanged
      }
      if (
        shouldUpdateSetting(
          props.logging.mouseTrajectoryUpdate,
          this._debuggerSettings.logging.mouseTrajectoryUpdate
        )
      ) {
        this._debuggerSettings.logging.mouseTrajectoryUpdate = props.logging.mouseTrajectoryUpdate
      }
      if (
        shouldUpdateSetting(
          props.logging.scrollTrajectoryUpdate,
          this._debuggerSettings.logging.scrollTrajectoryUpdate
        )
      ) {
        this._debuggerSettings.logging.scrollTrajectoryUpdate = props.logging.scrollTrajectoryUpdate
      }
    }
  }

  private subscribeToManagerEvents() {
    this.managerSubscriptionsController = new AbortController()
    const signal = this.managerSubscriptionsController.signal
    const manager = this.foresightManagerInstance
    manager.addEventListener("elementRegistered", this.handleRegisterElement, { signal })
    manager.addEventListener("elementUnregistered", this.handleUnregisterElement, { signal })
    manager.addEventListener("elementDataUpdated", this.handleElementDataUpdated, { signal })
    manager.addEventListener("mouseTrajectoryUpdate", this.handleMouseTrajectoryUpdate, { signal })
    manager.addEventListener("scrollTrajectoryUpdate", this.handleScrollTrajectoryUpdate, {
      signal,
    })
    manager.addEventListener("managerSettingsChanged", this.handleSettingsChanged, { signal })
    manager.addEventListener("callbackFired", this.handleCallbackFired, { signal })
  }

  private handleElementDataUpdated = (e: ElementDataUpdatedEvent) => {
    this._debuggerSettings.logging.elementDataUpdated && this.logEvent(e, "purple")

    // Check if 'bounds' is included in the updatedProps array
    if (e.updatedProps.includes("bounds")) {
      this.createOrUpdateElementOverlay(e.elementData)
    }

    // Check if 'visibility' is included in the updatedProps array
    if (e.updatedProps.includes("visibility")) {
      if (!e.elementData.isIntersectingWithViewport) {
        this.removeElementOverlay(e.elementData)
      }
      this.controlPanel?.updateElementVisibilityStatus(e.elementData)
    }
  }

  /**
   * Removes all debug overlays and data associated with an element.
   *
   * This method cleans up the link overlay, expanded overlay, and name label
   * for the specified element, removes it from internal tracking maps, and
   * refreshes the control panel's element list to reflect the removal.
   *
   * @param element - The ForesightElement to remove from debugging visualization
   */
  private handleUnregisterElement = (e: ElementUnregisteredEvent) => {
    this._debuggerSettings.logging.elementUnregistered && this.logEvent(e, "red")

    this.removeElementOverlay(e.elementData)
    this.controlPanel.updateTitleElementCount()
    this.controlPanel.removeElementFromListContainer(e.elementData)
  }

  private handleCallbackFired = (e: CallbackFiredEvent) => {
    this._debuggerSettings.logging.callbackFired && this.logEvent(e, "orange")
    this.showCallbackAnimation(e.elementData, e.hitType)
  }

  private handleRegisterElement = (e: ElementRegisteredEvent) => {
    this._debuggerSettings.logging.elementRegistered && this.logEvent(e, "green")

    this.createOrUpdateElementOverlay(e.elementData)
    this.controlPanel.addElementToListContainer(e.elementData)
    this.controlPanel.updateTitleElementCount()
  }

  private handleMouseTrajectoryUpdate = (e: MouseTrajectoryUpdateEvent) => {
    this._debuggerSettings.logging.mouseTrajectoryUpdate && this.logEvent(e, "blue")

    if (!this.shadowRoot || !this.debugContainer) {
      return
    }
    if (!this.predictedMouseIndicator || !this.mouseTrajectoryLine) {
      return
    }
    //Hide scroll visuals on mouse move
    if (this.scrollTrajectoryLine) {
      this.scrollTrajectoryLine.style.display = "none"
    }
    const { predictedPoint, currentPoint } = e.trajectoryPositions

    // Use transform for positioning to avoid layout reflow.
    // The CSS handles centering the element with `translate(-50%, -50%)`.
    this.predictedMouseIndicator.style.transform = `translate3d(${predictedPoint.x}px, ${predictedPoint.y}px, 0) translate3d(-50%, -50%, 0)`
    this.predictedMouseIndicator.style.display = e.predictionEnabled ? "block" : "none"

    // This hides the circle from the UI at the top-left corner when refreshing the page with the cursor outside of the window
    if (predictedPoint.x === 0 && predictedPoint.y === 0) {
      this.predictedMouseIndicator.style.display = "none"
      return
    }

    if (!e.predictionEnabled) {
      this.mouseTrajectoryLine.style.display = "none"
      return
    }

    const dx = predictedPoint.x - currentPoint.x
    const dy = predictedPoint.y - currentPoint.y

    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    // Use a single transform to position, rotate, and scale the line,
    // avoiding reflow from top/left changes.
    this.mouseTrajectoryLine.style.transform = `translate3d(${currentPoint.x}px, ${currentPoint.y}px, 0) rotate(${angle}deg)`
    this.mouseTrajectoryLine.style.width = `${length}px`
    this.mouseTrajectoryLine.style.display = "block"
  }

  private handleScrollTrajectoryUpdate = (e: ScrollTrajectoryUpdateEvent) => {
    this._debuggerSettings.logging.scrollTrajectoryUpdate && this.logEvent(e, "cyan")

    if (!this.scrollTrajectoryLine) return
    const dx = e.predictedPoint.x - e.currentPoint.x
    const dy = e.predictedPoint.y - e.currentPoint.y

    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    this.scrollTrajectoryLine.style.transform = `translate3d(${e.currentPoint.x}px, ${e.currentPoint.y}px, 0) rotate(${angle}deg)`
    this.scrollTrajectoryLine.style.width = `${length}px`
    this.scrollTrajectoryLine.style.display = "block"
  }

  private handleSettingsChanged = (e: ManagerSettingsChangedEvent) => {
    this._debuggerSettings.logging.managerSettingsChanged && this.logEvent(e, "grey")

    this.controlPanel?.updateControlsStateFromCode(
      e.managerData.globalSettings,
      this._debuggerSettings
    )
  }

  private createElementOverlays(elementData: ForesightElementData) {
    const expandedOverlay = createAndAppendElement("div", this.debugContainer!, {
      className: "jsforesight-expanded-overlay",
      data: elementData.name,
    })
    const nameLabel = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-name-label",
    })
    const overlays = { expandedOverlay, nameLabel }
    this.debugElementOverlays.set(elementData.element, overlays)
    return overlays
  }

  private createOrUpdateElementOverlay(newData: ForesightElementData) {
    if (!this.debugContainer || !this.shadowRoot) return

    let overlays = this.debugElementOverlays.get(newData.element)
    if (!overlays) {
      overlays = this.createElementOverlays(newData)
    }
    updateElementOverlays(
      overlays,
      newData,
      this._debuggerSettings.showNameTags ?? DEFAULT_SHOW_NAME_TAGS
    )
  }

  // TODO :fix
  private toggleNameTagVisibility() {
    this.foresightManagerInstance.registeredElements.forEach(elementData => {
      const overlays = this.debugElementOverlays.get(elementData.element)
      if (!overlays) return
      updateElementOverlays(
        overlays,
        elementData,
        this._debuggerSettings.showNameTags ?? DEFAULT_SHOW_NAME_TAGS
      )
    })
  }

  private removeElementOverlay(elementData: ForesightElementData) {
    const overlays = this.debugElementOverlays.get(elementData.element)
    if (overlays) {
      overlays.expandedOverlay.remove()
      overlays.nameLabel.remove()
      this.debugElementOverlays.delete(elementData.element)
    }
  }

  private showCallbackAnimation(elementData: ForesightElementData, hitType: CallbackHitType) {
    const { element, elementBounds } = elementData
    const existingAnimation = this.callbackAnimations.get(element)

    // If an animation is already running for this element, reset it
    if (existingAnimation) {
      clearTimeout(existingAnimation.timeoutId)
      existingAnimation.overlay.remove()
      this.animationPositionObserver?.unobserve(element)
      this.callbackAnimations.delete(element)
    }

    const animationOverlay = createAndAppendElement("div", this.debugContainer, {
      className: "jsforesight-callback-indicator",
    })

    const { left, top, right, bottom } = elementBounds.expandedRect
    const width = right - left
    const height = bottom - top

    animationOverlay.style.display = "block"
    animationOverlay.style.transform = `translate3d(${left}px, ${top}px, 0)`
    animationOverlay.style.width = `${width}px`
    animationOverlay.style.height = `${height}px`

    switch (hitType.kind) {
      case "mouse":
        animationOverlay.style.borderColor = "#3b82f6" // Blue - matches trajectory line
        break
      case "scroll":
        animationOverlay.style.borderColor = "#22c55e" // Green - matches scroll trajectory line
        break
      case "tab":
        animationOverlay.style.borderColor = "#f97316" // Orange
        break
      default:
        hitType satisfies never
    }

    animationOverlay.classList.add("animate")

    const timeoutId = setTimeout(() => {
      animationOverlay.remove()
      this.callbackAnimations.delete(element)
      this.animationPositionObserver?.unobserve(element)
    }, 500)

    this.callbackAnimations.set(element, {
      hitSlop: elementData.elementBounds.hitSlop,
      overlay: animationOverlay,
      timeoutId: timeoutId,
    })

    this.animationPositionObserver?.observe(element)
  }

  public cleanup() {
    this.managerSubscriptionsController?.abort()
    this.controlPanel?.cleanup()
    this.shadowHost?.remove()
    this.debugElementOverlays.clear()
    this.shadowHost = null!
    this.shadowRoot = null!
    this.debugContainer = null!
    this.predictedMouseIndicator = null
    this.mouseTrajectoryLine = null
    this.scrollTrajectoryLine = null
    this.controlPanel = null!
  }
}

const debuggerCSS = /* css */ `
      #jsforesight-debug-container { 
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 9999;
      }

      .jsforesight-expanded-overlay, 
      .jsforesight-name-label, 
      .jsforesight-callback-indicator,
      .jsforesight-mouse-predicted,
      .jsforesight-scroll-trajectory-line,
      .jsforesight-trajectory-line {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform; 
      }
      .jsforesight-trajectory-line{
        display: none;
      }
      .jsforesight-expanded-overlay {
        border: 1px dashed rgba(100, 116, 139, 0.4);
        background-color: rgba(100, 116, 139, 0.05);
        box-sizing: border-box;
        border-radius: 8px;
      }
      .jsforesight-mouse-predicted {
        display: none !important;
        /* transform is now set dynamically via JS for performance */
      }
      .jsforesight-trajectory-line {
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, rgba(59, 130, 246, 0.4));
        transform-origin: left center;
        z-index: 9999;
        border-radius: 2px;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
        position: relative;
        /* width and transform are set dynamically via JS for performance */
      }
      .jsforesight-trajectory-line::after {
        content: '';
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid #3b82f6;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6));
      }
      .jsforesight-name-label {
        background-color: rgba(27, 31, 35, 0.85);
        backdrop-filter: blur(4px);
        color: white;
        padding: 4px 8px;
        font-size: 11px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
        border-radius: 4px;
        z-index: 10001;
        white-space: nowrap;
        pointer-events: none;
      }
      .jsforesight-callback-indicator {
        border: 4px solid oklch(65% 0.22 280); 
        border-radius: 8px;
        box-sizing: border-box;
        pointer-events: none;
        opacity: 0;
        z-index: 10002;
        display: none; 
      }
      .jsforesight-callback-indicator.animate {
        animation: jsforesight-callback-pulse 0.5s ease-out forwards;
      }
        
      .jsforesight-scroll-trajectory-line {
      height: 4px;
      background: repeating-linear-gradient(
        90deg,
        #22c55e 0px,
        #22c55e 8px,
        transparent 8px,
        transparent 16px
      );
      transform-origin: left center;
      z-index: 9999;
      border-radius: 2px;
      display: none;
      animation: scroll-dash-flow 1.5s linear infinite;
      position: relative;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
      }

      .jsforesight-scroll-trajectory-line::after {
      content: '';
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid #22c55e;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.6));
      animation: scroll-arrow-pulse 1.5s ease-in-out infinite;
      }

      @keyframes scroll-dash-flow {
      0% { background-position: 0px 0px; }
      100% { background-position: 16px 0px; }
      }

      @keyframes scroll-arrow-pulse {
      0%, 100% { 
        transform: translateY(-50%) scale(1);
        filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.6));
      }
      50% {
        transform: translateY(-50%) scale(1.2);
        filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.8));
      }
      }


  
      @keyframes jsforesight-callback-pulse {
        0% {
          opacity: 1;
          box-shadow: 0 0 15px oklch(65% 0.22 280 / 0.7);
        }
        100% {
          opacity: 0;
          box-shadow: 0 0 25px oklch(65% 0.22 280 / 0);
        }
      }
    `
