import {
  FORESIGHT_STRATEGY,
  type ForesightClientOptions,
  type ForesightLinkOptions,
} from "../types"
import { parseHitSlop } from "../hitSlop"

export const shouldRegister = (
  anchor: HTMLAnchorElement,
  options: ForesightClientOptions
): boolean => {
  const attrValue = anchor.dataset.astroPrefetch

  if (attrValue === undefined) {
    return Boolean(options.prefetchAll) && options.defaultStrategy === FORESIGHT_STRATEGY
  }

  return attrValue === FORESIGHT_STRATEGY
}

const optionsFromDataset = (anchor: HTMLAnchorElement): ForesightLinkOptions => {
  const dataset = anchor.dataset
  const parsed: ForesightLinkOptions = {}
  const hitSlop = parseHitSlop(dataset.foresightHitSlop)

  if (hitSlop !== undefined) {
    parsed.hitSlop = hitSlop
  }

  if (dataset.foresightName) {
    parsed.name = dataset.foresightName
  }

  if (dataset.foresightReactivateAfter !== undefined) {
    const reactivateAfter = Number(dataset.foresightReactivateAfter)

    if (!Number.isNaN(reactivateAfter)) {
      parsed.reactivateAfter = reactivateAfter
    }
  }

  if (dataset.foresightEnabled !== undefined) {
    parsed.enabled = dataset.foresightEnabled !== "false"
  }

  return parsed
}

/**
 * Merge order (weakest to strongest): `linkDefaults`, matching `rules` in
 * declaration order, `data-foresight-*` attributes.
 */
export const optionsForAnchor = (
  anchor: HTMLAnchorElement,
  options: ForesightClientOptions
): ForesightLinkOptions => {
  const merged: ForesightLinkOptions = { ...options.linkDefaults }

  for (const { selector, ...ruleOptions } of options.rules ?? []) {
    if (anchor.matches(selector)) {
      Object.assign(merged, ruleOptions)
    }
  }

  return Object.assign(merged, optionsFromDataset(anchor))
}
