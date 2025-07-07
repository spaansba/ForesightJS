import type {
  CallbackFiredEvent,
  ElementDataUpdatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
  ForesightEvent,
  ForesightManager,
  ManagerSettingsChangedEvent,
  MouseTrajectoryUpdateEvent,
  ScrollTrajectoryUpdateEvent,
} from "js.foresight"
import { ControlPanel } from "./control-panel/control-panel"
import type { DevtoolsSettings } from "../types/types"
import { shouldUpdateSetting } from "../debugger/helpers/shouldUpdateSetting"
import type {
  CallbackHitType,
  ForesightElementData,
  ForesightEventMap,
} from "js.foresight/types/types"

export class ForesightDebuggerLit {
  private managerSubscriptionsController: AbortController | null = null
  private foresightManagerInstance: ForesightManager
  private static devtools: ForesightDebuggerLit
  private constructor(foresightManager: ForesightManager) {
    this.foresightManagerInstance = foresightManager
  }

  public devtoolsSettings: Required<DevtoolsSettings> = {
    showDebugger: true,
    isControlPanelDefaultMinimized: false,
    showNameTags: true,
    sortElementList: "visibility",
    logging: {
      logLocation: "both",
      callbackCompleted: true,
      callbackInvoked: true,
      elementDataUpdated: false,
      elementRegistered: false,
      elementUnregistered: false,
      managerSettingsChanged: false,
      mouseTrajectoryUpdate: false,
      scrollTrajectoryUpdate: false,
    },
  }

  public static get instance(): ForesightDebuggerLit {
    return ForesightDebuggerLit.devtools
  }

  public static initialize(
    foresightManager: ForesightManager,
    props?: Partial<DevtoolsSettings>
  ): ForesightDebuggerLit {
    if (!ForesightDebuggerLit.devtools) {
      ForesightDebuggerLit.devtools = new ForesightDebuggerLit(foresightManager)
    }
    const devtools = ForesightDebuggerLit.devtools
    devtools.subscribeToManagerEvents()
    devtools.lit()

    if (props !== undefined) {
      devtools.alterDebuggerSettings(props)
    }
    return devtools
  }
  private lit() {
    ControlPanel
    const controlPanel = document.createElement("control-panel")
    document.body.appendChild(controlPanel)
  }

  private subscribeToManagerEvents() {
    this.managerSubscriptionsController = new AbortController()
    const signal = this.managerSubscriptionsController.signal
    const manager = this.foresightManagerInstance
    // manager.addEventListener("elementRegistered", this.handleRegisterElement, { signal })
    // manager.addEventListener("elementUnregistered", this.handleUnregisterElement, { signal })
    // manager.addEventListener("elementDataUpdated", this.handleElementDataUpdated, { signal })
    // manager.addEventListener("mouseTrajectoryUpdate", this.handleMouseTrajectoryUpdate, { signal })
    // manager.addEventListener("scrollTrajectoryUpdate", this.handleScrollTrajectoryUpdate, {
    //   signal,
    // })
    // manager.addEventListener("managerSettingsChanged", this.handleSettingsChanged, { signal })
    // manager.addEventListener("callbackFired", this.handleCallbackFired, { signal })
  }

