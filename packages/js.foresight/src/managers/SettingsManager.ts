import {
  MAX_SCROLL_MARGIN,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_SCROLL_MARGIN,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
} from "../constants"
import { areRectsEqual, normalizeHitSlop } from "../helpers/rectAndHitSlop"
import type {
  ForesightManagerSettings,
  NumericSettingKeys,
  UpdatedManagerSetting,
  UpdateForsightManagerSettings,
} from "../types/types"

const NUMERIC_SETTING_RANGES = {
  trajectoryPredictionTime: [MIN_TRAJECTORY_PREDICTION_TIME, MAX_TRAJECTORY_PREDICTION_TIME],
  scrollMargin: [MIN_SCROLL_MARGIN, MAX_SCROLL_MARGIN],
  tabOffset: [MIN_TAB_OFFSET, MAX_TAB_OFFSET],
} satisfies Record<NumericSettingKeys, [min: number, max: number]>

const NUMERIC_SETTING_KEYS = Object.keys(NUMERIC_SETTING_RANGES) as NumericSettingKeys[]

const PLAIN_SETTING_KEYS = [
  "enableMousePrediction",
  "enableScrollPrediction",
  "enableTabPrediction",
  "setDataAttributes",
  "touchDeviceStrategy",
  "minimumConnectionType",
] satisfies Exclude<keyof ForesightManagerSettings, NumericSettingKeys | "defaultHitSlop">[]

/**
 * Apply settings changes at runtime. Numeric settings are clamped to their
 * range. Returns the list of changed settings; the caller derives which side
 * effects to run from the set of changed keys.
 */
export const applySettingsChanges = (
  settings: ForesightManagerSettings,
  props: Partial<UpdateForsightManagerSettings> | undefined
): UpdatedManagerSetting[] => {
  const changedSettings: UpdatedManagerSetting[] = []

  if (!props) {
    return changedSettings
  }

  const apply = <K extends keyof ForesightManagerSettings>(
    setting: K,
    newValue: ForesightManagerSettings[K] | undefined
  ): void => {
    const oldValue = settings[setting]
    if (newValue === undefined || newValue === oldValue) {
      return
    }

    settings[setting] = newValue
    changedSettings.push({ setting, oldValue, newValue } as UpdatedManagerSetting)
  }

  for (const key of NUMERIC_SETTING_KEYS) {
    const value = props[key]
    const [min, max] = NUMERIC_SETTING_RANGES[key]
    apply(key, value === undefined ? value : Math.min(Math.max(value, min), max))
  }

  for (const key of PLAIN_SETTING_KEYS) {
    apply(key, props[key])
  }

  if (props.defaultHitSlop !== undefined) {
    const normalized = normalizeHitSlop(props.defaultHitSlop)
    if (!areRectsEqual(settings.defaultHitSlop, normalized)) {
      apply("defaultHitSlop", normalized)
    }
  }

  return changedSettings
}
