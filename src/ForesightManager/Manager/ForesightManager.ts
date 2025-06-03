import { tabbable } from "tabbable"
import type {
  ForesightElement,
  ForesightElementData,
  ForesightManagerProps,
  ForesightRegisterOptions,
  ForesightRegisterResult,
  MousePosition,
  Point,
  UpdateForsightManagerProps,
} from "../../types/types"
import { ForesightDebugger } from "../Debugger/ForesightDebugger"
import { isTouchDevice } from "../helpers/isTouchDevice"
import { lineSegmentIntersectsRect } from "../helpers/lineSigmentIntersectsRect"
import { predictNextMousePosition } from "../helpers/predictNextMousePosition"
import {
  areRectsEqual,
  getExpandedRect,
  isPointInRectangle,
  normalizeHitSlop,
} from "../helpers/rectAndHitSlop"

/**
 * Manages the prediction of user intent based on mouse trajectory and element interactions.
 *
 * ForesightManager is a singleton class responsible for:
 * - Registering HTML elements to monitor.
 * - Tracking mouse movements and predicting future cursor positions.
 * - Detecting when a predicted trajectory intersects with a registered element's bounds.
 * - Invoking callbacks associated with elements upon predicted or actual interaction.
 * - Optionally unregistering elements after their callback is triggered.
 * - Handling global settings for prediction behavior (e.g., history size, prediction time).
 * - Optionally enabling a {@link ForesightDebugger} for visual feedback.
 * - Automatically updating element bounds on resize using {@link ResizeObserver}.
 * - Automatically unregistering elements removed from the DOM using {@link MutationObserver}.
 * - Detecting broader layout shifts via {@link MutationObserver} to update element positions.
 *
 * It should be initialized once using {@link ForesightManager.initialize} and then
 * accessed via the static getter {@link ForesightManager.instance}.
 */

export class ForesightManager {
  private static manager: ForesightManager
  public elements: Map<ForesightElement, ForesightElementData> = new Map()

  private isSetup: boolean = false
  private debugger: ForesightDebugger | null = null

  private globalSettings: ForesightManagerProps = {
    debug: false,
    enableMousePrediction: true,
    positionHistorySize: 8,
    trajectoryPredictionTime: 80,
    defaultHitSlop: { top: 0, left: 0, right: 0, bottom: 0 },
    resizeScrollThrottleDelay: 50,
    debuggerSettings: {
      isControlPanelDefaultMinimized: false,
    },
    enableTabPrediction: true,
    tabOffset: 2,
  }

  private positions: MousePosition[] = []
  private currentPoint: Point = { x: 0, y: 0 }
  private predictedPoint: Point = { x: 0, y: 0 }

  private lastResizeScrollCallTimestamp: number = 0
  private resizeScrollThrottleTimeoutId: ReturnType<typeof setTimeout> | null = null

  private domObserver: MutationObserver | null = null
  private domMutationRectsUpdateTimeoutId: ReturnType<typeof setTimeout> | null = null

  private elementResizeObserver: ResizeObserver | null = null

  // Track the last keydown event to determine if focus change was due to Tab
  private lastKeyDown: KeyboardEvent | null = null

  // AbortController for managing global event listeners
  private globalListenersController: AbortController | null = null

  private constructor() {}

  public static initialize(props?: Partial<UpdateForsightManagerProps>): ForesightManager {
    if (!ForesightManager.manager) {
      ForesightManager.manager = new ForesightManager()
      if (props) {
        ForesightManager.manager.alterGlobalSettings(props)
      } else {
        if (ForesightManager.manager.globalSettings.debug) {
          ForesightManager.manager.turnOnDebugMode()
        }
      }
    } else if (props) {
      ForesightManager.manager.alterGlobalSettings(props)
    }
    return ForesightManager.manager
  }

  public static get instance() {
    if (!ForesightManager.manager) {
      return this.initialize()
    }
    return ForesightManager.manager
  }

