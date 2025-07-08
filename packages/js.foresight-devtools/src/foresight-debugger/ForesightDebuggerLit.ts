import type {
  ElementDataUpdatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
  ForesightManager,
  ManagerSettingsChangedEvent,
  MouseTrajectoryUpdateEvent,
  ScrollTrajectoryUpdateEvent,
} from "js.foresight"
import type { CallbackHitType, ForesightElementData } from "js.foresight/types/types"
import type { CallbackCompletedEvent, CallbackInvokedEvent } from "packages/js.foresight/dist"
import { shouldUpdateSetting } from "../debugger/helpers/shouldUpdateSetting"
import type { DevtoolsSettings } from "../types/types"
import { ForesightDevtools } from "./lit-entry/foresight-devtools"

export class ForesightDebuggerLit {
  private managerSubscriptionsController: AbortController | null = null
  private foresightManagerInstance: ForesightManager
  private static devtools: ForesightDebuggerLit
  private devtoolsElement: any = null
  private debugOverlay: any = null
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
      elementRegistered: true,
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
    ForesightDevtools
    this.devtoolsElement = document.createElement("foresight-devtools")
    document.body.appendChild(this.devtoolsElement)

    // Wait for the next frame to ensure the shadow DOM is ready
    requestAnimationFrame(() => {
      this.debugOverlay = this.devtoolsElement.shadowRoot?.querySelector("debug-overlay")
    })
  }

  private subscribeToManagerEvents() {
    this.managerSubscriptionsController = new AbortController()
    const signal = this.managerSubscriptionsController.signal
    const manager = this.foresightManagerInstance
    manager.addEventListener("elementRegistered", this.handleRegisterElement, { signal })
    manager.addEventListener("elementDataUpdated", this.handleElementDataUpdated, { signal })
    manager.addEventListener("mouseTrajectoryUpdate", this.handleMouseTrajectoryUpdate, { signal })
    manager.addEventListener("scrollTrajectoryUpdate", this.handleScrollTrajectoryUpdate, {
      signal,
    })
    manager.addEventListener("managerSettingsChanged", this.handleSettingsChanged, { signal })
    manager.addEventListener("elementUnregistered", this.handleUnregisterElement, { signal })
    manager.addEventListener("callbackInvoked", this.handleCallbackInvoked, { signal })
    manager.addEventListener("callbackCompleted", this.handleCallbackCompleted, { signal })
  }

  private handleRegisterElement = (e: ElementRegisteredEvent) => {
    if (this.debugOverlay) {
      this.debugOverlay.createOrUpdateElementOverlay(
        e.elementData,
        this.devtoolsSettings.showNameTags
      )
    }
  }

  private handleUnregisterElement = (e: ElementUnregisteredEvent) => {
    if (this.debugOverlay) {
      this.debugOverlay.removeElementOverlay(e.elementData)
    }
  }

  private handleCallbackInvoked = (e: CallbackInvokedEvent) => {
    if (this.debugOverlay) {
      this.debugOverlay.handleCallbackInvoked(e)
    }
  }

  private handleCallbackCompleted = (e: CallbackCompletedEvent) => {
    if (this.debugOverlay) {
      this.debugOverlay.handleCallbackCompleted(e)
    }
  }

  private handleMouseTrajectoryUpdate = (e: MouseTrajectoryUpdateEvent) => {
    if (this.debugOverlay) {
      this.debugOverlay.handleMouseTrajectoryUpdate(e)
    }
  }

  private handleScrollTrajectoryUpdate = (e: ScrollTrajectoryUpdateEvent) => {
    if (this.debugOverlay) {
      this.debugOverlay.handleScrollTrajectoryUpdate(e)
    }
  }

  private handleSettingsChanged = (e: ManagerSettingsChangedEvent) => {
    // this.controlPanel?.updateControlsStateFromCode(
    //   e.managerData.globalSettings,
    //   this.devtoolsSettings
    // )
  }

  private handleElementDataUpdated = (e: ElementDataUpdatedEvent) => {
    // Check if 'bounds' is included in the updatedProps array
    if (e.updatedProps.includes("bounds")) {
      if (this.debugOverlay) {
        this.debugOverlay.createOrUpdateElementOverlay(
          e.elementData,
          this.devtoolsSettings.showNameTags
        )
      }
    }

    // Check if 'visibility' is included in the updatedProps array
    if (e.updatedProps.includes("visibility")) {
      if (!e.elementData.isIntersectingWithViewport) {
        if (this.debugOverlay) {
          this.debugOverlay.removeElementOverlay(e.elementData)
        }
      }
      // this.controlPanel?.updateElementVisibilityStatus(e.elementData)
    }
  }

  public alterDebuggerSettings(props?: Partial<DevtoolsSettings>) {
    if (!props) return

    // Handle special cases with side effects
    if (shouldUpdateSetting(props.showNameTags, this.devtoolsSettings.showNameTags)) {
      this.devtoolsSettings.showNameTags = props.showNameTags!
      if (this.debugOverlay) {
        this.debugOverlay.updateNameTagVisibility(this.devtoolsSettings.showNameTags)
      }
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
    this.devtoolsElement?.remove()
    this.devtoolsElement = null
    this.debugOverlay = null
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
