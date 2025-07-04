import type { HitSlop, UpdateForsightManagerSettings } from "js.foresight"
import type { ForesightEventMap } from "js.foresight/types/types"

export type DebuggerSettings = {
  /**
   * Whether to show visual debugging information on the screen.
   * This includes overlays for elements, hit slop areas, the predicted mouse path and a debug control panel.
   * @default true
   */
  showDebugger: boolean

  /**
   * Determines if the debugger control panel should be initialized in a minimized state.
   *
   * @link https://foresightjs.com/docs/getting_started/debug
   *
   * @default false
   */
  isControlPanelDefaultMinimized: boolean
  /**
   * Determines if name tags should be displayed visually above each registered element.
   * This is a helpful visual aid for identifying which elements are being tracked.
   *
   * @link https://foresightjs.com/docs/getting_started/debug
   *
   * @default false
   */
  showNameTags: boolean
  /**
   * Specifies the default sorting order for the list of registered elements in the debugger panel.
   * - `'visibility'`: Sorts elements by their viewport visibility (visible elements first),
   *   with a secondary documentOrder sort.
   * - `'documentOrder'`: Sorts elements based on their order of appearance in the
   *   document's structure (matching the HTML source).
   * - `'insertionOrder'`: Sorts by registration order.
   *
   *
   * @link https://foresightjs.com/docs/getting_started/debug
   *
   * @default 'visibility'
   *
   */
  sortElementList: SortElementList

  logging: {
    logLocation?: LoggingLocations
    logElementRegistered?: boolean
    logElementUnregistered?: boolean
    logElementDataUpdated?: boolean
    logCallbackFired?: boolean
    logMouseTrajectoryUpdate?: boolean
    logScrollTrajectoryUpdate?: boolean
    logManagerSettingsChanged?: boolean
  }
}

export type LoggingLocations = "controlPanel" | "console"

export type ControllerTabs = "settings" | "elements" | "logs"

export type SortElementList = "documentOrder" | "visibility" | "insertionOrder"

export type ForesightDebuggerData = {
  settings: Readonly<DebuggerSettings>
}

export type DebuggerBooleanSettingKeys = {
  [K in keyof DebuggerSettings]: Required<DebuggerSettings>[K] extends boolean ? K : never
}[keyof DebuggerSettings]

export type ElementOverlays = {
  expandedOverlay: HTMLElement
  nameLabel: HTMLElement
}

export type callbackAnimation = {
  hitSlop: Exclude<HitSlop, number>
  overlay: HTMLElement
  timeoutId: ReturnType<typeof setTimeout>
}

export type NumericSettingKeys = keyof {
  [K in keyof UpdateForsightManagerSettings]: UpdateForsightManagerSettings[K] extends number
    ? K
    : never
}

export type ManagerBooleanSettingKeys = keyof {
  [K in keyof UpdateForsightManagerSettings]: UpdateForsightManagerSettings[K] extends boolean
    ? K
    : never
}

export type SectionStates = {
  mouse: boolean
  keyboard: boolean
  scroll: boolean
  general: boolean
}