  public register({
    element,
    callback,
    hitSlop,
    unregisterOnCallback,
    name,
  }: ForesightRegisterOptions): ForesightRegisterResult {
    if (isTouchDevice()) {
      return { isTouchDevice: true, unregister: () => {} }
    }

    const normalizedHitSlop = hitSlop
      ? normalizeHitSlop(hitSlop)
      : this.globalSettings.defaultHitSlop

    const originalRect = element.getBoundingClientRect()

    const finalUnregisterOnCallback = unregisterOnCallback ?? true

    const elementData: ForesightElementData = {
      callback,
      elementBounds: {
        expandedRect: getExpandedRect(originalRect, normalizedHitSlop),
        originalRect: originalRect,
        hitSlop: normalizedHitSlop,
      },
      isHovering: false,
      trajectoryHitData: {
        isTrajectoryHit: false,
        trajectoryHitTime: 0,
        trajectoryHitExpirationTimeoutId: undefined,
      },
      name: name ?? "",
      unregisterOnCallback: finalUnregisterOnCallback,
    }
    this.elements.set(element, elementData)

    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    if (this.elementResizeObserver) {
      this.elementResizeObserver.observe(element)
    }

    if (this.debugger) {
      const data = this.elements.get(element)
      if (data) this.debugger.createOrUpdateLinkOverlay(element, data)
      this.debugger.refreshDisplayedElements()
    }

    return { isTouchDevice: false, unregister: () => this.unregister(element) }
  }

