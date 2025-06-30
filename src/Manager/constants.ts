import type { SortElementList } from "../types/types"

//IMPORTANT: when altering these values change the type jsDocs/actual docs for BaseForesightManagerProps
export const MIN_TRAJECTORY_PREDICTION_TIME: number = 10
export const MAX_TRAJECTORY_PREDICTION_TIME: number = 200
export const DEFAULT_TRAJECTORY_PREDICTION_TIME: number = 120
export const TRAJECTORY_PREDICTION_TIME_UNIT: string = "ms"

export const MIN_POSITION_HISTORY_SIZE: number = 2
export const MAX_POSITION_HISTORY_SIZE: number = 30
export const DEFAULT_POSITION_HISTORY_SIZE: number = 8
export const POSITION_HISTORY_SIZE_UNIT: string = "points"

export const MIN_TAB_OFFSET: number = 0
export const MAX_TAB_OFFSET: number = 20
export const DEFAULT_TAB_OFFSET: number = 2
export const TAB_OFFSET_UNIT: string = "tabs"

export const MIN_HITSLOP: number = 0
export const MAX_HITSLOP: number = 2000
export const DEFAULT_HITSLOP: number = 0

export const DEFAULT_SCROLL_MARGIN: number = 150
export const MIN_SCROLL_MARGIN: number = 30
export const MAX_SCROLL_MARGIN: number = 300
export const SCROLL_MARGIN_UNIT: string = "px"

export const DEFAULT_ENABLE_TAB_PREDICTION: boolean = true
export const DEFAULT_ENABLE_MOUSE_PREDICTION: boolean = true
export const DEFAULT_ENABLE_SCROLL_PREDICTION: boolean = true
export const DEFAULT_IS_DEBUGGER_MINIMIZED: boolean = false
export const DEFAULT_SHOW_NAME_TAGS: boolean = true
export const DEFAULT_SHOW_DEBUGGER: boolean = true
export const DEFAULT_SORT_ELEMENT_LIST: SortElementList = "visibility"
