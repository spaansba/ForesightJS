import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import type { DeepPartial, DevtoolsSettings, LogEvents } from "../types/types"

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

  private static _instance: ForesightDevtools | null = null

  public devtoolsSettings: Required<DevtoolsSettings> = {
    showDebugger: true,
    isControlPanelDefaultMinimized: false,
    showNameTags: true,
    sortElementList: "visibility",
    logging: {
      logLocation: "controlPanel",
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

  private constructor() {
    super()
  }

  private static createAndAppendInstance(): void {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return
    }
    ForesightDevtools._instance = document.createElement("foresight-devtools") as ForesightDevtools
    document.body.appendChild(ForesightDevtools._instance)
  }

  public static initialize(props?: DeepPartial<DevtoolsSettings>): ForesightDevtools {
    if (!ForesightDevtools._instance) {
      ForesightDevtools.createAndAppendInstance()
    }

    // If still no instance after create attempt (SSR case), return early
    if (!ForesightDevtools._instance) {
      return ForesightDevtools._instance!
    }

    const devtools = ForesightDevtools._instance
    devtools.isInitialized = true

    if (props !== undefined) {
      devtools.alterDevtoolsSettings(props)
    }

    return devtools
  }

  public static get instance(): ForesightDevtools {
    if (!ForesightDevtools._instance) {
      return ForesightDevtools.initialize()
    }
    return ForesightDevtools._instance!
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.cleanup()
  }

  private shouldUpdateSetting<T>(newValue: T | undefined, currentValue: T): newValue is T {
    return newValue !== undefined && newValue !== currentValue
  }

  private updateLoggingSetting<K extends keyof LogEvents>(
    key: K,
    newValue: LogEvents[K] | undefined
  ): void {
    if (this.shouldUpdateSetting(newValue, this.devtoolsSettings.logging[key])) {
      this.devtoolsSettings.logging[key] = newValue!
    }
  }

  public alterDevtoolsSettings(props?: DeepPartial<DevtoolsSettings>) {
    if (!props) return

    if (this.shouldUpdateSetting(props.showNameTags, this.devtoolsSettings.showNameTags)) {
      this.devtoolsSettings.showNameTags = props.showNameTags!
      this.dispatchEvent(
        new CustomEvent("showNameTagsChanged", {
          detail: { showNameTags: props.showNameTags! },
          bubbles: true,
        })
      )
    }

    if (this.shouldUpdateSetting(props.showDebugger, this.devtoolsSettings.showDebugger)) {
      this.devtoolsSettings.showDebugger = props.showDebugger!
      this.requestUpdate()
    }

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
      
      this.updateLoggingSetting("callbackCompleted", props.logging.callbackCompleted)
      this.updateLoggingSetting("callbackInvoked", props.logging.callbackInvoked)
      this.updateLoggingSetting("elementDataUpdated", props.logging.elementDataUpdated)
      this.updateLoggingSetting("elementRegistered", props.logging.elementRegistered)
      this.updateLoggingSetting("elementUnregistered", props.logging.elementUnregistered)
      this.updateLoggingSetting("managerSettingsChanged", props.logging.managerSettingsChanged)
      this.updateLoggingSetting("mouseTrajectoryUpdate", props.logging.mouseTrajectoryUpdate)
      this.updateLoggingSetting("scrollTrajectoryUpdate", props.logging.scrollTrajectoryUpdate)
    }
  }

  private cleanup() {
    // Just trigger a re-render to hide the components
    this.requestUpdate()
  }

  render() {
    if (!this.isInitialized || !this.devtoolsSettings.showDebugger) {
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