  private unregister(element: ForesightElement) {
    const isRegistered = this.elements.has(element)
    if (!isRegistered) {
      // The element is already unregistered by something else (e.g. after hitting callback)
      return
    }
    const foresightElementData = this.elements.get(element)

    // Clear any pending trajectory expiration timeout
    if (foresightElementData?.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
      clearTimeout(foresightElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
    }

    if (this.elementResizeObserver) {
      this.elementResizeObserver.unobserve(element)
    }

    this.elements.delete(element)

    if (this.debugger) {
      this.debugger.removeLinkOverlay(element)
      this.debugger.refreshDisplayedElements()
    }

    if (this.elements.size === 0 && this.isSetup) {
      if (!this.debugger) {
        this.removeGlobalListeners()
      } else {
        console.log(
          "%cForesightJS: All elements have successfully triggered their callbacks. ForesightJS would typically perform cleanup actions now, but these are currently skipped while in debug mode.",
          "color: #28a745; font-weight: bold;"
        )
      }
    }
  }

  public alterGlobalSettings(props?: Partial<UpdateForsightManagerProps>): void {
    let settingsActuallyChanged = false

    if (
      props?.positionHistorySize !== undefined &&
      this.globalSettings.positionHistorySize !== props.positionHistorySize
    ) {
      this.globalSettings.positionHistorySize = props.positionHistorySize
      settingsActuallyChanged = true
    }

    if (
      props?.trajectoryPredictionTime !== undefined &&
      this.globalSettings.trajectoryPredictionTime !== props.trajectoryPredictionTime
    ) {
      this.globalSettings.trajectoryPredictionTime = props.trajectoryPredictionTime
      settingsActuallyChanged = true
    }

    if (
      props?.enableTabPrediction !== undefined &&
      this.globalSettings.enableTabPrediction !== props.enableTabPrediction
    ) {
      this.globalSettings.enableTabPrediction = props.enableTabPrediction
      settingsActuallyChanged = true
    }

    if (props?.tabOffset !== undefined && this.globalSettings.tabOffset !== props.tabOffset) {
      this.globalSettings.tabOffset = props.tabOffset
      settingsActuallyChanged = true
    }

    if (
      props?.enableMousePrediction !== undefined &&
      this.globalSettings.enableMousePrediction !== props.enableMousePrediction
    ) {
      this.globalSettings.enableMousePrediction = props.enableMousePrediction
      settingsActuallyChanged = true
      if (this.globalSettings.enableMousePrediction) {
        this.predictedPoint = predictNextMousePosition(
          this.currentPoint,
          this.positions, // History before the currentPoint was added
          this.globalSettings.positionHistorySize,
          this.globalSettings.trajectoryPredictionTime
        )
      } else {
        this.predictedPoint = this.currentPoint
        // When disabling prediction, clear active trajectory hits and their timeouts
        this.elements.forEach((data, el) => {
          if (data.trajectoryHitData.isTrajectoryHit) {
            if (data.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
              clearTimeout(data.trajectoryHitData.trajectoryHitExpirationTimeoutId)
            }
            const updatedElementData: ForesightElementData = {
              ...data,
              trajectoryHitData: {
                isTrajectoryHit: false,
                trajectoryHitTime: 0,
                trajectoryHitExpirationTimeoutId: undefined,
              },
            }
            this.elements.set(el, updatedElementData)
            if (this.debugger) {
              this.debugger.createOrUpdateLinkOverlay(el, updatedElementData)
            }
          }
        })
      }
    }

    if (props?.debuggerSettings?.isControlPanelDefaultMinimized !== undefined) {
      this.globalSettings.debuggerSettings.isControlPanelDefaultMinimized =
        props.debuggerSettings.isControlPanelDefaultMinimized
      settingsActuallyChanged = true
    }

    if (props?.defaultHitSlop !== undefined) {
      const normalizedNewHitSlop = normalizeHitSlop(props.defaultHitSlop)
      if (!areRectsEqual(this.globalSettings.defaultHitSlop, normalizedNewHitSlop)) {
        this.globalSettings.defaultHitSlop = normalizedNewHitSlop
        settingsActuallyChanged = true
        this.elements.forEach((_, element) => {
          this.updateExpandedRect(element)
        })
      }
    }

    if (
      props?.resizeScrollThrottleDelay !== undefined &&
      this.globalSettings.resizeScrollThrottleDelay !== props.resizeScrollThrottleDelay
    ) {
      this.globalSettings.resizeScrollThrottleDelay = props.resizeScrollThrottleDelay
      settingsActuallyChanged = true
    }

    if (props?.debug !== undefined && this.globalSettings.debug !== props.debug) {
      this.globalSettings.debug = props.debug
      settingsActuallyChanged = true
      if (this.globalSettings.debug) {
        this.turnOnDebugMode()
      } else {
        if (this.debugger) {
          this.debugger.cleanup()
          this.debugger = null
        }
      }
    }

    if (settingsActuallyChanged && this.globalSettings.debug && this.debugger) {
      this.debugger.updateControlsState(this.globalSettings)
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.globalSettings.enableMousePrediction
      )
      this.elements.forEach((data, el) => {
        this.debugger!.createOrUpdateLinkOverlay(el, data)
      })
      this.debugger.refreshDisplayedElements()
    }
  }

