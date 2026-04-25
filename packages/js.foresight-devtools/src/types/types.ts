import type { HitSlop, ForesightEvent } from "js.foresight"

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right"

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export type ShowSettings = {
  /**
   * Show the debugger control panel.
   * @default true
   */
  controlPanel: boolean
  /**
   * Show name tags above each registered element.
   * @default true
   */
  nameTags: boolean
  /**
   * Show element hit-slop overlays (the expanded boundary around each registered element).
   *
   * Note: turning this off also hides name tags, since the labels live inside
   * the same overlay host.
   *
   * @default true
   */
  elementOverlays: boolean
  /**
   * Show the predicted mouse trajectory line.
   * @default true
   */
  mouseTrajectory: boolean
  /**
   * Show the predicted scroll trajectory line.
   * @default true
   */
  scrollTrajectory: boolean
}

export type ShowKey = keyof ShowSettings

export const SHOW_KEYS = [
  "controlPanel",
  "nameTags",
  "elementOverlays",
  "mouseTrajectory",
  "scrollTrajectory",
] as const satisfies readonly ShowKey[]

export type DevtoolsSettings = {
  /**
   * Granular visibility flags for the devtools UI.
   *
   * @link https://foresightjs.com/docs/getting_started/debug
   */
  show: ShowSettings

  /**
   * Determines if the debugger control panel should be initialized in a minimized state.
   *
   * @link https://foresightjs.com/docs/getting_started/debug
   *
   * @default false
   */
  isControlPanelDefaultMinimized: boolean
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

  logging: LogEvents & {
    logLocation: LoggingLocations
  }
}

export type LogEvents = {
  [K in ForesightEvent]: boolean
}

export type LoggingLocations = "controlPanel" | "console" | "both" | "none"

export type ControllerTabs = "settings" | "elements" | "logs"

export type SortElementList = "documentOrder" | "visibility" | "insertionOrder"

export type ForesightDevtoolsData = {
  settings: Readonly<DevtoolsSettings>
}

export type DebuggerBooleanSettingKeys = ShowKey

export type ElementOverlays = {
  expandedOverlay: HTMLElement
  nameLabel: HTMLElement
}

export type callbackAnimation = {
  hitSlop: Exclude<HitSlop, number>
  overlay: HTMLElement
  timeoutId: ReturnType<typeof setTimeout>
}

export type SectionStates = {
  mouse: boolean
  keyboard: boolean
  scroll: boolean
  general: boolean
}
