import { ForesightManager } from 'js.foresight'
import type {
  CallbackFiredEvent,
  ElementDataUpdatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
  ForesightElement,
  ForesightElementData,
  HitSlop,
  ManagerSettingsChangedEvent,
  MouseTrajectoryUpdateEvent,
  ScrollTrajectoryUpdateEvent,
} from 'js.foresight'
import PositionObserver from '@thednp/position-observer'
import type { DebuggerSettings, ForesightDebuggerData } from '../types'
import { DebuggerControlPanel } from './DebuggerControlPanel'
import { createAndAppendElement, createAndAppendStyle } from './helpers/createAndAppend'
import { updateElementOverlays } from './helpers/updateElementOverlays'
// PositionObserver imported above

// Import constants that should be available from js.foresight
// These constants need to be part of the main package's public API
const DEFAULT_IS_DEBUGGER_MINIMIZED = false
const DEFAULT_SHOW_DEBUGGER = true
const DEFAULT_SHOW_NAME_TAGS = true
const DEFAULT_SORT_ELEMENT_LIST = 'visibility' as const

// Helper function that should be available from js.foresight or implemented locally
function shouldUpdateSetting<T>(newValue: T | undefined, currentValue: T): boolean {
  return newValue !== undefined && newValue !== currentValue
}

// Helper function that should be available from js.foresight or implemented locally
function evaluateRegistrationConditions(): { shouldRegister: boolean } {
  return {
    shouldRegister: typeof window !== 'undefined' && !('ontouchstart' in window),
  }
}

export type ElementOverlays = {
  expandedOverlay: HTMLElement
  nameLabel: HTMLElement
}

type callbackAnimation = {
  hitSlop: Exclude<HitSlop, number>
  overlay: HTMLElement
  timeoutId: ReturnType<typeof setTimeout>
}
export class ForesightDebugger {
  private static debuggerInstance: ForesightDebugger
  private callbackAnimations: Map<Element, callbackAnimation> = new Map()
  private foresightManagerInstance: ForesightManager
  private shadowHost!: HTMLElement
  private shadowRoot!: ShadowRoot
  private debugContainer!: HTMLElement
  private controlPanel!: DebuggerControlPanel

  private _debuggerSettings: DebuggerSettings = {
    showDebugger: DEFAULT_SHOW_DEBUGGER,
    isControlPanelDefaultMinimized: DEFAULT_IS_DEBUGGER_MINIMIZED,
    showNameTags: DEFAULT_SHOW_NAME_TAGS,
    sortElementList: DEFAULT_SORT_ELEMENT_LIST,
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

  public get getDebuggerData(): Readonly<ForesightDebuggerData> {
    return {
      settings: this._debuggerSettings,
    }
  }

  public static initialize(
    foresightManager: ForesightManager,
    props?: Partial<DebuggerSettings>
  ): ForesightDebugger | null {
    if (typeof window === 'undefined' || !evaluateRegistrationConditions().shouldRegister) {
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
        'ForesightDebugger has not been initialized. Call ForesightDebugger.initialize() first.'
      )
    }
    return ForesightDebugger.debuggerInstance
  }

