import {
  MAX_POSITION_HISTORY_SIZE,
  MAX_SCROLL_MARGIN,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_POSITION_HISTORY_SIZE,
  MIN_SCROLL_MARGIN,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
} from "../constants"
import { clampNumber } from "../helpers/clampNumber"
import { areRectsEqual, normalizeHitSlop } from "../helpers/rectAndHitSlop"
import { shouldUpdateSetting } from "../helpers/shouldUpdateSetting"
import type {
  ForesightManagerSettings,
  ManagerBooleanSettingKeys,
  NumericSettingKeys,
  UpdatedManagerSetting,
  UpdateForsightManagerSettings,
} from "../types/types"

/** Configuration for numeric settings with their min/max constraints */
const NUMERIC_SETTING_CONFIGS: Record<NumericSettingKeys, { min: number; max: number }> = {
  trajectoryPredictionTime: {
    min: MIN_TRAJECTORY_PREDICTION_TIME,
    max: MAX_TRAJECTORY_PREDICTION_TIME,
  },
  positionHistorySize: {
    min: MIN_POSITION_HISTORY_SIZE,
    max: MAX_POSITION_HISTORY_SIZE,
  },
  scrollMargin: {
    min: MIN_SCROLL_MARGIN,
    max: MAX_SCROLL_MARGIN,
  },
  tabOffset: {
    min: MIN_TAB_OFFSET,
    max: MAX_TAB_OFFSET,
  },
}

/**
 * Updates a numeric setting with clamping.
 * Returns true if the setting was changed.
 */
function updateNumericSetting(
  settings: ForesightManagerSettings,
  key: NumericSettingKeys,
  newValue: number | undefined
): boolean {
  if (!shouldUpdateSetting(newValue, settings[key])) {
    return false
  }

  const { min, max } = NUMERIC_SETTING_CONFIGS[key]
  settings[key] = clampNumber(newValue, min, max, key)
  return true
}

/**
 * Updates a boolean setting.
 * Returns true if the setting was changed.
 */
function updateBooleanSetting(
  settings: ForesightManagerSettings,
  key: ManagerBooleanSettingKeys,
  newValue: boolean | undefined
): boolean {
  if (!shouldUpdateSetting(newValue, settings[key])) {
    return false
  }

  settings[key] = newValue as boolean
  return true
}

/**
 * Apply initial settings during construction (no event emission, no side effects).
 * Mutates the settings object directly.
 */
export function initializeSettings(
  settings: ForesightManagerSettings,
  props: Partial<UpdateForsightManagerSettings>
): void {
  // Numeric settings
  updateNumericSetting(settings, "trajectoryPredictionTime", props.trajectoryPredictionTime)
  updateNumericSetting(settings, "positionHistorySize", props.positionHistorySize)
  updateNumericSetting(settings, "scrollMargin", props.scrollMargin)
  updateNumericSetting(settings, "tabOffset", props.tabOffset)

  // Boolean settings
  updateBooleanSetting(settings, "enableMousePrediction", props.enableMousePrediction)
  updateBooleanSetting(settings, "enableScrollPrediction", props.enableScrollPrediction)
  updateBooleanSetting(settings, "enableTabPrediction", props.enableTabPrediction)
  updateBooleanSetting(settings, "enableManagerLogging", props.enableManagerLogging)

  // Object/special settings
  if (props.defaultHitSlop !== undefined) {
    settings.defaultHitSlop = normalizeHitSlop(props.defaultHitSlop)
  }

  if (props.touchDeviceStrategy !== undefined) {
    settings.touchDeviceStrategy = props.touchDeviceStrategy
  }

  if (props.minimumConnectionType !== undefined) {
    settings.minimumConnectionType = props.minimumConnectionType
  }

  if (props.debug !== undefined) {
    settings.debug = props.debug
  }
}

/**
 * Result of applying settings changes at runtime.
 * Contains the list of changed settings for event emission.
 */
export interface SettingsChangeResult {
  changedSettings: UpdatedManagerSetting[]
  positionHistorySizeChanged: boolean
  scrollPredictionChanged: boolean
  tabPredictionChanged: boolean
  hitSlopChanged: boolean
  touchStrategyChanged: boolean
}

/**
 * Apply settings changes at runtime.
 * Returns information about what changed for the caller to handle side effects.
 */
export function applySettingsChanges(
  settings: ForesightManagerSettings,
  props: Partial<UpdateForsightManagerSettings> | undefined
): SettingsChangeResult {
  const changedSettings: UpdatedManagerSetting[] = []
  let positionHistorySizeChanged = false
  let scrollPredictionChanged = false
  let tabPredictionChanged = false
  let hitSlopChanged = false
  let touchStrategyChanged = false

  if (!props) {
    return {
      changedSettings,
      positionHistorySizeChanged,
      scrollPredictionChanged,
      tabPredictionChanged,
      hitSlopChanged,
      touchStrategyChanged,
    }
  }

  // Numeric settings
  const numericKeys: NumericSettingKeys[] = [
    "trajectoryPredictionTime",
    "positionHistorySize",
    "scrollMargin",
    "tabOffset",
  ]

  for (const key of numericKeys) {
    const oldValue = settings[key]
    if (updateNumericSetting(settings, key, props[key])) {
      changedSettings.push({
        setting: key,
        oldValue,
        newValue: settings[key],
      } as UpdatedManagerSetting)

      if (key === "positionHistorySize") {
        positionHistorySizeChanged = true
      }
    }
  }

  // Boolean settings
  const booleanKeys: ManagerBooleanSettingKeys[] = [
    "enableMousePrediction",
    "enableScrollPrediction",
    "enableTabPrediction",
  ]

  for (const key of booleanKeys) {
    const oldValue = settings[key]
    if (updateBooleanSetting(settings, key, props[key])) {
      changedSettings.push({
        setting: key,
        oldValue,
        newValue: settings[key],
      } as UpdatedManagerSetting)

      if (key === "enableScrollPrediction") {
        scrollPredictionChanged = true
      }
      if (key === "enableTabPrediction") {
        tabPredictionChanged = true
      }
    }
  }

  // HitSlop
  if (props.defaultHitSlop !== undefined) {
    const oldHitSlop = settings.defaultHitSlop
    const normalizedNewHitSlop = normalizeHitSlop(props.defaultHitSlop)

    if (!areRectsEqual(oldHitSlop, normalizedNewHitSlop)) {
      settings.defaultHitSlop = normalizedNewHitSlop
      changedSettings.push({
        setting: "defaultHitSlop",
        oldValue: oldHitSlop,
        newValue: normalizedNewHitSlop,
      })
      hitSlopChanged = true
    }
  }

  // Touch strategy
  if (props.touchDeviceStrategy !== undefined) {
    const oldValue = settings.touchDeviceStrategy
    settings.touchDeviceStrategy = props.touchDeviceStrategy
    changedSettings.push({
      setting: "touchDeviceStrategy",
      oldValue,
      newValue: props.touchDeviceStrategy,
    })
    touchStrategyChanged = true
  }

  // Minimum connection type
  if (props.minimumConnectionType !== undefined) {
    const oldValue = settings.minimumConnectionType
    settings.minimumConnectionType = props.minimumConnectionType
    changedSettings.push({
      setting: "minimumConnectionType",
      oldValue,
      newValue: props.minimumConnectionType,
    })
  }

  return {
    changedSettings,
    positionHistorySizeChanged,
    scrollPredictionChanged,
    tabPredictionChanged,
    hitSlopChanged,
    touchStrategyChanged,
  }
}