  private logEvent<K extends ForesightEvent>(event: ForesightEventMap[K], color: string): void {
    switch (this.devtoolsSettings.logging.logLocation) {
      case "console":
        console.log(`%c ${event.type}`, `color: ${color}`, event)
        break
      case "controlPanel":
        // if (this.controlPanel) {
        //   this.controlPanel.addEventLog(event.type, event)
        // }
        break
      case "both": // dont add fall-through
        console.log(`%c ${event.type}`, `color: ${color}`, event)
        // if (this.controlPanel) {
        //   this.controlPanel.addEventLog(event.type, event)
        // }
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
  private handleUnregisterElement = (e: ElementUnregisteredEvent) => {
    this.devtoolsSettings.logging.elementUnregistered && this.logEvent(e, "red")

    this.removeElementOverlay(e.elementData)
    // this.controlPanel.updateTitleElementCount()
    // this.controlPanel.removeElementFromListContainer(e.elementData)
  }

  private handleMouseTrajectoryUpdate = (e: MouseTrajectoryUpdateEvent) => {
    // this.devtoolsSettings.logging.mouseTrajectoryUpdate && this.logEvent(e, "blue")
    // if (!this.shadowRoot || !this.debugContainer) {
    //   return
    // }
    // if (!this.predictedMouseIndicator || !this.mouseTrajectoryLine) {
    //   return
    // }
    // //Hide scroll visuals on mouse move
    // if (this.scrollTrajectoryLine) {
    //   this.scrollTrajectoryLine.style.display = "none"
    // }
    // const { predictedPoint, currentPoint } = e.trajectoryPositions
    // // Use transform for positioning to avoid layout reflow.
    // // The CSS handles centering the element with `translate(-50%, -50%)`.
    // this.predictedMouseIndicator.style.transform = `translate3d(${predictedPoint.x}px, ${predictedPoint.y}px, 0) translate3d(-50%, -50%, 0)`
    // this.predictedMouseIndicator.style.display = e.predictionEnabled ? "block" : "none"
    // // This hides the circle from the UI at the top-left corner when refreshing the page with the cursor outside of the window
    // if (predictedPoint.x === 0 && predictedPoint.y === 0) {
    //   this.predictedMouseIndicator.style.display = "none"
    //   return
    // }
    // if (!e.predictionEnabled) {
    //   this.mouseTrajectoryLine.style.display = "none"
    //   return
    // }
    // const dx = predictedPoint.x - currentPoint.x
    // const dy = predictedPoint.y - currentPoint.y
    // const length = Math.sqrt(dx * dx + dy * dy)
    // const angle = (Math.atan2(dy, dx) * 180) / Math.PI
    // // Use a single transform to position, rotate, and scale the line,
    // // avoiding reflow from top/left changes.
    // this.mouseTrajectoryLine.style.transform = `translate3d(${currentPoint.x}px, ${currentPoint.y}px, 0) rotate(${angle}deg)`
    // this.mouseTrajectoryLine.style.width = `${length}px`
    // this.mouseTrajectoryLine.style.display = "block"
  }

  private handleScrollTrajectoryUpdate = (e: ScrollTrajectoryUpdateEvent) => {
    // this.devtoolsSettings.logging.scrollTrajectoryUpdate && this.logEvent(e, "cyan")
    // if (!this.scrollTrajectoryLine) return
    // const dx = e.predictedPoint.x - e.currentPoint.x
    // const dy = e.predictedPoint.y - e.currentPoint.y
    // const length = Math.sqrt(dx * dx + dy * dy)
    // const angle = (Math.atan2(dy, dx) * 180) / Math.PI
    // this.scrollTrajectoryLine.style.transform = `translate3d(${e.currentPoint.x}px, ${e.currentPoint.y}px, 0) rotate(${angle}deg)`
    // this.scrollTrajectoryLine.style.width = `${length}px`
    // this.scrollTrajectoryLine.style.display = "block"
  }

  private handleSettingsChanged = (e: ManagerSettingsChangedEvent) => {
    this.devtoolsSettings.logging.managerSettingsChanged && this.logEvent(e, "grey")

    // this.controlPanel?.updateControlsStateFromCode(
    //   e.managerData.globalSettings,
    //   this.devtoolsSettings
    // )
  }

  private handleElementDataUpdated = (e: ElementDataUpdatedEvent) => {
    this.devtoolsSettings.logging.elementDataUpdated && this.logEvent(e, "purple")

    // Check if 'bounds' is included in the updatedProps array
    if (e.updatedProps.includes("bounds")) {
      // this.createOrUpdateElementOverlay(e.elementData)
    }

    // Check if 'visibility' is included in the updatedProps array
    if (e.updatedProps.includes("visibility")) {
      if (!e.elementData.isIntersectingWithViewport) {
        this.removeElementOverlay(e.elementData)
      }
      // this.controlPanel?.updateElementVisibilityStatus(e.elementData)
    }
  }

  public alterDebuggerSettings(props?: Partial<DevtoolsSettings>) {
    if (!props) return

    // Handle special cases with side effects
    if (shouldUpdateSetting(props.showNameTags, this.devtoolsSettings.showNameTags)) {
      this.devtoolsSettings.showNameTags = props.showNameTags!
      // this.toggleNameTagVisibility()
    }

    if (shouldUpdateSetting(props.showDebugger, this.devtoolsSettings.showDebugger)) {
      this.devtoolsSettings.showDebugger = props.showDebugger!
      if (this.devtoolsSettings.showDebugger) {
        // ForesightDebugger.initialize(this.foresightManagerInstance)
      } else {
        this.cleanup()
      }
    }

    // Handle simple property updates
    if (
      shouldUpdateSetting(
        props.isControlPanelDefaultMinimized,
        this.devtoolsSettings.isControlPanelDefaultMinimized
      )
    ) {
      this.devtoolsSettings.isControlPanelDefaultMinimized = props.isControlPanelDefaultMinimized!
    }
    if (shouldUpdateSetting(props.sortElementList, this.devtoolsSettings.sortElementList)) {
      this.devtoolsSettings.sortElementList = props.sortElementList!
    }

    // Handle logging settings
    if (props.logging) {
      if (
        shouldUpdateSetting(props.logging.logLocation, this.devtoolsSettings.logging.logLocation)
      ) {
        this.devtoolsSettings.logging.logLocation = props.logging.logLocation
      }
      if (
        shouldUpdateSetting(
          props.logging.callbackCompleted,
          this.devtoolsSettings.logging.callbackCompleted
        )
      ) {
        this.devtoolsSettings.logging.callbackCompleted = props.logging.callbackCompleted
      }
      if (
        shouldUpdateSetting(
          props.logging.callbackInvoked,
          this.devtoolsSettings.logging.callbackInvoked
        )
      ) {
        this.devtoolsSettings.logging.callbackInvoked = props.logging.callbackInvoked
      }
      if (
        shouldUpdateSetting(
          props.logging.elementDataUpdated,
          this.devtoolsSettings.logging.elementDataUpdated
        )
      ) {
        this.devtoolsSettings.logging.elementDataUpdated = props.logging.elementDataUpdated
      }
      if (
        shouldUpdateSetting(
          props.logging.elementRegistered,
          this.devtoolsSettings.logging.elementRegistered
        )
      ) {
        this.devtoolsSettings.logging.elementRegistered = props.logging.elementRegistered
      }
      if (
        shouldUpdateSetting(
          props.logging.elementUnregistered,
          this.devtoolsSettings.logging.elementUnregistered
        )
      ) {
        this.devtoolsSettings.logging.elementUnregistered = props.logging.elementUnregistered
      }
      if (
        shouldUpdateSetting(
          props.logging.managerSettingsChanged,
          this.devtoolsSettings.logging.managerSettingsChanged
        )
      ) {
        this.devtoolsSettings.logging.managerSettingsChanged = props.logging.managerSettingsChanged
      }
      if (
        shouldUpdateSetting(
          props.logging.mouseTrajectoryUpdate,
          this.devtoolsSettings.logging.mouseTrajectoryUpdate
        )
      ) {
        this.devtoolsSettings.logging.mouseTrajectoryUpdate = props.logging.mouseTrajectoryUpdate
      }
      if (
        shouldUpdateSetting(
          props.logging.scrollTrajectoryUpdate,
          this.devtoolsSettings.logging.scrollTrajectoryUpdate
        )
      ) {
        this.devtoolsSettings.logging.scrollTrajectoryUpdate = props.logging.scrollTrajectoryUpdate
      }
    }
    console.log(this.foresightManagerInstance.getManagerData)
  }

  private removeElementOverlay(elementData: ForesightElementData) {
    // const overlays = this.debugElementOverlays.get(elementData.element)
    // if (overlays) {
    //   overlays.expandedOverlay.remove()
    //   overlays.nameLabel.remove()
    //   this.debugElementOverlays.delete(elementData.element)
    // }
  }

  private showCallbackAnimation(elementData: ForesightElementData, hitType: CallbackHitType) {
    // const { element, elementBounds } = elementData
    // const existingAnimation = this.callbackAnimations.get(element)
    // // If an animation is already running for this element, reset it
    // if (existingAnimation) {
    //   clearTimeout(existingAnimation.timeoutId)
    //   existingAnimation.overlay.remove()
    //   this.animationPositionObserver?.unobserve(element)
    //   this.callbackAnimations.delete(element)
    // }
    // const animationOverlay = createAndAppendElement("div", this.debugContainer, {
    //   className: "jsforesight-callback-indicator",
    // })
    // const { left, top, right, bottom } = elementBounds.expandedRect
    // const width = right - left
    // const height = bottom - top
    // animationOverlay.style.display = "block"
    // animationOverlay.style.transform = `translate3d(${left}px, ${top}px, 0)`
    // animationOverlay.style.width = `${width}px`
    // animationOverlay.style.height = `${height}px`
    // switch (hitType.kind) {
    //   case "mouse":
    //     animationOverlay.style.borderColor = "#3b82f6" // Blue - matches trajectory line
    //     break
    //   case "scroll":
    //     animationOverlay.style.borderColor = "#22c55e" // Green - matches scroll trajectory line
    //     break
    //   case "tab":
    //     animationOverlay.style.borderColor = "#f97316" // Orange
    //     break
    //   default:
    //     hitType satisfies never
    // }
    // animationOverlay.classList.add("animate")
    // const timeoutId = setTimeout(() => {
    //   animationOverlay.remove()
    //   this.callbackAnimations.delete(element)
    //   this.animationPositionObserver?.unobserve(element)
    // }, 500)
    // this.callbackAnimations.set(element, {
    //   hitSlop: elementData.elementBounds.hitSlop,
    //   overlay: animationOverlay,
    //   timeoutId: timeoutId,
    // })
    // this.animationPositionObserver?.observe(element)
  }

  public cleanup() {
    this.managerSubscriptionsController?.abort()
    // this.controlPanel?.cleanup()
    // this.shadowHost?.remove()
    // this.debugElementOverlays.clear()
    // this.shadowHost = null!
    // this.shadowRoot = null!
    // this.debugContainer = null!
    // this.predictedMouseIndicator = null
    // this.mouseTrajectoryLine = null
    // this.scrollTrajectoryLine = null
    // this.controlPanel = null!
  }
}