  private turnOnDebugMode() {
    // Get the debugger instance, passing 'this' (the manager instance)
    if (!this.debugger) {
      this.debugger = ForesightDebugger.getInstance(this)
      // Then initialize it as before, passing the necessary data
      this.debugger.initialize(
        this.elements,
        this.globalSettings,
        this.currentPoint,
        this.predictedPoint
      )
    } else {
      // If already exists, just update visuals/state
      this.debugger.updateControlsState(this.globalSettings)
      this.debugger.updateAllLinkVisuals()
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.globalSettings.enableMousePrediction
      )
    }
  }

  private updateExpandedRect(element: ForesightElement) {
    const foresightElementData = this.elements.get(element)
    if (!foresightElementData) return

    const newOriginalRect = element.getBoundingClientRect()

    const expandedRect = getExpandedRect(
      newOriginalRect,
      foresightElementData.elementBounds.hitSlop
    )
    if (!areRectsEqual(expandedRect, foresightElementData.elementBounds.expandedRect)) {
      this.elements.set(element, {
        ...foresightElementData,
        elementBounds: {
          ...foresightElementData.elementBounds,
          originalRect: newOriginalRect,
          expandedRect,
        },
      })

      if (this.debugger) {
        const updatedData = this.elements.get(element)
        if (updatedData) this.debugger.createOrUpdateLinkOverlay(element, updatedData)
      }
    }
  }

  private updateAllRects() {
    this.elements.forEach((_, element) => {
      this.updateExpandedRect(element)
    })
  }

  private updatePointerState(e: MouseEvent): void {
    this.currentPoint = { x: e.clientX, y: e.clientY }
    this.predictedPoint = this.globalSettings.enableMousePrediction
      ? predictNextMousePosition(
          this.currentPoint,
          this.positions, // History before the currentPoint was added
          this.globalSettings.positionHistorySize,
          this.globalSettings.trajectoryPredictionTime
        )
      : { ...this.currentPoint }
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.updatePointerState(e)

    let elementsToUpdateInDebugger: ForesightElement[] | null = null
    if (this.debugger) {
      elementsToUpdateInDebugger = []
    }

    this.elements.forEach((currentData, element) => {
      if (!this.elements.has(element)) {
        return
      }

      const previousDataState = {
        isHovering: currentData.isHovering,
        trajectoryHitData: currentData.trajectoryHitData,
      }

      let callbackFiredThisCycle = false
      let finalIsHovering = currentData.isHovering
      let finalIsTrajectoryHit = currentData.trajectoryHitData.isTrajectoryHit
      let finalTrajectoryHitTime = currentData.trajectoryHitData.trajectoryHitTime

      const { expandedRect } = currentData.elementBounds

      const isCurrentlyPhysicallyHovering = isPointInRectangle(this.currentPoint, expandedRect)

      let isNewTrajectoryActivation = false
      if (
        this.globalSettings.enableMousePrediction &&
        !isCurrentlyPhysicallyHovering &&
        !currentData.trajectoryHitData.isTrajectoryHit // Only activate if not already hit
      ) {
        if (lineSegmentIntersectsRect(this.currentPoint, this.predictedPoint, expandedRect)) {
          isNewTrajectoryActivation = true
        }
      }

      if (isNewTrajectoryActivation) {
        finalIsTrajectoryHit = true
        finalTrajectoryHitTime = performance.now()
        callbackFiredThisCycle = true
        this.callCallback(currentData, element)
      }

      const isNewPhysicalHoverEvent = isCurrentlyPhysicallyHovering && !currentData.isHovering

      if (isNewPhysicalHoverEvent) {
        const hoverCanTriggerCallback =
          !currentData.trajectoryHitData.isTrajectoryHit || // If not trajectory hit, hover can trigger
          (currentData.trajectoryHitData.isTrajectoryHit &&
            !this.globalSettings.enableMousePrediction) // Or if trajectory was hit but prediction is now off

        if (!callbackFiredThisCycle && hoverCanTriggerCallback) {
          callbackFiredThisCycle = true
          this.callCallback(currentData, element)
        }
      }

      finalIsHovering = isCurrentlyPhysicallyHovering

      // If physically hovering, it overrides any "trajectory hit" state for expiration purposes
      // but the visual/logical state of isTrajectoryHit might persist if it happened first.
      // The main change is how the expiration timeout is handled.

      const coreStateActuallyChanged =
        finalIsHovering !== previousDataState.isHovering ||
        finalIsTrajectoryHit !== previousDataState.trajectoryHitData.isTrajectoryHit ||
        (finalIsTrajectoryHit &&
          finalTrajectoryHitTime !== previousDataState.trajectoryHitData.trajectoryHitTime)

      if (coreStateActuallyChanged && this.elements.has(element)) {
        let newElementData: ForesightElementData = {
          ...currentData,
          isHovering: finalIsHovering,
          trajectoryHitData: {
            isTrajectoryHit: finalIsTrajectoryHit,
            trajectoryHitTime: finalTrajectoryHitTime,
            trajectoryHitExpirationTimeoutId:
              previousDataState.trajectoryHitData.trajectoryHitExpirationTimeoutId, // Preserve existing initially
          },
        }

        // Manage trajectory hit expiration timeout
        if (
          newElementData.trajectoryHitData.isTrajectoryHit &&
          !previousDataState.trajectoryHitData.isTrajectoryHit
        ) {
          // Just became a trajectory hit (or re-hit after expiration)
          if (newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
            clearTimeout(newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
          }
          newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId = setTimeout(() => {
            const currentElementData = this.elements.get(element)
            if (
              currentElementData &&
              currentElementData.trajectoryHitData.isTrajectoryHit &&
              currentElementData.trajectoryHitData.trajectoryHitTime ===
                newElementData.trajectoryHitData.trajectoryHitTime // Ensure it's the same hit instance
            ) {
              const expiredData: ForesightElementData = {
                ...currentElementData,
                trajectoryHitData: {
                  isTrajectoryHit: false,
                  trajectoryHitExpirationTimeoutId: undefined,
                  trajectoryHitTime: currentElementData.trajectoryHitData.trajectoryHitTime,
                },
              }
              this.elements.set(element, expiredData)
              if (this.debugger) {
                this.debugger.createOrUpdateLinkOverlay(element, expiredData)
              }
            }
          }, 200)
        } else if (
          !newElementData.trajectoryHitData.isTrajectoryHit &&
          previousDataState.trajectoryHitData.isTrajectoryHit
        ) {
          // No longer a trajectory hit (e.g. mouse moved away, physical hover, or prediction disabled)
          if (newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
            clearTimeout(newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
            newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId = undefined
          }
        }
        // If it was already a trajectory hit and remains one (e.g. mouse still on trajectory path
        // without physical hover, and timeout hasn't fired), the existing timeout continues.

        this.elements.set(element, newElementData)

        if (elementsToUpdateInDebugger) {
          elementsToUpdateInDebugger.push(element)
        }
      }
    })

    if (this.debugger) {
      elementsToUpdateInDebugger?.forEach((element) => {
        const data = this.elements.get(element) // Get potentially updated data
        if (data) {
          this.debugger!.createOrUpdateLinkOverlay(element, data)
        }
      })
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.globalSettings.enableMousePrediction
      )
    }
  }

  private handleResizeOrScroll = (): void => {
    if (this.resizeScrollThrottleTimeoutId) {
      clearTimeout(this.resizeScrollThrottleTimeoutId)
    }

    const now = performance.now()
    const timeSinceLastCall = now - this.lastResizeScrollCallTimestamp
    const currentDelay = this.globalSettings.resizeScrollThrottleDelay

    if (timeSinceLastCall >= currentDelay) {
      this.updateAllRects()
      this.lastResizeScrollCallTimestamp = now
      this.resizeScrollThrottleTimeoutId = null
    } else {
      this.resizeScrollThrottleTimeoutId = setTimeout(() => {
        this.updateAllRects()
        this.lastResizeScrollCallTimestamp = performance.now()
        this.resizeScrollThrottleTimeoutId = null
      }, currentDelay - timeSinceLastCall)
    }
  }

  private handleElementResize = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const element = entry.target as ForesightElement
      const foresightElementData = this.elements.get(element)

      if (foresightElementData) {
        this.updateExpandedRect(element)
      }
    }
  }

  /**
   * Detects when registered elements are removed from the DOM and automatically unregisters them to prevent stale references.
   *
   * @param mutationsList - Array of MutationRecord objects describing the DOM changes
   *
   */
  private handleDomMutations = (mutationsList: MutationRecord[]) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
        const currentElements = Array.from(this.elements.keys())
        for (const element of currentElements) {
          if (!element.isConnected) {
            if (this.elements.has(element)) {
              this.unregister(element) // unregister will clear its own timeout
            }
          }
        }
      }
    }
  }

  // We store the last key for the FocusIn event, meaning we know if the user is tabbing around the page.
  // We dont use handleKeyDown for the full event because of 2 main reasons:
  // 1: handleKeyDown e.target returns the target on which the keydown is pressed (meaning we dont know which target got the focus)
  // 2: handleKeyUp does return the correct e.target however when holding tab the event doesnt repeat (handleKeyDown does)
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      this.lastKeyDown = e
    } else {
      this.lastKeyDown = null
    }
  }

  private handleFocusIn = (e: FocusEvent) => {
    if (!this.lastKeyDown || !this.globalSettings.enableTabPrediction) {
      return
    }
    const targetElement = e.target
    if (!(targetElement instanceof HTMLElement)) {
      return
    }

    const tabbableElements = tabbable(document.documentElement)
    const currentIndex = tabbableElements.findIndex((element) => element === targetElement)

    // Determine the range of elements to check based on the tab direction and offset
    const tabOffset = this.lastKeyDown.shiftKey
      ? -this.globalSettings.tabOffset
      : this.globalSettings.tabOffset

    // Clear the lastKeyDown as we've processed this focus event
    this.lastKeyDown = null
    const elementsToPredict: ForesightElement[] = []

    // Iterate through the tabbable elements to find those within the prediction range
    for (let i = 0; i < tabbableElements.length; i++) {
      const element = tabbableElements[i]

      // Check if the current element is within the range defined by the current focus and the tabOffset
      // The range includes the element that just received focus (at currentIndex)
      let isInRange =
        tabOffset > 0
          ? i >= currentIndex && i <= currentIndex + tabOffset
          : i <= currentIndex && i >= currentIndex + tabOffset

      if (isInRange && this.elements.has(element as ForesightElement)) {
        elementsToPredict.push(element as ForesightElement)
      }
    }

    elementsToPredict.forEach((element) => {
      this.callCallback(this.elements.get(element), element)
    })
  }

  private callCallback(elementData: ForesightElementData | undefined, element: ForesightElement) {
    if (elementData) {
      elementData.callback()
      if (this.debugger) {
        this.debugger.showCallbackPopup(elementData.elementBounds.expandedRect)
      }
      // Do everything and then unregister. Always keep this at the end of the function
      if (elementData.unregisterOnCallback) {
        this.unregister(element)
      }
    }
  }

  private initializeGlobalListeners() {
    if (this.isSetup) return

    this.globalListenersController = new AbortController()
    const { signal } = this.globalListenersController
    document.addEventListener("mousemove", this.handleMouseMove, { signal })
    window.addEventListener("resize", this.handleResizeOrScroll, { signal })
    window.addEventListener("scroll", this.handleResizeOrScroll, { signal })
    document.addEventListener("keydown", this.handleKeyDown, { signal })
    document.addEventListener("focusin", this.handleFocusIn, { signal })

    this.domObserver = new MutationObserver(this.handleDomMutations)
    this.domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    this.elementResizeObserver = new ResizeObserver(this.handleElementResize)
    this.elements.forEach((_, element) => this.elementResizeObserver!.observe(element))

    this.isSetup = true
  }

  private removeGlobalListeners() {
    this.globalListenersController?.abort() // Remove all event listeners
    this.globalListenersController = null
    this.domObserver?.disconnect()
    this.elementResizeObserver?.disconnect()

    // Even though we aborted the signals there might still be an event being throttled, clear it
    if (this.resizeScrollThrottleTimeoutId) {
      clearTimeout(this.resizeScrollThrottleTimeoutId)
      this.resizeScrollThrottleTimeoutId = null
    }

    if (this.domMutationRectsUpdateTimeoutId) {
      clearTimeout(this.domMutationRectsUpdateTimeoutId)
      this.domMutationRectsUpdateTimeoutId = null
    }

    this.isSetup = false
  }
}
