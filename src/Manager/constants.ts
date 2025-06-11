import type { CallbackHits } from "../types/types"

//IMPORTANT: when altering these values change the type jsDocs/actual docs for BaseForesightManagerProps
export const MIN_TRAJECTORY_PREDICTION_TIME = 10
export const MAX_TRAJECTORY_PREDICTION_TIME = 200
export const DEFAULT_TRAJECTORY_PREDICTION_TIME = 120
export const TRAJECTORY_PREDICTION_TIME_UNIT = "ms"

export const MIN_POSITION_HISTORY_SIZE = 2
export const MAX_POSITION_HISTORY_SIZE = 30
export const DEFAULT_POSITION_HISTORY_SIZE = 8
export const POSITION_HISTORY_SIZE_UNIT = "points"

export const MIN_TAB_OFFSET = 0
export const MAX_TAB_OFFSET = 20
export const DEFAULT_TAB_OFFSET = 2
export const TAB_OFFSET_UNIT = "tabs"

export const MIN_HITSLOP = 0
export const MAX_HITSLOP = 2000
export const DEFAULT_HITSLOP = 0

export const DEFAULT_ENABLE_TAB_PREDICTION = true
export const DEFAULT_ENABLE_MOUSE_PREDICTION = true
export const DEFAULT_IS_DEBUGGER_MINIMIZED = false
export const DEFAULT_SHOW_NAME_TAGS = true
export const DEFAULT_IS_DEBUG = false

export const DEFAULT_CALLBACKHITS: CallbackHits = {
  mouse: {
    hover: 0,
    trajectory: 0,
  },
  tab: {
    forwards: 0,
    reverse: 0,
  },
  total: 0,
}
