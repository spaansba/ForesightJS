import type { AstroConfig } from "astro"
import type { HitSlop, UpdateForsightManagerSettings } from "js.foresight"

export const FORESIGHT_STRATEGY = "foresight"

export type AstroPrefetchStrategy = NonNullable<
  Extract<AstroConfig["prefetch"], object>["defaultStrategy"]
>

export type ForesightLinkOptions = {
  hitSlop?: HitSlop
  name?: string
  reactivateAfter?: number
  enabled?: boolean
}

/**
 * Applies {@link ForesightLinkOptions} to every registered link matching
 * `selector`. Rules are applied in order, later rules win, and
 * `data-foresight-*` attributes win over all rules.
 */
export type ForesightRule = ForesightLinkOptions & {
  selector: string
}

export type ForesightClientOptions = {
  /**
   * Mirrors Astro's `prefetch.prefetchAll`: also prefetch links without a
   * `data-astro-prefetch` attribute, using `defaultStrategy`. With
   * `defaultStrategy: "foresight"` those links are registered with foresight,
   * otherwise the value is forwarded to Astro's own prefetch config.
   */
  prefetchAll?: boolean
  /**
   * Strategy for links covered by `prefetchAll`. Native values are forwarded
   * to Astro's `prefetch.defaultStrategy`, `"foresight"` makes foresight
   * register those links itself. Links with a native or bare
   * `data-astro-prefetch` attribute always stay with Astro's own script.
   */
  defaultStrategy?: AstroPrefetchStrategy | typeof FORESIGHT_STRATEGY
  /** Settings forwarded to `ForesightManager.initialize`. */
  manager?: Partial<UpdateForsightManagerSettings>
  /** Base options for every link registered by this integration. */
  linkDefaults?: ForesightLinkOptions
  /** Selector-based option overrides, applied on top of `linkDefaults`. */
  rules?: ForesightRule[]
}

export type ForesightAstroOptions = ForesightClientOptions & {
  devtools?: boolean
}
