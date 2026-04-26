import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import {
  SHOW_KEYS,
  type DeepPartial,
  type DevtoolsSettings,
  type LogEvents,
  type ShowKey,
  type ShowSettings,
} from "../types/types"

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
    show: {
      controlPanel: true,
      nameTags: true,
      elementOverlays: true,
      mouseTrajectory: true,
      scrollTrajectory: true,
    },
    isControlPanelDefaultMinimized: false,
    sortElementList: "visibility",
    logging: {
      logLocation: "controlPanel",
      callbackCompleted: true,
      elementReactivated: true,
      callbackInvoked: true,
      elementDataUpdated: false,
      elementRegistered: false,
      elementUnregistered: false,
      managerSettingsChanged: true,
      mouseTrajectoryUpdate: false,
      scrollTrajectoryUpdate: false,
      deviceStrategyChanged: true,
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

    if (!ForesightDevtools._instance) {
      return ForesightDevtools._instance!
    }

    const devtools = ForesightDevtools._instance
    devtools.isInitialized = true
    devtools.alterDevtoolsSettings(props)

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

  private updateShowSetting<K extends ShowKey>(
    key: K,
    newValue: ShowSettings[K] | undefined
  ): boolean {
    if (this.shouldUpdateSetting(newValue, this.devtoolsSettings.show[key])) {
      this.devtoolsSettings.show[key] = newValue!

      return true
    }

    return false
  }

  /**
   * Set every flag inside `show` to the same value. Useful for "turn the
   * entire devtools UI off" without listing each key.
   */
  public setAllShow(value: boolean) {
    const show = Object.fromEntries(SHOW_KEYS.map(k => [k, value])) as ShowSettings
    this.alterDevtoolsSettings({ show })
  }

  public alterDevtoolsSettings(props?: DeepPartial<DevtoolsSettings>) {
    if (props === undefined) {
      return
    }

    if (props.show) {
      let needsUpdate = false
      for (const key of SHOW_KEYS) {
        if (this.updateShowSetting(key, props.show[key])) {
          needsUpdate = true
        }
      }
      if (needsUpdate) {
        this.requestUpdate()
      }
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
      this.updateLoggingSetting("deviceStrategyChanged", props.logging.deviceStrategyChanged)
    }
  }

  private cleanup() {
    // Just trigger a re-render to hide the components
    this.requestUpdate()
  }

  render() {
    if (!this.isInitialized) {
      return html``
    }

    const { show } = this.devtoolsSettings

    return html`
      ${show.controlPanel ? html`<control-panel></control-panel>` : ""}
      <debug-overlay
        .showElementOverlays=${show.elementOverlays}
        .showMouseTrajectory=${show.mouseTrajectory}
        .showScrollTrajectory=${show.scrollTrajectory}
        .showNameTags=${show.nameTags}
      ></debug-overlay>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "foresight-devtools": ForesightDevtools
  }
}