  private _setupDOM() {
    // If for some reason we call this on an already-setup instance, do nothing.
    if (this.shadowHost) {
      return
    }

    this.shadowHost = createAndAppendElement('div', document.body, {
      id: 'jsforesight-debugger-shadow-host',
    })
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'open' })
    this.debugContainer = createAndAppendElement('div', this.shadowRoot, {
      id: 'jsforesight-debug-container',
    })
    this.predictedMouseIndicator = createAndAppendElement('div', this.debugContainer, {
      className: 'jsforesight-mouse-predicted',
    })
    this.mouseTrajectoryLine = createAndAppendElement('div', this.debugContainer, {
      className: 'jsforesight-trajectory-line',
    })
    this.scrollTrajectoryLine = createAndAppendElement('div', this.debugContainer, {
      className: 'jsforesight-scroll-trajectory-line',
    })
    this.controlPanel = DebuggerControlPanel.initialize(
      this.foresightManagerInstance,
      ForesightDebugger.debuggerInstance,
      this.shadowRoot,
      this._debuggerSettings
    )
    createAndAppendStyle(debuggerCSS, this.shadowRoot, 'screen-visuals')

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

  private static get isInitiated(): boolean {
    return !!ForesightDebugger.debuggerInstance
  }

  public alterDebuggerSettings(props?: Partial<DebuggerSettings>) {
    if (shouldUpdateSetting(props?.showNameTags, this._debuggerSettings.showNameTags)) {
      this._debuggerSettings.showNameTags = props!.showNameTags!
      this.toggleNameTagVisibility()
    }
    if (
      shouldUpdateSetting(
        props?.isControlPanelDefaultMinimized,
        this._debuggerSettings.isControlPanelDefaultMinimized
      )
    ) {
      this._debuggerSettings.isControlPanelDefaultMinimized = props!.isControlPanelDefaultMinimized!
    }
    if (shouldUpdateSetting(props?.sortElementList, this._debuggerSettings.sortElementList)) {
      this._debuggerSettings.sortElementList = props!.sortElementList!
    }
    if (shouldUpdateSetting(props?.showDebugger, this._debuggerSettings.showDebugger)) {
      this._debuggerSettings.showDebugger = props!.showDebugger!
      if (this._debuggerSettings.showDebugger) {
        ForesightDebugger.initialize(this.foresightManagerInstance)
      } else {
        this.cleanup()
      }
    }
  }

  private subscribeToManagerEvents() {
    this.managerSubscriptionsController = new AbortController()
    const signal = this.managerSubscriptionsController.signal
    const manager = this.foresightManagerInstance

    manager.addEventListener('elementRegistered', this.handleAddElement, { signal })
    manager.addEventListener('elementUnregistered', this.handleRemoveElement, { signal })
    manager.addEventListener('elementDataUpdated', this.handleElementDataUpdated, { signal })
    manager.addEventListener('mouseTrajectoryUpdate', this.handleMouseTrajectoryUpdate, {
      signal,
    })
    manager.addEventListener('scrollTrajectoryUpdate', this.handleScrollTrajectoryUpdate, {
      signal,
    })
    manager.addEventListener('managerSettingsChanged', this.handleSettingsChanged, { signal })

    manager.addEventListener('callbackFired', this.handleCallbackFired, { signal })
  }

  private handleElementDataUpdated = (e: ElementDataUpdatedEvent) => {
    switch (e.updatedProp) {
      case 'bounds':
        this.createOrUpdateElementOverlay(e.elementData)
        break
      case 'visibility':
        if (!e.elementData.isIntersectingWithViewport) {
          this.removeElementOverlay(e.elementData)
        }
        this.controlPanel?.updateElementVisibilityStatus(e.elementData)
        break
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
  private handleRemoveElement = (e: ElementUnregisteredEvent) => {
    this.controlPanel?.removeElementFromList(e.elementData)
    this.removeElementOverlay(e.elementData)
  }

  private handleCallbackFired = (e: CallbackFiredEvent) => {
    this.showCallbackAnimation(e.elementData)
  }

  private handleAddElement = (e: ElementRegisteredEvent) => {
    this.createOrUpdateElementOverlay(e.elementData)
    this.controlPanel.addElementToList(e.elementData, e.sort)
  }

  private handleMouseTrajectoryUpdate = (e: MouseTrajectoryUpdateEvent) => {
    if (!this.shadowRoot || !this.debugContainer) {
      return
    }
    if (!this.predictedMouseIndicator || !this.mouseTrajectoryLine) {
      return
    }
    //Hide scroll visuals on mouse move
    if (this.scrollTrajectoryLine) {
      this.scrollTrajectoryLine.style.display = 'none'
    }
    const { predictedPoint, currentPoint } = e.trajectoryPositions

    // Use transform for positioning to avoid layout reflow.
    // The CSS handles centering the element with `translate(-50%, -50%)`.
    this.predictedMouseIndicator.style.transform = `translate3d(${predictedPoint.x}px, ${predictedPoint.y}px, 0) translate3d(-50%, -50%, 0)`
    this.predictedMouseIndicator.style.display = e.predictionEnabled ? 'block' : 'none'

    // This hides the circle from the UI at the top-left corner when refreshing the page with the cursor outside of the window
    if (predictedPoint.x === 0 && predictedPoint.y === 0) {
      this.predictedMouseIndicator.style.display = 'none'
      return
    }

    if (!e.predictionEnabled) {
      this.mouseTrajectoryLine.style.display = 'none'
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
    this.mouseTrajectoryLine.style.display = 'block'
  }

  private handleScrollTrajectoryUpdate = (e: ScrollTrajectoryUpdateEvent) => {
    if (!this.scrollTrajectoryLine) return
    const dx = e.predictedPoint.x - e.currentPoint.x
    const dy = e.predictedPoint.y - e.currentPoint.y

    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    this.scrollTrajectoryLine.style.transform = `translate3d(${e.currentPoint.x}px, ${e.currentPoint.y}px, 0) rotate(${angle}deg)`
    this.scrollTrajectoryLine.style.width = `${length}px`
    this.scrollTrajectoryLine.style.display = 'block'
  }

  private handleSettingsChanged = (e: ManagerSettingsChangedEvent) => {
    this.controlPanel?.updateControlsState(e.newSettings, this._debuggerSettings)
  }

  private createElementOverlays(elementData: ForesightElementData) {
    const expandedOverlay = createAndAppendElement('div', this.debugContainer!, {
      className: 'jsforesight-expanded-overlay',
      data: elementData.name,
    })
    const nameLabel = createAndAppendElement('div', this.debugContainer, {
      className: 'jsforesight-name-label',
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

  private showCallbackAnimation(elementData: ForesightElementData) {
    const { element, elementBounds } = elementData
    const existingAnimation = this.callbackAnimations.get(element)

    // If an animation is already running for this element, reset it
    if (existingAnimation) {
      clearTimeout(existingAnimation.timeoutId)
      existingAnimation.overlay.remove()
      this.animationPositionObserver?.unobserve(element)
      this.callbackAnimations.delete(element)
    }

    const animationOverlay = createAndAppendElement('div', this.debugContainer, {
      className: 'jsforesight-callback-indicator',
    })

    const { left, top, right, bottom } = elementBounds.expandedRect
    const width = right - left
    const height = bottom - top

    animationOverlay.style.display = 'block'
    animationOverlay.style.transform = `translate3d(${left}px, ${top}px, 0)`
    animationOverlay.style.width = `${width}px`
    animationOverlay.style.height = `${height}px`

    animationOverlay.classList.add('animate')

    const animationDuration = 500

    const timeoutId = setTimeout(() => {
      animationOverlay.remove()
      this.callbackAnimations.delete(element)
      this.animationPositionObserver?.unobserve(element)
    }, animationDuration)

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
