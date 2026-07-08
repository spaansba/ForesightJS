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
 * Checks if a setting should be updated.
 * Returns true if the newValue is defined and different from the currentValue.
 * Uses a type predicate to narrow the type of newValue in the calling scope.
 */
const shouldUpdateSetting = <T>(
  newValue: T | undefined,
  currentValue: T
): newValue is NonNullable<T> => {
  // NonNullable<T> ensures that if T itself could be undefined (e.g. T = number | undefined),
  // the predicate narrows to the non-undefined part (e.g. number).
  // If T is already non-nullable (e.g. T = number), it remains T (e.g. number).
  return newValue !== undefined && currentValue !== newValue
}

/**
 * Updates a numeric setting with clamping.
 * Returns true if the setting was changed.
 */
const updateNumericSetting = (
  settings: ForesightManagerSettings,
  key: NumericSettingKeys,
  newValue: number | undefined
): boolean => {
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
const updateBooleanSetting = (
  settings: ForesightManagerSettings,
  key: ManagerBooleanSettingKeys,
  newValue: boolean | undefined
): boolean => {
  if (!shouldUpdateSetting(newValue, settings[key])) {
    return false
  }

  settings[key] = newValue as boolean

  return true
}

/**
 * Apply settings changes at runtime. Returns the list of changed settings; the
 * caller derives which side effects to run from the set of changed keys.
 */
export const applySettingsChanges = (
  settings: ForesightManagerSettings,
  props: Partial<UpdateForsightManagerSettings> | undefined
): UpdatedManagerSetting[] => {
  const changedSettings: UpdatedManagerSetting[] = []

  if (!props) {
    return changedSettings
  }

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
    }
  }

  const booleanKeys: ManagerBooleanSettingKeys[] = [
    "enableMousePrediction",
    "enableScrollPrediction",
    "enableTabPrediction",
    "enableManagerLogging",
    "setDataAttributes",
  ]

  for (const key of booleanKeys) {
    const oldValue = settings[key]
    if (updateBooleanSetting(settings, key, props[key])) {
      changedSettings.push({
        setting: key,
        oldValue,
        newValue: settings[key],
      } as UpdatedManagerSetting)
    }
  }

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
    }
  }

  if (shouldUpdateSetting(props.touchDeviceStrategy, settings.touchDeviceStrategy)) {
    const oldValue = settings.touchDeviceStrategy
    settings.touchDeviceStrategy = props.touchDeviceStrategy
    changedSettings.push({
      setting: "touchDeviceStrategy",
      oldValue,
      newValue: props.touchDeviceStrategy,
    })
  }

  if (shouldUpdateSetting(props.minimumConnectionType, settings.minimumConnectionType)) {
    const oldValue = settings.minimumConnectionType
    settings.minimumConnectionType = props.minimumConnectionType
    changedSettings.push({
      setting: "minimumConnectionType",
      oldValue,
      newValue: props.minimumConnectionType,
    })
  }

  return changedSettings
}
