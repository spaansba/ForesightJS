import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import type {
  ElementDataUpdatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
  ForesightManager,
  ManagerSettingsChangedEvent,
  MouseTrajectoryUpdateEvent,
  ScrollTrajectoryUpdateEvent,
} from "js.foresight"
import type { CallbackCompletedEvent, CallbackInvokedEvent } from "packages/js.foresight/dist"
import type { DevtoolsSettings } from "../types/types"

import "./control-panel/control-panel"
import "./debug-overlay/debug-overlay"

@customElement("foresight-devtools")
export class ForesightDevtools extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }
    `,
  ]

  @state() private isInitialized = false

  private managerSubscriptionsController: AbortController | null = null
  private foresightManagerInstance: ForesightManager | null = null
  private debugOverlay: any = null
  private static _instance: ForesightDevtools | null = null

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
      managerSettingsChanged: true,
      mouseTrajectoryUpdate: false,
      scrollTrajectoryUpdate: false,
    },
  }

  public static initialize(
    foresightManager: ForesightManager,
    props?: Partial<DevtoolsSettings>
  ): ForesightDevtools {
    if (!ForesightDevtools._instance) {
      ForesightDevtools._instance = document.createElement(
        "foresight-devtools"
      ) as ForesightDevtools
      document.body.appendChild(ForesightDevtools._instance)
    }

    const devtools = ForesightDevtools._instance
    devtools.foresightManagerInstance = foresightManager
    devtools.subscribeToManagerEvents()
    devtools.isInitialized = true

    if (props !== undefined) {
      devtools.alterDebuggerSettings(props)
    }

    return devtools
  }

  public static get instance(): ForesightDevtools {
    if (!ForesightDevtools._instance) {
      throw new Error("ForesightDevtools must be initialized before accessing instance")
    }
    return ForesightDevtools._instance
  }

  connectedCallback() {
    super.connectedCallback()

    requestAnimationFrame(() => {
      this.debugOverlay = this.shadowRoot?.querySelector("debug-overlay")
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.cleanup()
  }

  private subscribeToManagerEvents() {
    if (!this.foresightManagerInstance) return

    this.managerSubscriptionsController = new AbortController()
    const signal = this.managerSubscriptionsController.signal
    const manager = this.foresightManagerInstance

    manager.addEventListener("elementRegistered", this.handleRegisterElement, { signal })
    manager.addEventListener("elementDataUpdated", this.handleElementDataUpdated, { signal })
    manager.addEventListener("mouseTrajectoryUpdate", this.handleMouseTrajectoryUpdate, { signal })
    manager.addEventListener("scrollTrajectoryUpdate", this.handleScrollTrajectoryUpdate, {
      signal,
    })
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

  private handleElementDataUpdated = (e: ElementDataUpdatedEvent) => {
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
    }
  }

  private shouldUpdateSetting<T>(newValue: T | undefined, currentValue: T): boolean {
    return newValue !== undefined && newValue !== currentValue
  }

  public alterDebuggerSettings(props?: Partial<DevtoolsSettings>) {
    if (!props) return

    // Handle special cases with side effects
    if (this.shouldUpdateSetting(props.showNameTags, this.devtoolsSettings.showNameTags)) {
      this.devtoolsSettings.showNameTags = props.showNameTags!
      if (this.debugOverlay) {
        this.debugOverlay.updateNameTagVisibility(this.devtoolsSettings.showNameTags)
      }
      this.dispatchEvent(
        new CustomEvent("debuggerSettingsChanged", {
          detail: { devtoolsSettings: this.devtoolsSettings },
        })
      )
    }

    if (this.shouldUpdateSetting(props.showDebugger, this.devtoolsSettings.showDebugger)) {
      this.devtoolsSettings.showDebugger = props.showDebugger!
      if (!this.devtoolsSettings.showDebugger) {
        this.cleanup()
      }
    }

    // Handle simple property updates
    if (
      this.shouldUpdateSetting(
        props.isControlPanelDefaultMinimized,
        this.devtoolsSettings.isControlPanelDefaultMinimized
      )
    ) {
      this.devtoolsSettings.isControlPanelDefaultMinimized = props.isControlPanelDefaultMinimized!
    }
    if (this.shouldUpdateSetting(props.sortElementList, this.devtoolsSettings.sortElementList)) {
      this.devtoolsSettings.sortElementList = props.sortElementList!
    }

    // Handle logging settings
    if (props.logging) {
      if (
        this.shouldUpdateSetting(
          props.logging.logLocation,
          this.devtoolsSettings.logging.logLocation
        )
      ) {
        this.devtoolsSettings.logging.logLocation = props.logging.logLocation
      }
      if (
        this.shouldUpdateSetting(
          props.logging.callbackCompleted,
          this.devtoolsSettings.logging.callbackCompleted
        )
      ) {
        this.devtoolsSettings.logging.callbackCompleted = props.logging.callbackCompleted
      }
      if (
        this.shouldUpdateSetting(
          props.logging.callbackInvoked,
          this.devtoolsSettings.logging.callbackInvoked
        )
      ) {
        this.devtoolsSettings.logging.callbackInvoked = props.logging.callbackInvoked
      }
      if (
        this.shouldUpdateSetting(
          props.logging.elementDataUpdated,
          this.devtoolsSettings.logging.elementDataUpdated
        )
      ) {
        this.devtoolsSettings.logging.elementDataUpdated = props.logging.elementDataUpdated
      }
      if (
        this.shouldUpdateSetting(
          props.logging.elementRegistered,
          this.devtoolsSettings.logging.elementRegistered
        )
      ) {
        this.devtoolsSettings.logging.elementRegistered = props.logging.elementRegistered
      }
      if (
        this.shouldUpdateSetting(
          props.logging.elementUnregistered,
          this.devtoolsSettings.logging.elementUnregistered
        )
      ) {
        this.devtoolsSettings.logging.elementUnregistered = props.logging.elementUnregistered
      }
      if (
        this.shouldUpdateSetting(
          props.logging.managerSettingsChanged,
          this.devtoolsSettings.logging.managerSettingsChanged
        )
      ) {
        this.devtoolsSettings.logging.managerSettingsChanged = props.logging.managerSettingsChanged
      }
      if (
        this.shouldUpdateSetting(
          props.logging.mouseTrajectoryUpdate,
          this.devtoolsSettings.logging.mouseTrajectoryUpdate
        )
      ) {
        this.devtoolsSettings.logging.mouseTrajectoryUpdate = props.logging.mouseTrajectoryUpdate
      }
      if (
        this.shouldUpdateSetting(
          props.logging.scrollTrajectoryUpdate,
          this.devtoolsSettings.logging.scrollTrajectoryUpdate
        )
      ) {
        this.devtoolsSettings.logging.scrollTrajectoryUpdate = props.logging.scrollTrajectoryUpdate
      }
    }
  }

  private cleanup() {
    this.managerSubscriptionsController?.abort()
    this.managerSubscriptionsController = null
  }

  render() {
    if (!this.isInitialized) {
      return html``
    }
    return html`<control-panel></control-panel> <debug-overlay></debug-overlay>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "foresight-devtools": ForesightDevtools
  }
}
